import { test } from "node:test";
import assert from "node:assert/strict";
import { io } from "socket.io-client";
import { createServer } from "node:http";
import { handshakePolicy } from "../server/handshake.js";
import { createApp } from "../server/index.js";
import type { Ack, Session } from "../shared/types.js";

test("browser same-origin polling without Origin is allowed; foreign requests remain rejected", () => {
  const accepts = handshakePolicy(
    new Set(["https://boxgame.test", "http://192.168.1.50:8100"]),
  );
  const url = "/socket.io/?EIO=4&transport=polling";
  assert.ok(
    accepts({
      url,
      headers: { host: "boxgame.test", "sec-fetch-site": "same-origin" },
    }),
  );
  assert.ok(
    accepts({ url, headers: { host: "192.168.1.50:8100" } }),
    "plain HTTP LAN polling works without secure Fetch Metadata",
  );
  assert.equal(
    accepts({
      url,
      headers: { host: "untrusted.test", "sec-fetch-site": "same-origin" },
    }),
    false,
  );
  for (const site of ["cross-site", "same-site", "none"])
    assert.equal(
      accepts({
        url,
        headers: { host: "boxgame.test", "sec-fetch-site": site },
      }),
      false,
    );
  for (const origin of ["https://untrusted.test", "null", ""])
    assert.equal(
      accepts({
        url,
        headers: {
          host: "boxgame.test",
          origin,
          "sec-fetch-site": "same-origin",
        },
      }),
      false,
    );
  assert.equal(
    accepts({
      url: "/socket.io/?EIO=4&transport=websocket",
      headers: { host: "boxgame.test" },
    }),
    false,
  );
  assert.ok(
    accepts({
      url: "/socket.io/?EIO=4&transport=websocket",
      headers: { host: "boxgame.test", origin: "https://boxgame.test" },
    }),
  );
});

test("a browser-style polling controller can connect and create a room without an Origin header", async () => {
  // Bind first so the configured origin and the real browser Host match exactly.
  const httpServer = createServer();
  await new Promise<void>((resolve) =>
    httpServer.listen(0, "127.0.0.1", resolve),
  );
  const port = (httpServer.address() as { port: number }).port;
  const origin = `http://127.0.0.1:${port}`;
  const server = createApp({ origin }, { httpServer });
  const controller = io(`http://127.0.0.1:${port}`, {
    forceNew: true,
    reconnection: false,
    transports: ["polling"],
    upgrade: false,
    extraHeaders: { "Sec-Fetch-Site": "same-origin" },
    timeout: 3000,
  });
  try {
    await new Promise<void>((resolve, reject) => {
      controller.once("connect", resolve);
      controller.once("connect_error", () =>
        reject(new Error("Browser-style polling handshake refused")),
      );
    });
    const ack = await new Promise<Ack<Session>>((resolve, reject) =>
      controller
        .timeout(3000)
        .emit(
          "room:create",
          {},
          (error: Error | null, response: Ack<Session>) =>
            error
              ? reject(new Error("Room creation timed out"))
              : resolve(response),
        ),
    );
    assert.ok(
      ack.ok,
      "Room creation must work through the browser polling connection",
    );
    assert.equal(ack.data.role, "host");
    assert.match(ack.data.code, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
  } finally {
    controller.disconnect();
    await server.stop();
  }
});
