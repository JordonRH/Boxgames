# Verification record

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

## Measured final-engine sample — 20 November 2026

100 rooms / 900 connections, repeatedly playing games for 122 seconds: 28,172 commands, **zero failures**, 6 ms p95 acknowledgement, 22 ms p95 event-loop delay. Combined server-and-client process peaked at 286 MiB RSS / 135 MiB heap. Outbound projected payload averaged 32.12 Mbps under deliberately fast rounds, so the full internet target now budgets 50 Mbps upload. This is a local synthetic result, not a measurement through the public hostname or under container resource limits.

The earlier transport baseline also completed a **1,803-second soak** at 100 rooms / 900 connections: 402,542 commands, **zero failures**, 12 ms p95 acknowledgement, 22 ms p95 event-loop delay, 353 MiB combined peak RSS / 168 MiB heap, and 32.09 Mbps average projected payload. That process started before the final engine adapter and dependency upgrade; the 122-second sample above checks those final changes. Neither result certifies real-phone behavior or the public edge.

All 11 rule/integration/plugin/deployment tests passed; production TypeScript/Vite build passed; production dependency audit reported zero vulnerabilities. GitHub CI also independently passed test/build/audit and Docker smoke verification for the initial application commit.

The initial release (`4177f20`) was then published by CI, downloaded and verified by the Linux updater, and observed running with the expected revision. A separate production-image smoke check fetched all three built assets, checked security headers and unknown-asset handling, and played a three-controller round with private views and five-point scoring. That smoke check is included in subsequent CI runs. This is protocol/asset verification, not a rendered-browser test.

## Release checks

Current check outcomes, commit and deployment status are reported with the delivered release. Use GitHub Actions for continuing CI results. For an actual deployed revision, read only the game's known non-secret health endpoint and container status metadata; do not dump environment or infrastructure logs.
