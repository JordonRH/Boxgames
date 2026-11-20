import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { io, type Socket } from "socket.io-client";
import { createApp } from "../server/index.js";
import type { Ack, RoomView, Session } from "../shared/types.js";
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitFor(check: () => boolean, ms = 3000) {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > ms)
      throw new Error("Timed out waiting for expected state");
    await pause(15);
  }
}
function request<T = unknown>(
  socket: Socket,
  event: string,
  data: unknown,
): Promise<Ack<T>> {
  return new Promise((resolve, reject) => {
    socket
      .timeout(3000)
      .emit(event, data, (err: Error | null, ack: Ack<T>) =>
        err
          ? reject(new Error("Command acknowledgement timed out"))
          : resolve(ack),
      );
  });
}
async function must<T = unknown>(
  socket: Socket,
  event: string,
  data: unknown,
): Promise<T> {
  const a = await request<T>(socket, event, data);
  assert.ok(a.ok, `${event} was refused${!a.ok ? `: ${a.error}` : ""}`);
  return a.data;
}

test("complete six-round game: isolation, private views, retries, stale clients, pause, reconnect, removal, closure", async () => {
  const server = createApp({
    origin: "http://boxgame.test",
    maxRooms: 100,
    roomsPerNetwork: 10,
  });
  await new Promise<void>((r) => server.http.listen(0, "127.0.0.1", r));
  const port = (server.http.address() as { port: number }).port;
  const clients: Socket[] = [],
    states = new Map<Socket, RoomView>();
  const connect = async () => {
    const s = io(`http://127.0.0.1:${port}`, {
      forceNew: true,
      transports: ["websocket"],
      extraHeaders: { Origin: "http://boxgame.test" },
    });
    clients.push(s);
    s.on("room:state", (v) => states.set(s, v));
    await new Promise<void>((resolve, reject) => {
      s.once("connect", resolve);
      s.once("connect_error", () =>
        reject(new Error("Test connection rejected")),
      );
    });
    return s;
  };
  try {
    const host = await connect(),
      other = await connect();
    const session = await must<Session>(host, "room:create", {}),
      second = await must<Session>(other, "room:create", {});
    assert.notEqual(session.code, second.code);
    const players: Socket[] = [],
      credentials: Session[] = [];
    for (let i = 0; i < 3; i++) {
      const s = await connect();
      players.push(s);
      credentials.push(
        await must<Session>(s, "room:join", {
          code: session.code,
          name: `Player ${i + 1}`,
        }),
      );
      await waitFor(() => states.get(host)!.pending.length === 1);
      const pending = states.get(host)!.pending[0];
      await must(host, "host:admit", { id: pending.id });
      await waitFor(() => states.get(s)?.role === "player");
    }
    assert.equal(states.get(other)?.players.length, 0);
    assert.equal(states.get(players[0])?.pending.length, 0);
    await must(host, "host:settings", { duration: 0 });
    await must(host, "game:start", {
      commandId: randomUUID(),
      gameKey: "parcel-parliament",
    });
    await pause(1100);
    const cmd = (s: Socket) => ({
      commandId: randomUUID(),
      gameId: states.get(s)!.game!.id,
      phaseId: states.get(s)!.game!.phaseId,
    });
    await must(host, "game:advance", cmd(host));
    await waitFor(() => states.get(players[0])?.game?.phase === "allocate");
    const forged = await request(other, "game:pause", cmd(host));
    assert.equal(forged.ok, false);
    const playerHost = await request(players[0], "game:end", cmd(players[0]));
    assert.equal(playerHost.ok, false);
    await must(host, "game:pause", cmd(host));
    await waitFor(() => states.get(players[0])!.game!.paused);
    const paused = await request(players[0], "game:submit", {
      ...cmd(players[0]),
      allocation: [2, 2, 2],
      forecast: 0,
    });
    assert.equal(paused.ok, false);
    await must(host, "game:resume", cmd(host));
    await pause(1100);
    const bad = await request(players[0], "game:submit", {
      ...cmd(players[0]),
      allocation: [6, 6, 6],
      forecast: 0,
    });
    assert.equal(bad.ok, false);
    const first = { ...cmd(players[0]), allocation: [2, 2, 2], forecast: 0 };
    await must(players[0], "game:submit", first);
    await must(players[0], "game:submit", first);
    assert.equal(states.get(host)!.private, null);
    assert.equal(states.get(players[1])!.private!.allocation, null);
    assert.equal(states.get(host)!.game!.result, null);
    const containsKey = (value: unknown, key: string): boolean =>
      !!value &&
      typeof value === "object" &&
      Object.entries(value).some(
        ([name, child]) => name === key || containsKey(child, key),
      );
    assert.equal(containsKey(states.get(host)!.game, "forecast"), false);
    assert.equal(containsKey(states.get(host)!.game, "allocation"), false);
    players[0].disconnect();
    await waitFor(() => states.get(host)!.game!.paused);
    const resumed = await connect();
    players[0] = resumed;
    await must(resumed, "room:resume", {
      roomId: session.roomId,
      token: credentials[0].token,
    });
    await waitFor(() => !states.get(host)!.game!.paused);
    assert.deepEqual(states.get(resumed)!.private!.allocation, [2, 2, 2]);
    for (let round = 1; round <= 6; round++) {
      await waitFor(() =>
        players.every(
          (p) =>
            states.get(p)?.game?.phaseId === states.get(host)?.game?.phaseId,
        ),
      );
      if (round === 1) {
        for (const p of players.slice(1))
          await must(p, "game:submit", {
            ...cmd(p),
            allocation: [2, 2, 2],
            forecast: 0,
          });
      } else
        for (const p of players)
          await must(p, "game:submit", {
            ...cmd(p),
            allocation: [2, 2, 2],
            forecast: 0,
          });
      await waitFor(() =>
        players.every(
          (p) =>
            states.get(p)?.game?.phase === "vote" &&
            states.get(p)?.game?.phaseId === states.get(host)?.game?.phaseId,
        ),
      );
      const stale = await request(players[1], "game:vote", {
        ...cmd(players[1]),
        phaseId: first.phaseId,
        project: 0,
      });
      assert.equal(stale.ok, false);
      for (const p of players)
        await must(p, "game:vote", { ...cmd(p), project: 0 });
      await waitFor(() => states.get(host)!.game!.phase === "reveal");
      assert.ok(
        states
          .get(host)!
          .game!.result!.rows.every(
            (p) => p.points === 5 && p.total === round * 5,
          ),
      );
      await pause(1100);
      await must(host, "game:advance", cmd(host));
      await waitFor(
        () =>
          states.get(host)!.game!.phase ===
          (round === 6 ? "final" : "allocate"),
      );
    }
    assert.ok(states.get(host)!.players.every((p) => p.score === 30));
    assert.equal(states.get(host)!.game!.result, null);
    assert.equal(states.get(players[1])!.private!.allocation, null);
    await must(host, "game:advance", cmd(host));
    await waitFor(() => states.get(host)!.game === null);
    const playerId = states.get(players[1])!.playerId!;
    await must(host, "host:remove", { id: playerId });
    const removed = await request(players[1], "room:resume", {
      roomId: session.roomId,
      token: credentials[1].token,
    });
    assert.equal(removed.ok, false);
    await pause(1100);
    await must(host, "room:close", {});
    assert.equal(server.manager.rooms.has(session.roomId), false);
    assert.equal(server.manager.quarantine.has(session.code), true);
    assert.equal(server.manager.rooms.has(second.roomId), true);
  } finally {
    clients.forEach((s) => s.disconnect());
    await server.stop();
  }
});

