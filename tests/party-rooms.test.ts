import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { io, type Socket } from "socket.io-client";
import { createApp } from "../server/index.js";
import type { Ack, RoomView, Session } from "../shared/types.js";
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until(fn: () => boolean) {
  for (let i = 0; i < 300; i++) {
    if (fn()) return;
    await pause(10);
  }
  throw new Error("Expected party-room state did not arrive");
}
function request<T = unknown>(
  s: Socket,
  event: string,
  data: unknown,
): Promise<Ack<T>> {
  return new Promise((resolve, reject) =>
    s
      .timeout(4000)
      .emit(event, data, (e: Error | null, a: Ack<T>) =>
        e
          ? reject(new Error(`${event} acknowledgement timed out`))
          : resolve(a),
      ),
  );
}
async function must<T = unknown>(s: Socket, event: string, data: unknown) {
  const a = await request<T>(s, event, data);
  assert.ok(a.ok, `${event} must succeed${!a.ok ? `: ${a.error}` : ""}`);
  return a.data;
}
for (const gameKey of [
  "blank-slate",
  "crowd-pick",
  "clue-crew",
  "blackout-run",
  "false-front",
])
  test(`${gameKey}: real controllers, game selection, host play, private data and role-safe actions`, async () => {
    const httpServer = createServer();
    await new Promise<void>((r) => httpServer.listen(0, "127.0.0.1", r));
    const port = (httpServer.address() as { port: number }).port,
      origin = `http://127.0.0.1:${port}`;
    const server = createApp({ origin }, { httpServer }),
      sockets: Socket[] = [],
      states = new Map<Socket, RoomView>();
    const connect = async (polling = false) => {
      const s = io(origin, {
        forceNew: true,
        reconnection: false,
        transports: polling ? ["polling"] : ["websocket"],
        upgrade: false,
        extraHeaders: polling
          ? { "Sec-Fetch-Site": "same-origin" }
          : { Origin: origin },
      });
      sockets.push(s);
      s.on("room:state", (v) => states.set(s, v));
      await new Promise<void>((resolve, reject) => {
        s.once("connect", resolve);
        s.once("connect_error", () =>
          reject(new Error("Party controller connection failed")),
        );
      });
      return s;
    };
    let host = await connect(true);
    try {
      const credentials = await must<Session>(host, "room:create", {});
      assert.deepEqual(
        states
          .get(host)!
          .games.map((g) => g.id)
          .sort(),
        [
          "blackout-run",
          "blank-slate",
          "clue-crew",
          "crowd-pick",
          "false-front",
        ],
      );
      const pair = await must<{ code: string; url: string; expires: number }>(
        host,
        "host:screen",
        {},
      );
      assert.ok(pair.url.endsWith(`/screen#${pair.code}`));
      assert.ok(pair.expires > Date.now());
      let display = await connect();
      const displaySession = await must<Session>(display, "display:join", {
        code: pair.code,
      });
      const consumed = await connect();
      assert.equal(
        (await request(consumed, "display:join", { code: pair.code })).ok,
        false,
      );
      assert.equal(
        (await request(consumed, "display:join", { code: credentials.code }))
          .ok,
        false,
        "player codes cannot pair screens",
      );
      assert.equal(states.get(display)!.role, "display");
      assert.equal(states.get(display)!.private, null);
      assert.deepEqual(states.get(display)!.pending, []);
      assert.equal(states.get(host)!.displayCount, 1);
      await must(host, "host:play", { name: "Playing host" });
      const hostId = states.get(host)!.playerId!;
      assert.ok(hostId);
      assert.equal(states.get(host)!.role, "host");
      const others: { socket: Socket; session: Session }[] = [];
      for (let i = 0; i < 2; i++) {
        const socket = await connect();
        const session = await must<Session>(socket, "room:join", {
          code: credentials.code,
          name: `Friend ${i + 1}`,
        });
        await until(() => states.get(host)!.pending.length === 1);
        await must(host, "host:admit", { id: states.get(host)!.pending[0].id });
        others.push({ socket, session });
        if (gameKey === "crowd-pick" && i === 0) {
          const denied = await request(host, "game:start", {
            commandId: randomUUID(),
            gameKey,
          });
          assert.equal(denied.ok, false);
          if (!denied.ok) assert.equal(denied.error, "not_enough_players");
          assert.equal(states.get(host)!.game, null);
          assert.equal(
            states.get(host)!.games.find((g) => g.id === gameKey)!.minPlayers,
            3,
          );
        }
      }
      await pause(1100);
      await must(host, "host:settings", { carryScores: true });
      await must(host, "host:game", { gameKey });
      assert.equal(states.get(host)!.selectedGame, gameKey);
      assert.equal(
        (
          await request(others[0].socket, "host:game", {
            gameKey: "crowd-pick",
          })
        ).ok,
        false,
      );
      await must(host, "game:start", { commandId: randomUUID() });
      await until(() => states.get(host)!.game?.gameKey === gameKey);
      await until(() => states.get(display)?.game?.gameKey === gameKey);
      assert.equal(states.get(display)!.private, null);
      assert.equal(states.get(display)!.playerId, null);
      assert.equal(
        (await request(display, "host:play", { name: "Imposter" })).ok,
        false,
      );
      const cmd = (s: Socket) => ({
        commandId: randomUUID(),
        gameId: states.get(s)!.game!.id,
        phaseId: states.get(s)!.game!.phaseId,
      });
      assert.equal(
        (await request(display, "game:advance", cmd(display))).ok,
        false,
      );
      assert.equal(
        (await request(display, "game:pause", cmd(display))).ok,
        false,
      );
      assert.equal(
        (
          await request(display, "game:submit", {
            ...cmd(display),
            cardId: "forged",
          })
        ).ok,
        false,
      );
      await must(host, "game:advance", cmd(host));
      await until(() =>
        others.every((p) => states.get(p.socket)?.game?.phase === "allocate"),
      );
      await until(() => states.get(display)?.game?.phase === "allocate");
      assert.equal(
        states.get(display)!.private,
        null,
        "shared screen must never receive private controller state",
      );
      display.disconnect();
      display = await connect();
      await must(display, "room:resume", {
        roomId: displaySession.roomId,
        token: displaySession.token,
      });
      assert.equal(states.get(display)!.role, "display");
      assert.equal(states.get(display)!.private, null);
      assert.equal(
        states.get(display)!.game!.paused,
        false,
        "display loss does not pause the game",
      );
      assert.equal(states.get(host)!.role, "host");
      assert.equal(states.get(host)!.playerId, hostId);
      assert.ok(states.get(host)!.private);
      if (gameKey === "blank-slate") {
        assert.equal(states.get(host)!.private!.cards!.isJudge, true);
        assert.equal(states.get(host)!.game!.cards!.options.length, 0);
        for (const p of others)
          await must(p.socket, "game:submit", {
            ...cmd(p.socket),
            cardId: states.get(p.socket)!.private!.cards!.hand[0].id,
          });
        await until(() => states.get(host)!.game!.phase === "vote");
        const options = states.get(host)!.game!.cards!.options;
        assert.ok(options.every((c) => !("authorId" in c)));
        await until(() => states.get(others[0].socket)!.game!.phase === "vote");
        const forged = await request(others[0].socket, "game:vote", {
          ...cmd(others[0].socket),
          cardId: options[0].id,
        });
        assert.equal(forged.ok, false);
        await must(host, "game:vote", { ...cmd(host), cardId: options[0].id });
        await until(() => states.get(host)!.game!.phase === "reveal");
        assert.equal(
          states.get(host)!.players.reduce((s, p) => s + p.score, 0),
          1,
        );
      } else if (gameKey === "crowd-pick") {
        await must(host, "game:submit", { ...cmd(host), project: 0 });
        assert.deepEqual(states.get(host)!.game!.crowd!.totals, [0, 0, 0]);
        for (const p of others)
          await must(p.socket, "game:submit", { ...cmd(p.socket), project: 0 });
        await until(() => states.get(host)!.game!.phase === "reveal");
        assert.ok(states.get(host)!.players.every((p) => p.score === 1));
      } else if (gameKey === "blackout-run" || gameKey === "false-front") {
        const all = [host, ...others.map((p) => p.socket)];
        for (const [i, s] of all.entries())
          await must(s, "game:submit", {
            ...cmd(s),
            ...(gameKey === "blackout-run"
              ? { optionId: states.get(s)!.game!.survival!.options[0].id }
              : { text: `A ceremonial sock basket number ${i}` }),
          });
        await until(() =>
          all.every((s) => states.get(s)!.game!.phase === "vote"),
        );
        if (gameKey === "false-front") {
          assert.deepEqual(states.get(host)!.game!.bluff!.options, []);
          assert.equal(states.get(host)!.game!.bluff!.truth, null);
        } else assert.equal(states.get(host)!.game!.survival!.answers, null);
        for (const s of all) {
          const options =
            gameKey === "blackout-run"
              ? states.get(s)!.game!.survival!.options
              : states.get(s)!.private!.bluff!.options;
          assert.ok(options.every((o) => !("truth" in o) && !("authors" in o)));
          await must(s, "game:vote", { ...cmd(s), optionId: options[0].id });
        }
        await until(() => states.get(host)!.game!.phase === "reveal");
        assert.equal(
          (gameKey === "blackout-run"
            ? states.get(host)!.game!.survival!.rows
            : states.get(host)!.game!.bluff!.rows
          ).length,
          3,
        );
        others[0].socket.disconnect();
        const restored = await connect();
        await must(restored, "room:resume", {
          roomId: others[0].session.roomId,
          token: others[0].session.token,
        });
        others[0].socket = restored;
        assert.equal(states.get(restored)!.game!.phase, "reveal");
      } else {
        assert.equal(states.get(host)!.game!.charades!.guesserId, hostId);
        assert.equal(states.get(host)!.game!.deadline, null);
        await must(host, "game:submit", { ...cmd(host), action: "ready" });
        await until(() =>
          others.every((p) => states.get(p.socket)!.game!.phase === "vote"),
        );
        const wordId = states.get(others[0].socket)!.private!.charades!.wordId;
        assert.ok(wordId);
        assert.equal("word" in states.get(host)!.game!.charades!, false);
        assert.equal(states.get(host)!.private!.charades!.word, null);
        assert.ok(states.get(host)!.game!.charades!.category);
        assert.ok(states.get(others[0].socket)!.private!.charades!.word);
        await must(others[0].socket, "game:submit", {
          ...cmd(others[0].socket),
          action: "correct",
          wordId,
        });
        const stale = await request(others[1].socket, "game:submit", {
          ...cmd(others[1].socket),
          action: "correct",
          wordId,
        });
        assert.equal(stale.ok, false);
        host.disconnect();
        await until(() => states.get(others[0].socket)!.game!.paused);
        host = await connect(true);
        await must(host, "room:resume", {
          roomId: credentials.roomId,
          token: credentials.token,
        });
        assert.equal(states.get(host)!.role, "host");
        assert.equal(states.get(host)!.playerId, hostId);
        assert.equal(states.get(host)!.private!.charades!.isGuesser, true);
        assert.equal(states.get(host)!.private!.charades!.word, null);
        await must(host, "game:advance", cmd(host));
        assert.equal(
          states.get(host)!.players.find((p) => p.id === hostId)!.score,
          1,
        );
        await pause(1100);
        await must(host, "game:advance", cmd(host));
        const next = others[0];
        await until(() => states.get(next.socket)!.game!.phase === "allocate");
        await must(next.socket, "game:submit", {
          ...cmd(next.socket),
          action: "ready",
        });
        await until(() => states.get(host)!.game!.phase === "vote");
        next.socket.disconnect();
        await until(() => states.get(host)!.game!.paused);
        assert.match(states.get(host)!.game!.pauseReason!, /turn’s player/);
        next.socket = await connect();
        await must(next.socket, "room:resume", {
          roomId: next.session.roomId,
          token: next.session.token,
        });
        await until(() => !states.get(host)!.game!.paused);
        assert.ok(states.get(next.socket)!.private!.charades!.wordId);
      }
      await pause(1100);
      await must(host, "game:end", cmd(host));
      const finishedId = states.get(host)!.game!.id;
      const totals = states.get(host)!.standings!.map((p) => ({
        id: p.id,
        points: p.points,
        games: p.games,
      }));
      const replayCommand = cmd(host);
      assert.equal(
        (await request(others[0].socket, "game:rematch", cmd(others[0].socket)))
          .ok,
        false,
      );
      await must(host, "game:rematch", replayCommand);
      assert.notEqual(states.get(host)!.game!.id, finishedId);
      assert.equal(states.get(host)!.game!.phase, "instructions");
      assert.equal(states.get(host)!.playerId, hostId);
      assert.equal(states.get(host)!.settings!.carryScores, true);
      assert.deepEqual(
        states.get(host)!.standings!.map((p) => ({
          id: p.id,
          points: p.points,
          games: p.games,
        })),
        totals,
      );
      const rematchId = states.get(host)!.game!.id;
      await must(host, "game:rematch", replayCommand);
      assert.equal(
        states.get(host)!.game!.id,
        rematchId,
        "retry must not create another game",
      );
      await pause(1100);
      await must(host, "game:end", cmd(host));
      await must(host, "game:advance", cmd(host));
      assert.equal(states.get(host)!.game, null);
      await must(host, "host:remove", { id: hostId });
      assert.equal(states.get(host)!.role, "host");
      assert.equal(states.get(host)!.playerId, null);
      await must(host, "host:screen:revoke", {});
      assert.equal(
        (
          await request(display, "room:resume", {
            roomId: displaySession.roomId,
            token: displaySession.token,
          })
        ).ok,
        false,
      );
      assert.equal(states.get(host)!.displayCount, 0);
      await must(host, "room:close", {});
    } finally {
      sockets.forEach((s) => s.disconnect());
      await server.stop();
    }
  });
