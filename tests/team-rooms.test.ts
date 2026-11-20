import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { io, type Socket } from "socket.io-client";
import { clueCards } from "../server/games/party-content.js";
import { createApp } from "../server/index.js";
import type { Ack, RoomView, Session } from "../shared/types.js";
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until(check: () => boolean) {
  for (let i = 0; i < 400; i++) {
    if (check()) return;
    await pause(10);
  }
  throw new Error("Team state did not arrive");
}
async function request(
  s: Socket,
  event: string,
  data: unknown,
): Promise<Ack<any>> {
  return new Promise((resolve, reject) =>
    s
      .timeout(4000)
      .emit(event, data, (e: Error | null, a: Ack<any>) =>
        e ? reject(new Error("Team acknowledgement timed out")) : resolve(a),
      ),
  );
}
async function must(s: Socket, event: string, data: unknown) {
  const a = await request(s, event, data);
  assert.ok(a.ok, `${event}: ${!a.ok ? a.error : ""}`);
  return a.data;
}
test("team settings, opponent isolation, pause/reconnect, feedback authorization and fresh rematch over real sockets", async () => {
  const httpServer = createServer();
  await new Promise<void>((r) => httpServer.listen(0, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${(httpServer.address() as { port: number }).port}`,
    server = createApp({ origin }, { httpServer });
  const sockets: Socket[] = [],
    states = new Map<Socket, RoomView>();
  const connect = async () => {
    const s = io(origin, {
      forceNew: true,
      reconnection: false,
      transports: ["websocket"],
      extraHeaders: { Origin: origin },
    });
    sockets.push(s);
    s.on("room:state", (v) => states.set(s, v));
    await new Promise<void>((resolve, reject) => {
      s.once("connect", resolve);
      s.once("connect_error", () =>
        reject(new Error("Team connection failed")),
      );
    });
    return s;
  };
  const host = await connect(),
    players: { socket: Socket; session: Session }[] = [];
  const cmd = (s: Socket) => ({
    commandId: randomUUID(),
    gameId: states.get(s)!.game!.id,
    phaseId: states.get(s)!.game!.phaseId,
  });
  try {
    const session = await must(host, "room:create", {});
    await must(host, "host:play", { name: "Alex" });
    for (let i = 0; i < 3; i++) {
      const s = await connect();
      const session = await must(s, "room:join", {
        code: states.get(host)!.code,
        name: `Team friend ${i}`,
      });
      await until(() => states.get(host)!.pending.length === 1);
      await must(host, "host:admit", { id: states.get(host)!.pending[0].id });
      players.push({ socket: s, session });
    }
    await pause(1100);
    await must(host, "host:settings", {
      clueMode: "teams",
      teamTarget: 5,
      carryScores: true,
    });
    assert.equal(
      (
        await request(players[0].socket, "host:settings", {
          difficulty: "hard",
        })
      ).ok,
      false,
    );
    const ids = states.get(host)!.players.map((p) => p.id);
    await must(host, "host:settings", {
      teams: Object.fromEntries(ids.map((id) => [id, 0])),
    });
    assert.equal(
      (
        await request(host, "game:start", {
          commandId: randomUUID(),
          gameKey: "clue-crew",
        })
      ).ok,
      false,
    );
    assert.equal(states.get(host)!.contentUsed, 0);
    await must(host, "host:settings", {
      teams: Object.fromEntries(ids.map((id, i) => [id, i % 2])),
    });
    await must(host, "game:start", {
      commandId: randomUUID(),
      gameKey: "clue-crew",
    });
    await must(host, "game:advance", cmd(host));
    await must(host, "game:submit", { ...cmd(host), action: "ready" });
    await until(() =>
      players.every((p) => states.get(p.socket)!.game!.phase === "vote"),
    );
    const helper = players[1].socket,
      opponent = players[0].socket;
    assert.ok(states.get(helper)!.private!.charades!.word);
    assert.equal(states.get(host)!.private!.charades!.word, null);
    assert.equal(states.get(opponent)!.private!.charades!.word, null);
    assert.equal(
      (
        await request(opponent, "game:submit", {
          ...cmd(opponent),
          action: "correct",
          wordId: states.get(helper)!.private!.charades!.wordId,
        })
      ).ok,
      false,
    );
    players[1].socket.disconnect();
    await until(() => !!states.get(host)!.game!.paused);
    players[1].socket = await connect();
    await must(players[1].socket, "room:resume", {
      roomId: players[1].session.roomId,
      token: players[1].session.token,
    });
    await until(() => !states.get(host)!.game!.paused);
    const restored = players[1].socket;
    for (let i = 0; i < 5; i++)
      await must(restored, "game:submit", {
        ...cmd(restored),
        action: "correct",
        wordId: states.get(restored)!.private!.charades!.wordId,
      });
    await pause(1100);
    await must(host, "game:advance", cmd(host));
    assert.equal(states.get(host)!.game!.charades!.teams![0].score, 5);
    await must(host, "game:advance", cmd(host));
    await until(() => states.get(opponent)!.game!.phase === "allocate");
    await must(opponent, "game:submit", { ...cmd(opponent), action: "ready" });
    await until(() => states.get(host)!.game!.phase === "vote");
    await must(host, "game:advance", cmd(host));
    assert.match(states.get(host)!.game!.charades!.outcome!, /Team Lime wins/);
    await must(host, "game:advance", cmd(host));
    assert.equal(states.get(host)!.game!.phase, "final");
    const oldGame = states.get(host)!.game!.id;
    const room = server.manager.rooms.get(session.roomId)!;
    const usedWords = room.contentHistory.get("clue words")!;
    room.contentHistory.set(
      "clue words",
      new Set(clueCards.map((c) => c.word)),
    );
    const beforeFailed = [...room.contentHistory].map(([key, seen]) => [
      key,
      [...seen],
    ]);
    const failed = await request(host, "game:rematch", cmd(host));
    assert.equal(failed.ok, false);
    if (!failed.ok) assert.equal(failed.error, "content_exhausted");
    assert.equal(states.get(host)!.game!.id, oldGame);
    assert.deepEqual(
      [...room.contentHistory].map(([key, seen]) => [key, [...seen]]),
      beforeFailed,
    );
    room.contentHistory.set("clue words", usedWords);
    await must(host, "game:rematch", cmd(host));
    assert.notEqual(states.get(host)!.game!.id, oldGame);
    assert.equal(states.get(host)!.game!.charades!.target, 5);
    assert.equal(
      states.get(host)!.standings!.find((p) => p.id === ids[0])!.points,
      5,
    );
    await pause(1100);
    await must(host, "game:end", cmd(host));
    await must(host, "game:advance", cmd(host));
    assert.equal((await request(opponent, "host:reset-content", {})).ok, false);
    await must(host, "host:reset-content", {});
    assert.equal(states.get(host)!.contentUsed, 0);
    await must(host, "host:reset-scores", {});
    assert.ok(
      states
        .get(host)!
        .standings!.every((p) => p.points === 0 && p.games === 0),
    );
    // Reveal-only reports use the same room and role validation as game moves.
    await must(host, "game:start", {
      commandId: randomUUID(),
      gameKey: "blackout-run",
    });
    await must(host, "game:advance", cmd(host));
    assert.equal(
      (
        await request(host, "game:feedback", {
          ...cmd(host),
          reason: "incorrect",
        })
      ).ok,
      false,
    );
    assert.equal(session.roomId, states.get(host)!.id);
    await must(host, "room:close", {});
  } finally {
    sockets.forEach((s) => s.disconnect());
    await server.stop();
  }
});
