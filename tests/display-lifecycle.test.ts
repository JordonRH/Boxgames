import { test } from "node:test";
import assert from "node:assert/strict";
import { Server } from "socket.io";
import { RoomManager } from "../server/rooms/manager.js";
import type { Ack } from "../shared/types.js";
test("screen codes expire, are isolated, capped, rate limited, revoked and removed with their room", () => {
  let now = 10000;
  const io = new Server(),
    manager = new RoomManager(
      io,
      {
        origin: "http://boxgame.test",
        maxRooms: 100,
        maxConnections: 1000,
        connectionsPerNetwork: 100,
        roomsPerNetwork: 5,
      },
      () => now,
    );
  const sockets = new Map<string, any>();
  (io.sockets as any).sockets = sockets;
  const fake = (sid: string) => {
    const handlers = new Map<string, Function>(),
      states: any[] = [];
    const s: any = {
      id: sid,
      data: {},
      on: (e: string, f: Function) => {
        handlers.set(e, f);
        return s;
      },
      emit: (e: string, v: unknown) => {
        if (e === "room:state") states.push(v);
      },
      disconnect: () => handlers.get("disconnect")?.(),
    };
    sockets.set(sid, s);
    manager.attach(s, sid);
    return {
      s,
      states,
      send: (e: string, d: unknown = {}) => {
        now += 1000;
        let a: Ack<any> | undefined;
        handlers.get(e)!(d, (v: Ack<any>) => (a = v));
        assert.ok(a);
        return a;
      },
      disconnect: s.disconnect,
    };
  };
  const data = (a: Ack<any>) => {
    assert.equal(a.ok, true);
    return a.ok ? a.data : null;
  };
  try {
    const h = fake("host"),
      r = data(h.send("room:create")),
      h2 = fake("other"),
      r2 = data(h2.send("room:create")),
      d = fake("display");
    const stale = data(h.send("host:screen"));
    now = stale.expires;
    assert.equal(d.send("display:join", { code: stale.code }).ok, false);
    const first = data(h.send("host:screen")),
      replaced = data(h.send("host:screen"));
    assert.equal(d.send("display:join", { code: first.code }).ok, false);
    const session = data(d.send("display:join", { code: replaced.code }));
    assert.equal(d.states.at(-1).id, r.roomId);
    assert.equal(d.states.at(-1).private, null);
    const count = d.states.length;
    h2.send("host:lock", { locked: true });
    assert.equal(
      d.states.length,
      count,
      "other-room updates must not reach this screen",
    );
    assert.equal(
      d.send("room:resume", { roomId: r2.roomId, token: session.token }).ok,
      false,
    );
    const second = fake("second"),
      p = data(h.send("host:screen"));
    data(second.send("display:join", { code: p.code }));
    assert.equal(
      h.send("host:screen").ok,
      false,
      "two paired screens is the limit",
    );
    d.disconnect();
    now += 300001;
    manager.tick();
    assert.equal(
      d.send("room:resume", { roomId: r.roomId, token: session.token }).ok,
      false,
    );
    data(h.send("host:screen:revoke"));
    assert.equal(second.send("host:screen").ok, false);
    assert.equal(
      second.send("room:resume", { roomId: r.roomId, token: session.token }).ok,
      false,
    );
    const pending = data(h.send("host:screen"));
    data(h.send("room:close"));
    assert.equal(d.send("display:join", { code: pending.code }).ok, false);
    const bad = fake("bad");
    let result: Ack<any> | undefined;
    for (let i = 0; i < 11; i++)
      result = bad.send("display:join", { code: "ZZZZZZ" });
    assert.equal(result!.ok, false);
    if (!result!.ok) assert.equal(result!.error, "rate_limited");
  } finally {
    manager.stop();
  }
});
