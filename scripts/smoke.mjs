// Disposable production-image check. Outputs only aggregate checks and public revision.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { io } from "socket.io-client";

const base = process.argv[2] ?? "http://127.0.0.1:8100";
const origin = process.argv[3] ?? "http://localhost:8100";
const expected = process.argv[4];
const sockets = [],
  states = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check) {
  for (let i = 0; i < 300; i++) {
    if (check()) return;
    await sleep(10);
  }
  throw new Error("Expected smoke-test state did not arrive");
}
async function command(s, event, payload) {
  return new Promise((resolve, reject) =>
    s.timeout(4000).emit(event, payload, (err, ack) => {
      if (err || !ack?.ok) reject(new Error(`${event} failed in smoke test`));
      else resolve(ack.data);
    }),
  );
}
async function connect() {
  // Alternate normal browser polling (no Origin on same-origin GET) and WebSockets.
  const polling = sockets.length % 2 === 0;
  const s = io(base, {
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
  await new Promise((resolve, reject) => {
    s.once("connect", resolve);
    s.once("connect_error", () =>
      reject(
        new Error(
          `Smoke-test ${polling ? "polling" : "WebSocket"} handshake was refused`,
        ),
      ),
    );
  });
  return s;
}
const envelope = (s) => ({
  commandId: randomUUID(),
  gameId: states.get(s).game.id,
  phaseId: states.get(s).game.phaseId,
});
let host;
try {
  const health = await fetch(`${base}/api/health`);
  assert.ok(health.ok);
  const info = await health.json();
  if (expected) assert.equal(info.revision, expected);
  const page = await fetch(base);
  assert.ok(page.ok);
  assert.match(
    page.headers.get("content-security-policy") ?? "",
    /frame-ancestors 'none'/,
  );
  const html = await page.text();
  assert.match(html, /<title>Boxgame/);
  const assets = [...html.matchAll(/(?:src|href)="(\/[^\"]+)"/g)].map(
    (m) => m[1],
  );
  assert.ok(assets.length >= 2);
  for (const asset of assets)
    assert.ok((await fetch(`${base}${asset}`)).ok, "A built asset was missing");
  assert.equal((await fetch(`${base}/assets/missing-file.js`)).status, 404);
  assert.ok((await fetch(`${base}/privacy`)).ok);
  host = await connect();
  const session = await command(host, "room:create", {});
  const players = [];
  for (let i = 0; i < 3; i++) {
    const p = await connect();
    players.push(p);
    await command(p, "room:join", {
      code: session.code,
      name: `Smoke player ${i + 1}`,
    });
    await until(() => states.get(host).pending.length === 1);
    await command(host, "host:admit", { id: states.get(host).pending[0].id });
  }
  await command(host, "game:start", { commandId: randomUUID() });
  await command(host, "game:advance", envelope(host));
  await until(() =>
    players.every((p) => states.get(p)?.game?.phase === "allocate"),
  );
  assert.equal(states.get(host).private, null);
  assert.equal(states.get(host).game.result, null);
  for (const p of players)
    await command(p, "game:submit", {
      ...envelope(p),
      allocation: [2, 2, 2],
      forecast: 0,
    });
  await until(() => players.every((p) => states.get(p).game.phase === "vote"));
  for (const p of players)
    await command(p, "game:vote", { ...envelope(p), project: 0 });
  await until(() => states.get(host).game.phase === "reveal");
  assert.ok(states.get(host).game.result.rows.every((p) => p.points === 5));
  await command(host, "game:end", envelope(host));
  assert.ok(states.get(host).players.every((p) => p.score === 5));
  await command(host, "room:close", {});
  host = null;
  console.log(
    JSON.stringify({
      status: "pass",
      revision: info.revision,
      assets: assets.length,
      players: 3,
      roundScore: 5,
      privateViews: true,
      transports: ["polling", "websocket"],
    }),
  );
} finally {
  if (host?.connected) await command(host, "room:close", {}).catch(() => {});
  sockets.forEach((s) => s.disconnect());
}
