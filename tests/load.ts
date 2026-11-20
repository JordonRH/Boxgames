// Disposable in-process load test. Never points at a live server or stores credentials.
import { io, type Socket } from "socket.io-client";
import { randomUUID } from "node:crypto";
import { monitorEventLoopDelay, performance } from "node:perf_hooks";
import { createApp } from "../server/index.js";
import type { Ack, RoomView, Session } from "../shared/types.js";
const rooms = Number(process.argv[2] ?? 10),
  seconds = Number(process.argv[3] ?? 30);
if (
  !Number.isInteger(rooms) ||
  rooms < 1 ||
  rooms > 100 ||
  !Number.isInteger(seconds) ||
  seconds < 10 ||
  seconds > 1800
)
  throw new Error("Use 1–100 rooms and 10–1800 seconds.");
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const server = createApp(
  {
    origin: "http://load.boxgame.test",
    connectionsPerNetwork: 1000,
    roomsPerNetwork: 100,
  },
  { trustedProxies: ["127.0.0.1"], forwarded: true },
);
await new Promise<void>((r) => server.http.listen(0, "127.0.0.1", r));
const port = (server.http.address() as { port: number }).port;
const states = new Map<Socket, RoomView>(),
  sockets: Socket[] = [],
  latencies: number[] = [];
let failures = 0,
  commands = 0,
  bytes = 0,
  snapshots = 0,
  peakRss = 0,
  peakHeap = 0;
const delay = monitorEventLoopDelay({ resolution: 20 });
delay.enable();
async function connect(network: number) {
  const s = io(`http://127.0.0.1:${port}`, {
    forceNew: true,
    transports: ["websocket"],
    extraHeaders: {
      Origin: "http://load.boxgame.test",
      "CF-Connecting-IP": `192.0.2.${network}`,
    },
  });
  sockets.push(s);
  s.on("room:state", (v) => {
    states.set(s, v);
    snapshots++;
    bytes += Buffer.byteLength(JSON.stringify(v));
  });
  await new Promise<void>((resolve, reject) => {
    s.once("connect", resolve);
    s.once("connect_error", () => reject(new Error("Load connection refused")));
  });
  return s;
}
async function send<T = unknown>(
  s: Socket,
  event: string,
  data: unknown,
): Promise<T> {
  const t = performance.now();
  commands++;
  const ack = await new Promise<Ack<T>>((resolve, reject) =>
    s
      .timeout(10000)
      .emit(event, data, (err: Error | null, a: Ack<T>) =>
        err ? reject(new Error("Load command timed out")) : resolve(a),
      ),
  );
  latencies.push(performance.now() - t);
  if (!ack.ok) {
    failures++;
    throw new Error(`Load command refused: ${event} ${ack.error}`);
  }
  return ack.data;
}
const cmd = (s: Socket) => ({
  commandId: randomUUID(),
  gameId: states.get(s)!.game!.id,
  phaseId: states.get(s)!.game!.phaseId,
});
async function synced(group: Socket[]) {
  for (let i = 0; i < 500; i++) {
    const ref = states.get(group[0]);
    if (
      ref?.game &&
      group.every((s) => states.get(s)?.game?.phaseId === ref.game!.phaseId)
    )
      return;
    await wait(10);
  }
  throw new Error("Load phase sync timed out");
}
const groups: { host: Socket; players: Socket[] }[] = [];
try {
  for (let offset = 0; offset < rooms; offset += 5)
    await Promise.all(
      Array.from({ length: Math.min(5, rooms - offset) }, async (_, j) => {
        const network = offset + j + 1,
          host = await connect(network),
          session = await send<Session>(host, "room:create", {}),
          players: Socket[] = [];
        for (let i = 0; i < 8; i++) {
          const s = await connect(network);
          players.push(s);
          await send(s, "room:join", {
            code: session.code,
            name: `Player ${i + 1}`,
          });
          for (let n = 0; n < 200 && !states.get(host)?.pending.length; n++)
            await wait(10);
          await send(host, "host:admit", {
            id: states.get(host)!.pending[0].id,
          });
        }
        await wait(1100);
        await send(host, "host:settings", { duration: 0 });
        await send(host, "game:start", { commandId: randomUUID() });
        await synced([host, ...players]);
        groups.push({ host, players });
      }),
    );
  console.log(
    JSON.stringify({
      event: "load_ready",
      rooms,
      connections: sockets.length,
      seconds,
    }),
  );
  const start = Date.now(),
    until = start + seconds * 1000;
  const stats = setInterval(() => {
    const m = process.memoryUsage();
    peakRss = Math.max(peakRss, m.rss);
    peakHeap = Math.max(peakHeap, m.heapUsed);
    console.log(
      JSON.stringify({
        event: "load_progress",
        elapsedSeconds: Math.round((Date.now() - start) / 1000),
        commands,
        failures,
        heapMiB: Math.round(m.heapUsed / 1048576),
      }),
    );
  }, 60000);
  stats.unref();
  await Promise.all(
    groups.map(async ({ host, players }, index) => {
      await wait(index * 100);
      while (Date.now() < until) {
        await synced([host, ...players]);
        const phase = states.get(host)!.game!.phase;
        if (phase === "instructions" || phase === "reveal")
          await send(host, "game:advance", cmd(host));
        else if (phase === "allocate")
          for (const p of players) {
            await send(p, "game:submit", {
              ...cmd(p),
              allocation: [2, 2, 2],
              forecast: 0,
            });
            await wait(25);
          }
        else if (phase === "vote")
          for (const p of players) {
            await send(p, "game:vote", { ...cmd(p), project: 0 });
            await wait(25);
          }
        else if (phase === "final") {
          await send(host, "game:advance", cmd(host));
          await wait(150);
          await send(host, "game:start", { commandId: randomUUID() });
        }
        await wait(2200);
      }
    }),
  );
  clearInterval(stats);
  delay.disable();
  latencies.sort((a, b) => a - b);
  const result = {
    rooms,
    connections: sockets.length,
    durationSeconds: Math.round((Date.now() - start) / 1000),
    commands,
    failures,
    ackP95Ms: Math.round(latencies[Math.floor(latencies.length * 0.95)] ?? 0),
    eventLoopP95Ms: Math.round(delay.percentile(95) / 1e6),
    peakCombinedRssMiB: Math.round(peakRss / 1048576),
    peakCombinedHeapMiB: Math.round(peakHeap / 1048576),
    snapshots,
    averageOutboundMbps: Number(((bytes * 8) / seconds / 1e6).toFixed(2)),
    note: "Server and simulated clients share one process; RSS includes all simulated browsers. This does not replace real-device or container soak testing.",
  };
  console.log(JSON.stringify({ event: "load_result", ...result }));
  if (failures > 0 || result.ackP95Ms > 300 || result.eventLoopP95Ms > 50)
    process.exitCode = 1;
} catch (e) {
  console.error(
    JSON.stringify({
      event: "load_failed",
      reason: (e as Error).message,
      commands,
      failures,
    }),
  );
  process.exitCode = 1;
} finally {
  sockets.forEach((s) => s.disconnect());
  await server.stop();
}
