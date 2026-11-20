# Verification record

## Simpler games and phone controls

The current picker offers Blank Slate, Clue Crew and Crowd Pick. A host can explicitly join as a player on the same device; host credentials retain both roles across reconnects. The full-screen disconnected overlay was removed, while action buttons still respect connection/pause state and the connection notice remains visible.

Added rule checks for anonymous card judging, private hands, foreign-card/foreign-judge rejection, score idempotency, guesser readiness, per-word duplicate taps, completed-turn scoring, removal, one-tap crowd choices and ties. Real Socket.IO room tests cover all three games, selecting the game in the lobby, combined host/player permissions, host reconnect, and a disconnected active guesser. DOM tests actually click playable cards, ready, correct, pass and crowd-choice controls, including a host-player phone view.

The production-image smoke now plays a round of each of the three games with a host-player and three controllers across polling and WebSockets. DOM simulation is not a rendered mobile browser; real-device layout/motion feel is not certified, and no tilt feature is claimed.

All 22 tests passed, the production build passed, and the full dependency audit reported zero vulnerabilities. A built loopback candidate passed the three-game smoke with four controllers and the combined host/player role. The earlier 900-client soak figures below cover the original engine; they do not benchmark all three new game modes.

## Automated coverage

- Complete six-round game using real Socket.IO clients, separate rooms and generated disposable credentials.
- Private snapshots, duplicate command IDs, stale phase IDs, forged host commands, pause refusal and reconnect restoration.
- Host/player leases, server deadlines, paused deadlines, empty/idle room expiry with a fake clock.
- All rank tie combinations for project totals 0–6; spotlight ties, abstention, maximum bonus, idempotent reveal and rank rotation.
- Original content completeness, unique deck selection, code alphabet/active uniqueness/quarantine cleanup, network normalization and rate-bucket expiry.
- TypeScript, production frontend/server build, npm production advisory check, hardened container health.

The 100-room/900-client load exercise uses a disposable in-process server. Simulated clients and server share a process; combined RSS is not server-only memory. It exercises repeated full games and public/private projection fanout. Real TLS, a public edge, network loss, phones, and the container CPU/memory limits require separate verification.

## Browser limitation

No browser surfaces or in-app browser were available in the build session. No claim of visual screenshot, real-phone, screen-reader, QR camera, or public-hostname verification is made. The responsive interface is implemented and compiled; a real-device acceptance pass remains required after the operator connects the hostname.

## Browser room-creation regression

After the public route came online, room creation was unavailable in a normal browser. The initial polling GET was rejected with 403 because the handshake required an `Origin` header. Same-origin GET requests may omit it ([MDN Origin reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin)). The earlier WebSocket-only smoke test supplied Origin and missed this path.

The handshake now permits originless **polling only** on explicitly allowed hosts, rejects cross-site Fetch Metadata, and keeps explicit Origin checks strict. Plain-HTTP LAN clients without Fetch Metadata can also use same-host polling. Originless WebSocket handshakes remain rejected. Client connection failures now display a retry message.

Two new regression tests cover the header policy and real polling-based room creation (13 tests total). The production-image smoke test now alternates polling controllers without Origin and WebSocket controllers, and plays a round through both transports.

## Measured final-engine sample — 20 November 2026

100 rooms / 900 connections, repeatedly playing games for 122 seconds: 28,172 commands, **zero failures**, 6 ms p95 acknowledgement, 22 ms p95 event-loop delay. Combined server-and-client process peaked at 286 MiB RSS / 135 MiB heap. Outbound projected payload averaged 32.12 Mbps under deliberately fast rounds, so the full internet target now budgets 50 Mbps upload. This is a local synthetic result, not a measurement through the public hostname or under container resource limits.

The earlier transport baseline also completed a **1,803-second soak** at 100 rooms / 900 connections: 402,542 commands, **zero failures**, 12 ms p95 acknowledgement, 22 ms p95 event-loop delay, 353 MiB combined peak RSS / 168 MiB heap, and 32.09 Mbps average projected payload. That process started before the final engine adapter and dependency upgrade; the 122-second sample above checks those final changes. Neither result certifies real-phone behavior or the public edge.

All 11 rule/integration/plugin/deployment tests passed; production TypeScript/Vite build passed; production dependency audit reported zero vulnerabilities. GitHub CI also independently passed test/build/audit and Docker smoke verification for the initial application commit.

The initial release (`4177f20`) was then published by CI, downloaded and verified by the Linux updater, and observed running with the expected revision. A separate production-image smoke check fetched all three built assets, checked security headers and unknown-asset handling, and played a three-controller round with private views and five-point scoring. That smoke check is included in subsequent CI runs. This is protocol/asset verification, not a rendered-browser test.

## Release checks

Current check outcomes, commit and deployment status are reported with the delivered release. Use GitHub Actions for continuing CI results. For an actual deployed revision, read only the game's known non-secret health endpoint and container status metadata; do not dump environment or infrastructure logs.
