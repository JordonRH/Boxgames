import type { IncomingMessage } from "node:http";

/** Same-origin polling GETs legitimately omit Origin, including on plain-HTTP LANs. */
export function handshakePolicy(allowedOrigins: ReadonlySet<string>) {
  const allowedHosts = new Set(
    [...allowedOrigins].map((origin) => new URL(origin).host.toLowerCase()),
  );
  return (req: Pick<IncomingMessage, "headers" | "url">): boolean => {
    const origin = req.headers.origin;
    // An explicitly supplied foreign/null origin must never fall through to the fallback.
    if (origin !== undefined)
      return typeof origin === "string" && allowedOrigins.has(origin);
    const site = req.headers["sec-fetch-site"];
    if (site !== undefined && site !== "same-origin") return false;
    if (!req.headers.host || !allowedHosts.has(req.headers.host.toLowerCase()))
      return false;
    try {
      // WebSocket browsers send Origin; keep that path strict. Old LAN browsers may
      // omit Fetch Metadata as well as Origin on same-origin HTTP polling requests.
      return (
        new URL(req.url ?? "", "http://handshake.invalid").searchParams.get(
          "transport",
        ) === "polling"
      );
    } catch {
      return false;
    }
  };
}
