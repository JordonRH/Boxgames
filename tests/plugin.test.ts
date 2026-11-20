import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Server } from "socket.io";
import type { Ack, GameView } from "../shared/types.js";
import type { GameEngine, GameFactory } from "../server/games/registry.js";
import { scenarios } from "../server/games/content.js";
import { RoomManager } from "../server/rooms/manager.js";

// An unrelated tap-counting test engine. It has no Parcel rules or transport code.
class CounterGame implements GameEngine {
  id = randomUUID();
  phaseId = randomUUID();
  phase: GameView["phase"] = "instructions";
  result = null;
  private tapped = new Set<string>();
  constructor(private ids: string[]) {}
  get input() {
    return this.phase === "allocate";
  }
  get final() {
    return this.phase === "final";
  }
  get advancesToInput() {
    return this.phase === "instructions";
  }
  hasPlayer(id: string) {
    return this.ids.includes(id);
  }
  score(id: string) {
    return this.tapped.has(id) ? 1 : 0;
  }
  duration() {
    return this.input ? 10000 : null;
  }
  submit(id: string, _action: string, payload: unknown) {
    assert.deepEqual(payload, { tap: true });
    this.tapped.add(id);
  }
  advance(): "changed" | "lobby" {
    if (this.final) return "lobby";
    this.phase = this.phase === "instructions" ? "allocate" : "final";
    return "changed";
  }
  end() {
    this.phase = "final";
  }
  complete(timeout: boolean) {
    if (this.input && (timeout || this.tapped.size === this.ids.length)) {
      this.phase = "reveal";
      return true;
    }
    return false;
  }
  remove(id: string) {
    this.ids = this.ids.filter((i) => i !== id);
  }
  publicView() {
    return {
      id: this.id,
      phaseId: this.phaseId,
      phase: this.phase,
      round: 1,
      rounds: 1,
      scenario: scenarios[0],
      submitted: this.tapped.size,
      eligible: this.ids.length,
      result: null,
    };
  }
  privateView() {
    return null;
  }
}
test("an injected second engine uses room admission, timing, transport and scoring without room code changes", () => {
  const transport = new Server(),
    members = new Map<string, any>();
  (transport.sockets as any).sockets = members;
  const factories = new Map<string, GameFactory>([
    [
      "test-counter",
      {
        minPlayers: 2,
        create: (players) => new CounterGame(players.map((p) => p.id)),
      },
    ],
  ]);
  const manager = new RoomManager(
    transport,
    {
      origin: "http://boxgame.test",
      maxRooms: 100,
      maxConnections: 1000,
      roomsPerNetwork: 5,
      connectionsPerNetwork: 100,
    },
    Date.now,
    factories,
  );
  const client = (id: string) => {
    const handlers = new Map<string, Function>();
    const socket: any = {
      id,
      data: {},
      on: (event: string, fn: Function) => {
        handlers.set(event, fn);
        return socket;
      },
      emit: () => {},
    };
    members.set(id, socket);
    manager.attach(socket, "test");
    return {
      socket,
      send: (event: string, payload: unknown) => {
        let result: Ack | undefined;
        handlers.get(event)!(payload, (ack: Ack) => (result = ack));
        assert.ok(result?.ok, `${event} should pass`);
        return result.data as any;
      },
    };
  };
  try {
    const host = client("host"),
      session = host.send("room:create", {}),
      players = [client("one"), client("two")];
    for (const [i, p] of players.entries()) {
      p.send("room:join", { code: session.code, name: `Person ${i}` });
      host.send("host:admit", {
        id: [...manager.rooms.values()][0].pending.keys().next().value,
      });
    }
    host.send("game:start", {
      commandId: randomUUID(),
      gameKey: "test-counter",
    });
    const room = manager.rooms.get(session.roomId)!;
    const command = () => ({
      commandId: randomUUID(),
      gameId: room.game!.id,
      phaseId: room.game!.phaseId,
    });
    host.send("game:advance", command());
    for (const p of players) p.send("game:submit", { ...command(), tap: true });
    assert.equal(room.game!.phase, "reveal");
    assert.ok(manager.view(room, "host").players.every((p) => p.score === 1));
    assert.equal(manager.view(room, "host").private, null);
    host.send("game:advance", command());
    assert.equal(room.game!.final, true);
  } finally {
    manager.stop();
  }
});
