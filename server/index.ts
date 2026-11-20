import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Server } from "socket.io";
import { BlockList } from "node:net";
import { RoomManager, Limiter, type Config } from "./rooms/manager.js";
import type { GameFactory } from "./games/registry.js";

function int(
  value: string | undefined,
  fallback: number,
  min = 1,
  max = 100000,
) {
  const n = value === undefined ? fallback : Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max)
    throw new Error("Invalid numeric configuration");
  return n;
}
export function networkKey(address: string) {
  let ip = address.replace(/^::ffff:/, "");
  if (ip.includes(":")) {
    try {
      const normalized = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
      const [left, right] = normalized.split("::");
      const a = left ? left.split(":") : [],
        b = right ? right.split(":") : [];
      const parts =
        right === undefined
          ? a
          : [...a, ...Array(8 - a.length - b.length).fill("0"), ...b];
      return `${parts
        .slice(0, 4)
        .map((p) => p.padStart(4, "0"))
        .join(":")}::/64`;
    } catch {
      return "invalid-ip";
    }
  }
  return ip;
}
export function createApp(
  config: Partial<Config> = {},
  options: {
    trustedProxies?: string[];
    forwarded?: boolean;
    games?: Map<string, GameFactory>;
  } = {},
) {
  const publicUrl = new URL(config.origin ?? "http://localhost:5173");
  if (
    !["http:", "https:"].includes(publicUrl.protocol) ||
    publicUrl.username ||
    publicUrl.password ||
    publicUrl.pathname !== "/" ||
    publicUrl.search ||
    publicUrl.hash
  )
    throw new Error(
      "PUBLIC_ORIGIN must be a plain HTTP(S) origin without credentials, path, query, or fragment",
    );
  const origin = publicUrl.origin;
  const limits = new Limiter(),
    netCounts = new Map<string, number>();
  const app = express();
  app.disable("x-powered-by");
  const trusted = new BlockList();
  for (const address of options.trustedProxies ?? [])
    trusted.addAddress(address, address.includes(":") ? "ipv6" : "ipv4");
  const identity = (req: import("node:http").IncomingMessage) => {
    let ip = req.socket.remoteAddress ?? "unknown";
    if (
      options.forwarded &&
      trusted.check(
        ip.replace(/^::ffff:/, ""),
        ip.replace(/^::ffff:/, "").includes(":") ? "ipv6" : "ipv4",
      )
    ) {
      const header = req.headers["cf-connecting-ip"];
      if (typeof header === "string" && header.length <= 45) {
        try {
          new BlockList().addAddress(
            header,
            header.includes(":") ? "ipv6" : "ipv4",
          );
          ip = header;
        } catch {}
      }
    }
    return networkKey(ip);
  };
  const allowed = new Set([
    origin,
    ...(process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean),
  ]);
  app.use((_req, res, next) => {
    res.set({
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Cache-Control": "no-store",
    });
    next();
  });
  app.use((req, res, next) => {
    if (
      !req.path.startsWith("/assets/") &&
      !limits.take(`http:${identity(req)}`, 600, 60000)
    ) {
      res.status(429).json({ error: "rate_limited" });
      return;
    }
    next();
  });
  app.get("/api/health", (_req, res) =>
    res.json({
      status: "ok",
      version: "0.1.0",
      revision: process.env.APP_REVISION ?? "local",
    }),
  );
  const http = createServer(app);
  const full: Config = {
    maxRooms: 100,
    maxConnections: 1000,
    connectionsPerNetwork: 100,
    roomsPerNetwork: 5,
    ...config,
    origin,
  };
  const io = new Server(http, {
    maxHttpBufferSize: 8192,
    perMessageDeflate: false,
    serveClient: false,
    cors: { origin: [...allowed] },
    allowRequest: (req, callback) => {
      const net = identity(req);
      const validOrigin =
        typeof req.headers.origin === "string" &&
        allowed.has(req.headers.origin);
      callback(
        null,
        validOrigin &&
          io.engine.clientsCount < full.maxConnections &&
          (netCounts.get(net) ?? 0) < full.connectionsPerNetwork &&
          limits.take(`connect:${net}`, 120, 60000),
      );
    },
  });
  io.engine.on("connection", (socket) => {
    const net = identity(socket.request);
    netCounts.set(net, (netCounts.get(net) ?? 0) + 1);
    socket.once("close", () => {
      const n = (netCounts.get(net) ?? 1) - 1;
      if (n <= 0) netCounts.delete(net);
      else netCounts.set(net, n);
    });
  });
  const manager = new RoomManager(io, full, Date.now, options.games);
  io.on("connection", (socket) =>
    manager.attach(socket, identity(socket.request)),
  );
  const clientDir = fileURLToPath(new URL("../client/", import.meta.url));
  app.use(
    "/assets",
    express.static(path.join(clientDir, "assets"), {
      immutable: true,
      maxAge: "1y",
      setHeaders: (res) =>
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable"),
    }),
  );
  app.use("/assets", (_req, res) => {
    res.status(404).end();
  });
  app.get("/icon.svg", (_req, res) =>
    res.sendFile(path.join(clientDir, "icon.svg")),
  );
  app.get(["/", "/join", "/host", "/privacy"], (_req, res) =>
    res.sendFile(path.join(clientDir, "index.html")),
  );
  app.use((_req, res) => {
    res.status(404).json({ error: "not_found" });
  });
  const sweep = setInterval(() => limits.sweep(), 60000);
  sweep.unref();
  return {
    app,
    http,
    io,
    manager,
    stop: async () => {
      clearInterval(sweep);
      manager.stop();
      await new Promise<void>((resolve) => io.close(() => resolve()));
    },
  };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const production = process.env.NODE_ENV === "production";
  if (production && !process.env.PUBLIC_ORIGIN)
    throw new Error("PUBLIC_ORIGIN is required");
  if (production && process.env.TRUSTED_PROXY_IPS === undefined)
    throw new Error(
      "Set TRUSTED_PROXY_IPS explicitly; empty means direct clients",
    );
  const instance = createApp(
    {
      origin: process.env.PUBLIC_ORIGIN ?? "http://localhost:5173",
      maxRooms: int(process.env.MAX_ROOMS, 100, 1, 100),
      maxConnections: int(process.env.MAX_CONNECTIONS, 1000, 1, 1000),
      connectionsPerNetwork: int(process.env.CONNECTIONS_PER_NETWORK, 100),
      roomsPerNetwork: int(process.env.ROOMS_PER_NETWORK, 5),
    },
    {
      trustedProxies: (process.env.TRUSTED_PROXY_IPS ?? "")
        .split(",")
        .filter(Boolean),
      forwarded: process.env.TRUST_CF_CONNECTING_IP === "true",
    },
  );
  const port = int(process.env.PORT, 3000, 1, 65535);
  instance.http.listen(port, process.env.LISTEN_HOST ?? "0.0.0.0", () =>
    console.log(JSON.stringify({ event: "listening", port, version: "0.1.0" })),
  );
  let stopping = false;
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, async () => {
      if (stopping) return;
      stopping = true;
      for (const room of [...instance.manager.rooms.values()])
        instance.manager.close(
          room,
          "The server is restarting. Create a new room when it is back.",
        );
      setTimeout(() => process.exit(1), 5000).unref();
      await new Promise((resolve) => setTimeout(resolve, 250));
      await instance.stop();
      process.exit(0);
    });
}