test("fake clock enforces deadlines, frozen timers, host lease, idle and empty expiry", async () => {
  const { RoomManager } = await import("../server/rooms/manager.js");
  const { Server } = await import("socket.io");
  let now = 10000;
  const ioServer = new Server();
  const manager = new RoomManager(
    ioServer,
    {
      origin: "http://boxgame.test",
      maxRooms: 100,
      maxConnections: 1000,
      connectionsPerNetwork: 100,
      roomsPerNetwork: 5,
    },
    () => now,
  );
  const fakeSockets = new Map<string, any>();
  (ioServer.sockets as any).sockets = fakeSockets;
  function fake(sid: string) {
    const handlers = new Map<string, Function>();
    const socket: any = {
      id: sid,
      data: {},
      on: (e: string, fn: Function) => {
        handlers.set(e, fn);
        return socket;
      },
      emit: () => {},
      disconnect: () => handlers.get("disconnect")?.(),
    };
    fakeSockets.set(sid, socket);
    manager.attach(socket, "test");
    return {
      socket,
      send: (event: string, data: unknown) => {
        let ack: Ack | undefined;
        handlers.get(event)!(data, (a: Ack) => (ack = a));
        if (!ack?.ok) throw new Error(`Fake ${event} rejected`);
        return ack.data as any;
      },
      disconnect: () => handlers.get("disconnect")!(),
    };
  }
  try {
    const host = fake("host"),
      session = host.send("room:create", {});
    const ps = [fake("a"), fake("b"), fake("c")];
    for (const [i, p] of ps.entries()) {
      p.send("room:join", { code: session.code, name: `P${i}` });
      const r = manager.rooms.get(session.roomId)!;
      host.send("host:admit", { id: [...r.pending.keys()][0] });
    }
    const room = manager.rooms.get(session.roomId)!;
    host.send("game:start", {
      commandId: randomUUID(),
      gameKey: "parcel-parliament",
    });
    const cmd = () => ({
      commandId: randomUUID(),
      gameId: room.game!.id,
      phaseId: room.game!.phaseId,
    });
    host.send("game:advance", cmd());
    now += 10000;
    host.disconnect();
    assert.equal(room.remaining, 35000);
    now += 20000;
    manager.tick();
    assert.equal(room.game!.phase, "allocate");
    host.send("room:resume", { roomId: session.roomId, token: session.token });
    assert.equal(room.deadline, now + 35000);
    now += 35001;
    manager.tick();
    assert.equal(room.game!.phase, "vote");
    now += 20001;
    manager.tick();
    assert.equal(room.game!.phase, "reveal");
    assert.ok(room.game!.result!.rows.every((p) => p.points === 0));
    host.disconnect();
    now += 300001;
    manager.tick();
    assert.equal(manager.rooms.size, 0);
    now += 600001;
    const lonely = fake("lonely"),
      s = lonely.send("room:create", {});
    lonely.disconnect();
    manager.tick();
    now += 120001;
    manager.tick();
    assert.equal(manager.rooms.has(s.roomId), false);
    now += 600001;
    const idle = fake("idle");
    idle.send("room:create", {});
    now += 1800001;
    manager.tick();
    assert.equal(manager.rooms.size, 0);
  } finally {
    manager.stop();
  }
});

test("invalid origins are refused before joining", async () => {
  const server = createApp({ origin: "http://boxgame.test" });
  await new Promise<void>((r) => server.http.listen(0, "127.0.0.1", r));
  const port = (server.http.address() as { port: number }).port;
  const s = io(`http://127.0.0.1:${port}`, {
    forceNew: true,
    reconnection: false,
    transports: ["websocket"],
    extraHeaders: { Origin: "http://untrusted.test" },
  });
  try {
    await new Promise<void>((resolve, reject) => {
      s.once("connect", () =>
        reject(new Error("Unauthorized origin connected")),
      );
      s.once("connect_error", () => resolve());
    });
  } finally {
    s.disconnect();
    await server.stop();
  }
});
