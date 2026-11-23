import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { io, type Socket } from "socket.io-client";
import { createApp } from "../server/index.js";
import { arcadeKinds } from "../server/games/arcade.js";
import type { Ack, Session, RoomView } from "../shared/types.js";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until(fn: () => boolean) {
  for (let i = 0; i < 400; i++) {
    if (fn()) return;
    await wait(10);
  }
  throw new Error("Arcade state timed out");
}
for (const [key, kind] of Object.entries(arcadeKinds))
  test(`${key}: controllers, public screen, private inputs, reveal and rematch through Socket.IO`, async () => {
    const app = createApp({ origin: "http://boxgame.test" });
    await new Promise<void>((r) => app.http.listen(0, "127.0.0.1", r));
    const base = `http://127.0.0.1:${(app.http.address() as { port: number }).port}`,
      sockets: Socket[] = [],
      states = new Map<Socket, RoomView>();
    const connect = async () => {
      const s = io(base, {
        forceNew: true,
        reconnection: false,
        transports: ["websocket"],
        extraHeaders: { Origin: "http://boxgame.test" },
      });
      sockets.push(s);
      s.on("room:state", (v) => states.set(s, v));
      await new Promise<void>((resolve, reject) => {
        s.once("connect", resolve);
        s.once("connect_error", () =>
          reject(new Error("Arcade connection failed")),
        );
      });
      return s;
    };
    const request = <T = unknown>(
      s: Socket,
      event: string,
      data: unknown = {},
    ): Promise<Ack<T>> =>
      new Promise((resolve, reject) =>
        s
          .timeout(6000)
          .emit(event, data, (e: Error | null, a: Ack<T>) =>
            e ? reject(new Error(`${event} timed out`)) : resolve(a),
          ),
      );
    const must = async <T = unknown>(
      s: Socket,
      event: string,
      data: unknown = {},
    ) => {
      const a = await request<T>(s, event, data);
      assert.ok(a.ok, `${event}: ${a.ok ? "" : a.error}`);
      return a.data;
    };
    const cmd = (s: Socket) => ({
      commandId: randomUUID(),
      gameId: states.get(s)!.game!.id,
      phaseId: states.get(s)!.game!.phaseId,
    });
    try {
      const host = await connect(),
        session = await must<Session>(host, "room:create"),
        pair = await must<{ code: string }>(host, "host:screen"),
        display = await connect();
      await must(display, "display:join", { code: pair.code });
      await must(host, "host:play", { name: "Host player" });
      const people = [host];
      for (let i = 0; i < 2; i++) {
        const p = await connect();
        people.push(p);
        await must(p, "room:join", { code: session.code, name: `Guest ${i}` });
        await until(() => states.get(host)!.pending.length === 1);
        await must(host, "host:admit", { id: states.get(host)!.pending[0].id });
      }
      await wait(1100);
      await must(host, "host:game", { gameKey: key });
      await must(host, "game:start", { commandId: randomUUID() });
      await must(host, "game:advance", cmd(host));
      await until(() =>
        people.every((s) => states.get(s)?.game?.phase === "allocate"),
      );
      assert.equal(states.get(display)!.private, null);
      assert.equal(states.get(display)!.game!.arcade!.reveal, null);
      assert.equal(
        (await request(display, "game:submit", { ...cmd(display), year: 1990 }))
          .ok,
        false,
      );
      assert.equal(
        (await fetch(`${base}/api/art/${session.code}/${randomUUID()}.svg`))
          .status,
        404,
      );
      const payload =
        kind === "year"
          ? { year: 1990 }
          : kind === "world"
            ? { lat: 0, lon: 0 }
            : kind === "australia"
              ? { lat: -30, lon: 135 }
              : kind === "rapid"
                ? { checks: [true, false, true, false, true, false] }
                : kind === "drawing"
                  ? {
                      strokes: [
                        {
                          color: 0,
                          points: [
                            [10, 10],
                            [90, 90],
                          ],
                        },
                      ],
                    }
                  : kind === "artist" || kind === "rare"
                    ? { text: "An unlikely answer" }
                    : {
                        choiceId:
                          states.get(host)!.game!.arcade!.choices![0].id,
                      };
      for (const p of people)
        await must(p, "game:submit", { ...cmd(p), ...payload });
      if (kind === "artist" || kind === "drawing") {
        await until(() =>
          people.every((s) => states.get(s)!.game!.phase === "vote"),
        );
        if (kind === "drawing") {
          await until(() => states.get(display)?.game?.phase === "vote");
          const gallery = states.get(display)!.game!.arcade!.gallery!;
          assert.equal(gallery.length, 3);
          assert.ok(gallery.every((g) => !g.authorId && !g.strokes));
          const art = await fetch(
            `${base}/api/art/${session.code}/${gallery[0].id}.svg`,
          );
          assert.equal(art.status, 200);
          assert.match(art.headers.get("content-type")!, /image\/svg\+xml/);
          assert.match(await art.text(), /<polyline/);
          assert.equal(
            (await fetch(`${base}/api/art/ZZZZZZ/${gallery[0].id}.svg`)).status,
            404,
          );
        }
        for (const p of people)
          await must(p, "game:vote", {
            ...cmd(p),
            ...(kind === "drawing"
              ? { choiceId: states.get(p)!.private!.arcade!.choices![0] }
              : { text: "Still unlikely" }),
          });
      }
      await until(() => states.get(display)?.game?.phase === "reveal");
      assert.equal(states.get(display)!.private, null);
      assert.equal(states.get(display)!.game!.arcade!.reveal!.rows.length, 3);
      const old = cmd(host);
      await wait(1100);
      await must(host, "game:end", cmd(host));
      await must(host, "game:rematch", cmd(host));
      await until(() => states.get(host)!.game!.phase === "instructions");
      assert.equal(
        (await request(host, "game:submit", { ...old, ...payload })).ok,
        false,
      );
      await must(host, "room:close");
    } finally {
      sockets.forEach((s) => s.disconnect());
      await app.stop();
    }
  });
