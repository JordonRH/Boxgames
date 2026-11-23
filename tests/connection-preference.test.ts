import { test } from "node:test";
import assert from "node:assert/strict";
import { io } from "socket.io-client";
import { createApp } from "../server/index.js";
import { connectionOptions } from "../client/connection.js";
import type { Ack, Session } from "../shared/types.js";
for (const pollingOnly of [false, true])
  test(`browser connection ${pollingOnly ? "falls back when WebSockets are refused" : "prefers WebSockets"} and creates a room`, async () => {
    const app = createApp({ origin: "http://boxgame.test" });
    if (pollingOnly) app.io.engine.opts.transports = ["polling"];
    await new Promise<void>((r) => app.http.listen(0, "127.0.0.1", r));
    const socket = io(
      `http://127.0.0.1:${(app.http.address() as { port: number }).port}`,
      {
        ...connectionOptions,
        forceNew: true,
        reconnection: false,
        extraHeaders: { Origin: "http://boxgame.test" },
      },
    );
    try {
      await new Promise<void>((resolve, reject) => {
        socket.once("connect", resolve);
        socket.once("connect_error", () =>
          reject(new Error("Browser connection failed")),
        );
        socket.connect();
      });
      assert.equal(
        socket.io.engine.transport.name,
        pollingOnly ? "polling" : "websocket",
      );
      const ack = await new Promise<Ack<Session>>((resolve) =>
        socket.emit("room:create", {}, resolve),
      );
      assert.equal(ack.ok, true);
    } finally {
      socket.disconnect();
      await app.stop();
    }
  });
