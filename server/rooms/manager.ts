import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import { defaultSettings, type PartySettings } from "../../shared/settings.js";
import type { ContentHistory } from "../games/history.js";
import { defaultGame } from "../../shared/games.js";
import type { Server, Socket } from "socket.io";
import type {
  Ack,
  GameCommand,
  RoomView,
  Session,
} from "../../shared/types.js";
import {
  GameError as Fault,
  gameRegistry,
  type GameEngine,
  type GameFactory,
} from "../games/registry.js";

const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const token = () => randomBytes(32).toString("hex");
const id = () => randomUUID();
const command = z.object({
  commandId: z.string().uuid(),
  gameId: z.string().uuid(),
  phaseId: z.string().uuid(),
});
const segmenter = new Intl.Segmenter();
const nameSchema = z
  .string()
  .transform((s) => s.normalize("NFKC").trim().replace(/\s+/gu, " "))
  .refine((s) => {
    const length = [...segmenter.segment(s)].length;
    return (
      length >= 1 &&
      length <= 20 &&
      !/[\p{Cc}\p{Cf}]/u.test(s) &&
      !["host", "system", "removed player"].includes(s.toLowerCase())
    );
  }, "Use 1–20 visible characters and a different name.");
export interface Config {
  origin: string;
  maxRooms: number;
  maxConnections: number;
  roomsPerNetwork: number;
  connectionsPerNetwork: number;
  testMode?: boolean;
}
interface Player {
  id: string;
  name: string;
  hash: string;
  socketId: string | null;
  expires: number | null;
}
interface Pending {
  id: string;
  name: string;
  hash: string;
  socketId: string | null;
  expires: number;
}
export interface Room {
  id: string;
  code: string;
  created: number;
  activity: number;
  hostHash: string;
  hostSocket: string | null;
  hostGone: number | null;
  network: string;
  locked: boolean;
  players: Map<string, Player>;
  pending: Map<string, Pending>;
  game: GameEngine | null;
  selectedGame: string;
  settings: PartySettings;
  contentHistory: ContentHistory;
  standings: Map<string, { points: number; games: number }>;
  settledGame: string | null;
  hostPlayerId: string | null;
  minimum: number;
  duration: number;
  deadline: number | null;
  remaining: number | null;
  manualPause: boolean;
  pauseReason: string | null;
  revision: number;
  receipts: Map<string, unknown>;
  emptySince: number | null;
  removed: Map<string, number>;
  actorBudgets: Map<string, { tokens: number; updated: number }>;
}

