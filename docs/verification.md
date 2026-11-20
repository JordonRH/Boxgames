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

## Release checks

Current check outcomes, commit and deployment status are reported with the delivered release. Use GitHub Actions for continuing CI results. For an actual deployed revision, read only the game's known non-secret health endpoint and container status metadata; do not dump environment or infrastructure logs.