export class Limiter {
  private buckets = new Map<string, { count: number; until: number }>();
  take(key: string, max: number, window: number, now = Date.now()) {
    let b = this.buckets.get(key);
    if (!b || b.until <= now) {
      if (this.buckets.size >= 20000) {
        this.sweep(now);
        if (this.buckets.size >= 20000) return false;
      }
      b = { count: 0, until: now + window };
      this.buckets.set(key, b);
    }
    return ++b.count <= max;
  }
  sweep(now = Date.now()) {
    for (const [key, b] of this.buckets)
      if (b.until <= now) this.buckets.delete(key);
  }
}
export class RoomManager {
  readonly rooms = new Map<string, Room>();
  readonly codes = new Map<string, string>();
  readonly quarantine = new Map<string, number>();
  readonly limits = new Limiter();
  private timer: ReturnType<typeof setInterval>;
  constructor(
    readonly io: Server,
    readonly config: Config,
    readonly clock: () => number = Date.now,
    readonly games: Map<string, GameFactory> = gameRegistry,
  ) {
    this.timer = setInterval(() => this.tick(), 500);
    this.timer.unref();
  }
  stop() {
    clearInterval(this.timer);
  }
  code() {
    const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    for (let attempt = 0; attempt < 20; attempt++) {
      let c = "";
      for (let n = 0; n < 6; n++) c += alphabet[randomInt(alphabet.length)];
      if (!this.codes.has(c) && !this.quarantine.has(c)) return c;
    }
    throw new Fault("server_busy", "Please try creating a room again.");
  }
  attach(socket: Socket, network: string) {
    const on = (
      event: string,
      schema: z.ZodTypeAny,
      handler: (data: any) => unknown,
    ) =>
      socket.on(event, (raw: unknown, callback: unknown) => {
        if (typeof callback !== "function") return;
        const ack = callback as (a: Ack) => void;
        try {
          const rate =
            event === "room:resume"
              ? 120
              : event === "room:create"
                ? 5
                : event === "room:join"
                  ? 30
                  : 600;
          const window = event === "room:create" ? 600000 : 60000;
          if (
            !this.limits.take(
              `${event}:${network}`,
              rate,
              window,
              this.clock(),
            ) ||
            !this.limits.take(`socket:${socket.id}`, 10, 1000, this.clock())
          )
            throw new Fault(
              "rate_limited",
              "A little too fast. Please wait a moment.",
            );
          const parsed = schema.safeParse(raw);
          if (!parsed.success)
            throw new Fault(
              "invalid_input",
              event === "room:join"
                ? "Check the room code and use a name with 1–20 visible characters."
                : "That action was not valid. Please try again.",
            );
          const data = handler(parsed.data);
          ack({ ok: true, data });
        } catch (e) {
          if (e instanceof Fault)
            ack({ ok: false, error: e.code, message: e.message });
          else {
            console.error(
              JSON.stringify({ event: "handler_error", action: event }),
            );
            ack({
              ok: false,
              error: "internal_error",
              message: "Something went wrong. Please try again.",
            });
          }
        }
      });
    on("room:create", z.object({}).strict(), () => {
      if (socket.data.roomId)
        throw new Fault("already_joined", "Leave your current room first.");
      if (
        this.rooms.size >= this.config.maxRooms ||
        [...this.rooms.values()].filter((r) => r.network === network).length >=
          this.config.roomsPerNetwork
      )
        throw new Fault(
          "server_busy",
          "Room capacity reached. Try again after a room closes.",
        );
      const raw = token(),
        now = this.clock(),
        room: Room = {
          id: id(),
          code: this.code(),
          created: now,
          activity: now,
          hostHash: hash(raw),
          hostSocket: socket.id,
          hostGone: null,
          network,
          locked: false,
          players: new Map(),
          pending: new Map(),
          game: null,
          selectedGame: defaultGame,
          settings: defaultSettings(),
          contentHistory: new Map(),
          standings: new Map(),
          settledGame: null,
          hostPlayerId: null,
          minimum: 3,
          duration: 45,
          deadline: null,
          remaining: null,
          manualPause: false,
          pauseReason: null,
          revision: 0,
          receipts: new Map(),
          emptySince: null,
          removed: new Map(),
          actorBudgets: new Map(),
        };
      this.rooms.set(room.id, room);
      this.codes.set(room.code, room.id);
      socket.data = { roomId: room.id, role: "host" };
      this.broadcast(room);
      return {
        roomId: room.id,
        code: room.code,
        token: raw,
        role: "host",
      } satisfies Session;
    });
    on(
      "room:join",
      z
        .object({
          code: z
            .string()
            .trim()
            .toUpperCase()
            .regex(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/),
          name: nameSchema,
        })
        .strict(),
      ({ code, name }) => {
        if (socket.data.roomId)
          throw new Fault("already_joined", "Leave your current room first.");
        const room = this.rooms.get(this.codes.get(code) ?? "");
        if (!room)
          throw new Fault(
            "room_unavailable",
            "That room is unavailable. Check the code with your host.",
          );
        if (room.locked || room.game)
          throw new Fault(
            "room_locked",
            "This room is locked or already playing. Ask the host to return to the lobby.",
          );
        if (room.players.size >= 8 || room.pending.size >= 16)
          throw new Fault("room_full", "This room is full.");
        if (!this.limits.take(`join-room:${room.id}`, 20, 60000, this.clock()))
          throw new Fault(
            "rate_limited",
            "This room has had a lot of requests. Please try again shortly.",
          );
        const names = [...room.players.values(), ...room.pending.values()].map(
          (p) => p.name.toLocaleLowerCase(),
        );
        if (names.includes(name.toLocaleLowerCase())) {
          const base = [...segmenter.segment(name)]
            .slice(0, 16)
            .map((p) => p.segment)
            .join("");
          let n = 2;
          while (names.includes(`${base} ${n}`.toLocaleLowerCase())) n++;
          throw new Fault(
            "name_taken",
            `That name is taken. Try “${base} ${n}”.`,
          );
        }
        const raw = token(),
          p: Pending = {
            id: id(),
            name,
            hash: hash(raw),
            socketId: socket.id,
            expires: this.clock() + 60000,
          };
        room.pending.set(p.id, p);
        socket.data = { roomId: room.id, role: "pending", playerId: p.id };
        room.activity = this.clock();
        this.broadcast(room);
        return {
          roomId: room.id,
          code: room.code,
          token: raw,
          role: "pending",
        } satisfies Session;
      },
    );
    on(
      "room:resume",
      z
        .object({
          roomId: z.string().uuid(),
          token: z.string().regex(/^[a-f0-9]{64}$/),
        })
        .strict(),
      ({ roomId, token: raw }) => {
        if (socket.data.roomId && socket.data.roomId !== roomId)
          throw new Fault("already_joined", "Leave your current room first.");
        const room = this.rooms.get(roomId);
        if (!room)
          throw new Fault(
            "session_expired",
            "Your room ended or the server restarted. Create or join a new room.",
          );
        const h = hash(raw);
        let role: Session["role"];
        let playerId: string | undefined;
        if (room.hostHash === h) {
          if (room.hostGone !== null && this.clock() - room.hostGone >= 300000)
            throw new Fault(
              "session_expired",
              "The host reconnect window has ended.",
            );
          const old = room.hostSocket;
          room.hostSocket = socket.id;
          room.hostGone = null;
          role = "host";
          if (room.hostPlayerId) {
            const seat = room.players.get(room.hostPlayerId);
            if (seat) {
              seat.socketId = socket.id;
              seat.expires = null;
              playerId = seat.id;
            }
          }
          if (old && old !== socket.id)
            this.io.sockets.sockets.get(old)?.disconnect(true);
        } else {
          const p = [...room.players.values()].find((p) => p.hash === h);
          const pending = [...room.pending.values()].find((p) => p.hash === h);
          if (p && (p.expires === null || p.expires > this.clock())) {
            const old = p.socketId;
            p.socketId = socket.id;
            p.expires = null;
            role = "player";
            playerId = p.id;
            if (old && old !== socket.id)
              this.io.sockets.sockets.get(old)?.disconnect(true);
          } else if (pending && pending.expires > this.clock()) {
            const old = pending.socketId;
            pending.socketId = socket.id;
            role = "pending";
            playerId = pending.id;
            if (old && old !== socket.id)
              this.io.sockets.sockets.get(old)?.disconnect(true);
          } else
            throw new Fault(
              "session_expired",
              "Your seat expired or was removed. Ask the host about joining again.",
            );
        }
        socket.data = { roomId: room.id, role, playerId };
        room.emptySince = null;
        room.activity = this.clock();
        this.syncPause(room);
        this.broadcast(room);
        return {
          roomId: room.id,
          code: room.code,
          token: raw,
          role,
        } satisfies Session;
      },
    );
    on("room:leave", z.object({}).strict(), () => {
      const room = this.member(socket);
      if (socket.data.role === "host")
        this.close(room, "The host closed this room.");
      else {
        this.remove(room, socket.data.playerId, "You left the room.");
        this.syncPause(room);
        this.complete(room);
        this.broadcast(room);
      }
      return {};
    });
    on(
      "host:admit",
      z.object({ id: z.string().uuid() }).strict(),
      ({ id: pId }) => {
        const room = this.host(socket);
        const p = room.pending.get(pId);
        if (!p || p.expires <= this.clock())
          throw new Fault("request_expired", "That request expired.");
        if (room.game || room.locked || room.players.size >= 8)
          throw new Fault(
            "room_full",
            "Return to an unlocked lobby with a free seat.",
          );
        room.pending.delete(pId);
        room.players.set(pId, {
          id: p.id,
          name: p.name,
          hash: p.hash,
          socketId: p.socketId,
          expires: p.socketId ? null : this.clock() + 300000,
        });
        const s = this.io.sockets.sockets.get(p.socketId ?? "");
        if (s) s.data.role = "player";
        room.activity = this.clock();
        this.broadcast(room);
        return {};
      },
    );
    on(
      "host:deny",
      z.object({ id: z.string().uuid() }).strict(),
      ({ id: pId }) => {
        const room = this.host(socket);
        this.remove(room, pId, "The host declined your request.");
        this.broadcast(room);
        return {};
      },
    );
    on(
      "host:remove",
      z.object({ id: z.string().uuid() }).strict(),
      ({ id: pId }) => {
        const room = this.host(socket);
        this.remove(room, pId, "The host removed you from this room.");
        this.syncPause(room);
        this.complete(room);
        this.broadcast(room);
        return {};
      },
    );
    on(
      "host:lock",
      z.object({ locked: z.boolean() }).strict(),
      ({ locked }) => {
        const room = this.host(socket);
        room.locked = locked;
        room.activity = this.clock();
        if (locked)
          for (const p of [...room.pending.values()])
            this.remove(room, p.id, "The host locked this room.");
        this.broadcast(room);
        return {};
      },
    );
    on(
      "host:settings",
      z
        .object({
          duration: z
            .union([z.literal(45), z.literal(90), z.literal(0)])
            .optional(),
          difficulty: z.enum(["casual", "mixed", "hard"]).optional(),
          clueMode: z.enum(["solo", "teams"]).optional(),
          teamTarget: z.number().int().min(5).max(30).optional(),
          carryScores: z.boolean().optional(),
          teams: z
            .record(z.string().uuid(), z.union([z.literal(0), z.literal(1)]))
            .refine((teams) => Object.keys(teams).length <= 8)
            .optional(),
        })
        .strict(),
      ({ duration, ...settings }) => {
        const room = this.host(socket);
        if (room.game)
          throw new Fault("game_active", "Change settings in the lobby.");
        if (
          settings.teams &&
          Object.keys(settings.teams).some((id) => !room.players.has(id))
        )
          throw new Fault("invalid_teams", "Choose players from this room.");
        if (duration !== undefined) room.duration = duration;
        room.settings = { ...room.settings, ...settings };
        room.activity = this.clock();
        this.broadcast(room);
        return {};
      },
    );
    on("host:reset-content", z.object({}).strict(), () => {
      const room = this.host(socket);
      if (room.game)
        throw new Fault("game_active", "Reset used content in the lobby.");
      room.contentHistory.clear();
      room.activity = this.clock();
      this.broadcast(room);
      return {};
    });
    on("host:reset-scores", z.object({}).strict(), () => {
      const room = this.host(socket);
      if (room.game)
        throw new Fault("game_active", "Reset session scores in the lobby.");
      room.standings.clear();
      room.activity = this.clock();
      this.broadcast(room);
      return {};
    });
    on(
      "host:game",
      z.object({ gameKey: z.string().max(40) }).strict(),
      ({ gameKey }) => {
        const room = this.host(socket);
        if (room.game)
          throw new Fault("game_active", "Choose the next game in the lobby.");
        if (!this.games.has(gameKey))
          throw new Fault("unknown_game", "That game is unavailable.");
        room.selectedGame = gameKey;
        room.activity = this.clock();
        this.broadcast(room);
        return {};
      },
    );
    on("host:play", z.object({ name: nameSchema }).strict(), ({ name }) => {
      const room = this.host(socket);
      if (room.game)
        throw new Fault(
          "game_active",
          "Join yourself in the lobby before starting.",
        );
      if (room.hostPlayerId) return {};
      if (room.players.size >= 8)
        throw new Fault("room_full", "All eight seats are taken.");
      if (
        [...room.players.values(), ...room.pending.values()].some(
          (p) => p.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
        )
      )
        throw new Fault(
          "name_taken",
          "That name is taken. Choose another name.",
        );
      const seat: Player = {
        id: id(),
        name,
        hash: hash(token()),
        socketId: socket.id,
        expires: null,
      };
      room.players.set(seat.id, seat);
      room.hostPlayerId = seat.id;
      socket.data.playerId = seat.id;
      room.activity = this.clock();
      this.broadcast(room);
      return {};
    });
    on("room:close", z.object({}).strict(), () => {
      this.close(this.host(socket), "The host closed this room.");
      return {};
    });
    on(
      "game:start",
      z
        .object({
          commandId: z.string().uuid(),
          gameKey: z.string().max(40).optional(),
        })
        .strict(),
      ({ commandId, gameKey }) => {
        const room = this.host(socket);
        if (room.receipts.has(commandId)) return room.receipts.get(commandId);
        this.startGame(room, gameKey ?? room.selectedGame);
        this.remember(room, commandId, {});
        this.broadcast(room);
        return {};
      },
    );
    on("game:rematch", command.strict(), (data) =>
      this.act(socket, data, (room) => {
        this.host(socket);
        this.startGame(room, room.selectedGame, true);
      }),
    );
    on(
      "game:feedback",
      command
        .extend({
          reason: z.enum(["too_easy", "too_hard", "ambiguous", "incorrect"]),
        })
        .strict(),
      (data) =>
        this.act(socket, data, (room) => {
          if (!room.game?.feedback)
            throw new Fault(
              "wrong_game",
              "Feedback is available on trivia reveals.",
            );
          room.game.feedback(socket.data.playerId, data.reason);
        }),
    );
    for (const [event, action] of [
      ["game:submit", "submit"],
      ["game:vote", "vote"],
    ] as const) {
      on(event, command.passthrough(), (data) =>
        this.act(socket, data, (room) => {
          this.accepting(room);
          const { commandId, gameId, phaseId, ...payload } = data;
          room.game!.submit(socket.data.playerId, action, payload);
        }),
      );
    }
    for (const event of [
      "game:advance",
      "game:pause",
      "game:resume",
      "game:end",
    ] as const)
      on(event, command.strict(), (data) =>
        this.act(socket, data, (room) => {
          if (socket.data.role !== "host")
            throw new Fault("forbidden", "Only the host can do that.");
          const g = room.game!;
          if (event === "game:end") {
            g.end();
            room.deadline = null;
            room.remaining = null;
            room.manualPause = false;
            room.pauseReason = null;
            g.phaseId = id();
            return;
          }
          if (event === "game:pause") {
            if (!g.input)
              throw new Fault(
                "wrong_phase",
                "There is no running timer to pause.",
              );
            room.manualPause = true;
            this.syncPause(room);
            g.phaseId = id();
            return;
          }
          if (event === "game:resume") {
            room.manualPause = false;
            this.syncPause(room);
            g.phaseId = id();
            return;
          }
          if (!room.hostSocket)
            throw new Fault(
              "host_missing",
              "Waiting for the host to reconnect.",
            );
          if (g.advancesToInput && this.connected(room) < room.minimum)
            throw new Fault(
              "not_enough_players",
              `At least ${room.minimum} connected players are needed.`,
            );
          if (g.advance() === "lobby") {
            this.settle(room);
            room.removed.clear();
            room.game = null;
            room.deadline = null;
            room.remaining = null;
            room.manualPause = false;
            room.pauseReason = null;
          } else this.phaseTimer(room);
        }),
      );
    socket.on("disconnect", () => {
      const room = this.rooms.get(socket.data.roomId);
      if (!room) return;
      if (room.hostSocket === socket.id) {
        room.hostSocket = null;
        room.hostGone = this.clock();
      }
      for (const p of room.players.values())
        if (p.socketId === socket.id) {
          p.socketId = null;
          p.expires = this.clock() + 300000;
        }
      for (const p of room.pending.values())
        if (p.socketId === socket.id) p.socketId = null;
      this.syncPause(room);
      this.broadcast(room);
    });
  }
  private member(socket: Socket) {
    const room = this.rooms.get(socket.data.roomId);
    if (!room)
      throw new Fault(
        "session_expired",
        "Your room ended or the server restarted.",
      );
    if (socket.data.role === "host" && room.hostSocket === socket.id)
      return room;
    if (
      socket.data.role === "player" &&
      room.players.get(socket.data.playerId)?.socketId === socket.id
    )
      return room;
    if (
      socket.data.role === "pending" &&
      room.pending.get(socket.data.playerId)?.socketId === socket.id
    )
      return room;
    throw new Fault("forbidden", "Reconnect to your room to continue.");
  }
  private host(socket: Socket) {
    const room = this.member(socket);
    if (socket.data.role !== "host")
      throw new Fault("forbidden", "Only the host can do that.");
    return room;
  }
  private accepting(room: Room) {
    if (!room.game?.input)
      throw new Fault(
        "stale_phase",
        "The game has moved on. Your screen will update.",
      );
    if (room.pauseReason)
      throw new Fault(
        "game_paused",
        "The game is paused. Your choices are still here.",
      );
    if (room.deadline !== null && room.deadline <= this.clock()) {
      this.complete(room, true);
      this.broadcast(room);
      throw new Fault("time_up", "Time is up for this stage.");
    }
  }
  private act(socket: Socket, data: GameCommand, fn: (r: Room) => void) {
    const room = this.member(socket);
    if (socket.data.role === "pending")
      throw new Fault("forbidden", "Wait for the host to admit you.");
    const key = `${socket.data.playerId ?? "host"}:${data.commandId}`;
    if (room.receipts.has(key)) return room.receipts.get(key);
    if (
      !room.game ||
      room.game.id !== data.gameId ||
      room.game.phaseId !== data.phaseId
    ) {
      socket.emit(
        "room:state",
        this.view(room, socket.data.role, socket.data.playerId),
      );
      throw new Fault(
        "stale_phase",
        "The game has moved on. Please try again on this screen.",
      );
    }
    // Actor budgets survive socket replacement, so reconnect cannot bypass a limit.
    const actor = socket.data.playerId ?? "host",
      now = this.clock();
    const old = room.actorBudgets.get(actor) ?? { tokens: 10, updated: now };
    const available = Math.min(
      10,
      old.tokens + (Math.max(0, now - old.updated) * 5) / 1000,
    );
    if (available < 1)
      throw new Fault(
        "rate_limited",
        "A little too fast. Please wait a moment.",
      );
    room.actorBudgets.set(actor, { tokens: available - 1, updated: now });
    fn(room);
    room.activity = this.clock();
    this.remember(room, key, {});
    this.complete(room);
    this.broadcast(room);
    return {};
  }
  private remember(room: Room, key: string, value: unknown) {
    room.receipts.set(key, value);
    if (room.receipts.size > 512)
      room.receipts.delete(room.receipts.keys().next().value!);
  }
  private settingsView(room: Room): PartySettings {
    return {
      ...room.settings,
      teams: Object.fromEntries(
        [...room.players.keys()].map((id, index) => [
          id,
          room.settings.teams[id] ?? index % 2,
        ]),
      ),
    };
  }
  private settle(room: Room) {
    const g = room.game;
    if (!g?.final || room.settledGame === g.id) return;
    if (room.settings.carryScores)
      for (const id of room.players.keys())
        if (g.hasPlayer(id)) {
          const old = room.standings.get(id) ?? { points: 0, games: 0 };
          room.standings.set(id, {
            points: old.points + g.score(id),
            games: old.games + 1,
          });
        }
    room.settledGame = g.id;
  }
  private startGame(room: Room, chosen: string, rematch = false) {
    if (room.game && (!rematch || !room.game.final))
      throw new Fault("game_active", "Finish the current game first.");
    if (rematch && !room.game?.final)
      throw new Fault("wrong_phase", "Finish this game before a rematch.");
    const factory = this.games.get(chosen);
    if (!factory) throw new Fault("unknown_game", "That game is unavailable.");
    const settings = this.settingsView(room),
      players = [...room.players.values()].filter((p) => p.socketId);
    const minimum =
      chosen === "clue-crew" && settings.clueMode === "teams"
        ? 4
        : factory.minPlayers;
    if (players.length < minimum)
      throw new Fault(
        "not_enough_players",
        `At least ${minimum} connected players are needed.`,
      );
    // Failed creation never burns content or discards the completed game.
    const history = new Map(
      [...room.contentHistory].map(([key, seen]) => [key, new Set(seen)]),
    );
    const game = factory.create(players, { history, settings });
    this.settle(room);
    for (const p of [...room.pending.values()])
      this.remove(
        room,
        p.id,
        "The game started before your request was accepted.",
      );
    room.contentHistory = history;
    room.game = game;
    room.selectedGame = chosen;
    room.minimum = minimum;
    room.removed.clear();
    room.deadline = null;
    room.remaining = null;
    room.manualPause = false;
    room.pauseReason = null;
    room.activity = this.clock();
  }
  private connected(room: Room) {
    return [...room.players.values()].filter(
      (p) => p.socketId && (!room.game || room.game.hasPlayer(p.id)),
    ).length;
  }
  private phaseTimer(room: Room) {
    room.game!.phaseId = id();
    room.remaining = null;
    const duration = room.game!.duration(room.duration);
    room.deadline = duration === null ? null : this.clock() + duration;
    room.pauseReason = null;
    this.syncPause(room);
  }
  private syncPause(room: Room) {
    if (!room.game?.input) return;
    const missingRequired = room.game
      .requiredPlayers?.()
      .some((id) => !room.players.get(id)?.socketId);
    const teamIssue = room.game.connectionIssue?.(
      [...room.players.values()].filter((p) => p.socketId).map((p) => p.id),
    );
    const reason = !room.hostSocket
      ? "Waiting for the host to reconnect"
      : this.connected(room) < room.minimum
        ? `Waiting for at least ${room.minimum} connected players`
        : teamIssue
          ? teamIssue
          : missingRequired
            ? "Waiting for this turn’s player to reconnect"
            : room.manualPause
              ? "Paused by the host"
              : null;
    if (reason && !room.pauseReason) {
      room.remaining =
        room.deadline === null
          ? null
          : Math.max(0, room.deadline - this.clock());
      room.deadline = null;
    } else if (!reason && room.pauseReason) {
      room.deadline =
        room.remaining === null ? null : this.clock() + room.remaining;
      room.remaining = null;
    }
    room.pauseReason = reason;
  }
  private complete(room: Room, timeout = false) {
    const g = room.game;
    if (!g || room.pauseReason) return;
    if (g.complete(timeout)) this.phaseTimer(room);
  }
  private remove(room: Room, pId: string, reason: string) {
    const p = room.players.get(pId) ?? room.pending.get(pId);
    if (!p) return;
    const s = this.io.sockets.sockets.get(p.socketId ?? "");
    if (pId === room.hostPlayerId) {
      room.hostPlayerId = null;
      if (s) s.data.playerId = undefined;
    } else if (s) {
      s.emit("room:closed", { message: reason });
      s.data = {};
    }
    room.pending.delete(pId);
    room.players.delete(pId);
    room.standings.delete(pId);
    delete room.settings.teams[pId];
    room.actorBudgets.delete(pId);
    const g = room.game;
    if (g) {
      if (g.score(pId) > 0) room.removed.set(pId, g.score(pId));
      const previous = g.phase;
      g.remove(pId);
      if (g.phase !== previous) this.phaseTimer(room);
    }
  }
  close(room: Room, message: string) {
    for (const socketId of [
      room.hostSocket,
      ...[...room.players.values(), ...room.pending.values()].map(
        (p) => p.socketId,
      ),
    ]) {
      const s = this.io.sockets.sockets.get(socketId ?? "");
      if (s) {
        s.emit("room:closed", { message });
        s.data = {};
      }
    }
    this.rooms.delete(room.id);
    this.codes.delete(room.code);
    this.quarantine.set(room.code, this.clock() + 1800000);
  }
  broadcast(room: Room) {
    room.revision++;
    if (room.hostSocket)
      this.io.sockets.sockets
        .get(room.hostSocket)
        ?.emit("room:state", this.view(room, "host"));
    for (const p of room.players.values())
      if (p.socketId && p.socketId !== room.hostSocket)
        this.io.sockets.sockets
          .get(p.socketId)
          ?.emit("room:state", this.view(room, "player", p.id));
    for (const p of room.pending.values())
      if (p.socketId)
        this.io.sockets.sockets
          .get(p.socketId)
          ?.emit("room:state", this.view(room, "pending", p.id));
  }
  view(room: Room, role: RoomView["role"], playerId?: string): RoomView {
    if (role === "host") playerId = room.hostPlayerId ?? undefined;
    const g = room.game;
    const privateView = g?.privateView(playerId) ?? null;
    return {
      id: room.id,
      code: room.code,
      role,
      playerId: playerId ?? null,
      locked: room.locked,
      hostConnected: !!room.hostSocket,
      players:
        role === "pending"
          ? []
          : [
              ...[...room.players.values()].map((p) => ({
                id: p.id,
                name: p.name,
                connected: !!p.socketId,
                score: g?.score(p.id) ?? 0,
              })),
              ...[...room.removed].map(([id, score]) => ({
                id,
                name: "Removed player",
                connected: false,
                score,
              })),
            ],
      settings: role === "pending" ? undefined : this.settingsView(room),
      contentUsed:
        role === "host"
          ? [...room.contentHistory.values()].reduce(
              (n, seen) => n + seen.size,
              0,
            )
          : undefined,
      standings:
        role === "pending" || !room.settings.carryScores
          ? []
          : [...room.players.values()].map((p) => {
              const old = room.standings.get(p.id) ?? { points: 0, games: 0 };
              const current =
                g && room.settledGame !== g.id && g.hasPlayer(p.id);
              return {
                id: p.id,
                name: p.name,
                points: old.points + (current ? g.score(p.id) : 0),
                games: old.games + (current && g.final ? 1 : 0),
              };
            }),
      selectedGame: room.selectedGame,
      games: [...this.games.values()].flatMap((factory) =>
        factory.metadata && !factory.metadata.hidden ? [factory.metadata] : [],
      ),
      pending:
        role === "host"
          ? [...room.pending.values()].map((p) => ({ id: p.id, name: p.name }))
          : [],
      game:
        g && role !== "pending"
          ? {
              ...g.publicView(),
              waitingFor: !g.input
                ? []
                : (g.waitingPlayers?.() ??
                  [...room.players.keys()].filter(
                    (id) => g.hasPlayer(id) && !g.privateView(id)?.submitted,
                  )),
              deadline: room.deadline,
              remainingMs: room.remaining,
              paused: !!room.pauseReason,
              pauseReason: room.pauseReason,
            }
          : null,
      private: privateView,
      joinUrl: `${this.config.origin}/join?code=${room.code}`,
      now: this.clock(),
      expiresAt: Math.min(
        room.created + 14400000,
        room.hostGone !== null ? room.hostGone + 300000 : Infinity,
        ...(!g || g.final ? [room.activity + 1800000] : []),
      ),
      revision: room.revision,
      duration: room.duration,
    };
  }
  tick() {
    const now = this.clock();
    this.limits.sweep(now);
    for (const [code, until] of this.quarantine)
      if (until <= now) this.quarantine.delete(code);
    for (const room of [...this.rooms.values()]) {
      if (
        now - room.created >= 14400000 ||
        (room.hostGone !== null && now - room.hostGone >= 300000) ||
        ((!room.game || room.game.final) && now - room.activity >= 1800000)
      ) {
        this.close(room, "This room expired. Create a new room to play again.");
        continue;
      }
      let changed = false;
      for (const p of [...room.pending.values()])
        if (p.expires <= now) {
          this.remove(
            room,
            p.id,
            "Your join request expired. Please try again.",
          );
          changed = true;
        }
      for (const p of [...room.players.values()])
        if (p.expires !== null && p.expires <= now) {
          this.remove(room, p.id, "Your reconnect window expired.");
          changed = true;
        }
      const empty =
        !room.hostSocket && ![...room.players.values()].some((p) => p.socketId);
      if (empty) {
        room.emptySince ??= now;
        if (now - room.emptySince >= 120000) {
          this.close(room, "This room was empty and has closed.");
          continue;
        }
      } else room.emptySince = null;
      if (changed) this.syncPause(room);
      if (room.deadline !== null && room.deadline <= now && !room.pauseReason) {
        this.complete(room, true);
        changed = true;
      }
      if (changed) {
        this.complete(room);
        this.broadcast(room);
      }
    }
  }
}
