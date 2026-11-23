# Linux deployment handoff

## Public entry point — operator only

| Setting                                         | Required value                                                               |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| Hostname                                        | `boxgame.jrhtechservices.party`                                              |
| Game host binding                               | `127.0.0.1:8100`                                                             |
| Origin for a host-native connector              | `http://127.0.0.1:8100`                                                      |
| Origin for the existing containerized connector | **`http://boxgame:3000`**, on shared Docker network `aitrace_proxy`          |
| Protocol support                                | HTTP and Socket.IO WebSocket upgrade; polling fallback allowed               |
| Cache                                           | No caching of `/socket.io`, `/api`, or HTML; hashed `/assets/` may be cached |
| Application public origin                       | `https://boxgame.jrhtechservices.party`                                      |

No tunnel, DNS, route, reverse-proxy, or certificate configuration has been inspected or modified. The operator must configure that boundary. Do not publish the Docker API. Public access requires HTTPS; private Wi-Fi play can use the explicit LAN profile described in README.

Hearth & Spoon, Cadence, and the dashboard are attached to `aitrace_proxy`. Boxgame now joins that same network with alias `boxgame`; its application listens on container port `3000`. The host-local address in the other apps' READMEs is not evidence of the origin configured in their public routes. A diagnostic client on the shared network can reach `http://boxgame:3000`; the operator should use that service address for this containerized deployment. Do not expose port 8100 to the internet as a substitute for HTTPS.

Proxy identity controls must trust only the actual immediate upstream peer; do not use an unrestricted proxy trust setting. The app understands `CF-Connecting-IP` only when explicitly enabled for exact allowlisted peer addresses. Until that is configured, public traffic shares a proxy network quota. Basic admission, actor limits, and global ceilings still apply.

## Deployment flow

1. Push to `main`, or merge a reviewed PR.
2. GitHub-hosted CI tests, audits, builds, and container-smoke-tests the commit.
3. A narrowly scoped publish job uses its temporary Actions token to create that commit's public release. No permanent deployment secret is configured.
4. The Linux updater polls main and downloads only its matching release over HTTPS.
5. Checksum and archive allowlist checks run before extraction/execution.
6. The script checks main again, loads the image, runs the bundled JRH compliance preflight against the release Compose definition and live controller selector, then updates only Compose project `boxgame` and verifies the revision and health. A failed gate stops before cutover. CI also validates both authoritative Compose definitions before packaging.
7. Failed startup restores the previous image and verifies its health. The agent retries after five minutes; an operator must intervene if rollback also fails.

The first deployment has no previous image unless you ran the local image first. A healthy old image is kept for rollback; there is no gameplay-state rollback.

The updater is a privileged **Docker client**, because access to the Docker socket grants host administration capability. It does not need a privileged container flag. Keep it dedicated to this repository. Game runtime is non-root, read-only, capability-free, with a 1 GiB memory limit, two-CPU limit, and bounded PIDs/logs. The updater has its own 512 MiB limit and no game-state access through application APIs.

## Recovery and maintenance

Inspect container **metadata** and the app's known non-secret health endpoint:

```bash
docker ps --filter name=boxgame --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
curl -fsS http://127.0.0.1:8100/api/health
```

To stop automated rollouts while investigating:

```bash
docker compose -f compose.updater.yml stop updater
```

List previous app image tags with `docker image ls boxgame`. To restore a selected existing image, substitute its actual SHA:

```bash
python3 scripts/jrh-compliance.py preflight --approved-config --selector all --compose compose.yml
BOXGAME_IMAGE=boxgame:<previous-commit-sha> docker compose up -d --no-build
```

Verify health before restarting the updater. It will attempt the current main release again. Use a reviewed revert commit to restore previous source behavior permanently.

Docker restart policies restore both services after daemon/host restart. No cron job or host system service is required. Update the updater image periodically after `python3 scripts/jrh-compliance.py preflight --approved-config --selector all --compose compose.updater.yml`, using `docker compose -f compose.updater.yml up -d --build`; application releases do not silently replace the deployment agent itself.

Never read real `.env`, tunnel configuration, container environment, credential files, or secret-bearing logs without the workspace's explicit three-confirmation process. No such source is needed for normal Boxgame deployment.

## Backups

Preserve the Git repository and release references. Runtime rooms are intentionally ephemeral. The updater-state volume is reconstructable from public releases and can be omitted from backups; recreating it checks/deploys current main. Do not back up anonymous gameplay or add credentials to the release bundle.

## Release checklist

- CI test, build, audit, and Docker smoke checks pass.
- Container health reports the expected commit SHA.
- Host creates a room through the public hostname.
- A real phone and a separate PC join via code/QR, receive only their private views, and finish a round.
- Reconnect and host pause are checked on actual browsers.
- Public edge/QR/proxy identity checks are operator deployment checks, not inferred from local container health.

## Health and recovery policy

Both production Compose definitions persist `restart: unless-stopped` and `autoheal: "true"`. The app health check calls its own `http://127.0.0.1:3000/api/health` every 15 seconds (3-second timeout, 15-second startup grace, 3 retries). It never depends on the public route. The shared `docker-autoheal` controller performs unhealthy-container recovery; no per-app controller, boot script or new Docker socket mount is added. A deliberate manual stop remains stopped.

The existing updater is the only Boxgame Docker socket consumer. Its local check verifies `/state/heartbeat` was touched within twenty minutes, every sixty seconds with ninety seconds startup grace and two retries. The loop touches it before each poll; the grace accommodates bounded release downloads (one retry, five minutes per attempt), health verification and the five-minute failed-deployment backoff. It checks loop progress, not GitHub reachability. Python 3 and PyYAML are included in the updater image for the bundled preflight. Update this updater image before publishing releases that include `scripts/jrh-compliance.py`; its archive allowlist explicitly permits that file.

The pre-existing compliance checker and deployment-script gate were preserved and packaged into the CI release. The release path is enforced through the updater; raw Docker/Compose commands are still capable of bypassing a script-level gate. Do not claim daemon-wide enforcement. The canonical checker is `../ops-compliance/jrh_compliance.py`; keep the bundled copy synchronized.

Persistent storage: only the existing `updater-state` volume mounted at `/state`; it contains public releases and revision markers. No game database, personal profiles or durable answer history exists. Room state, pending pairing codes, screen credentials and scores are held in process memory and disappear on room expiry or restart. Pass-one-phone play lives only in its browser tab. See the backup procedure above; there is no gameplay data to restore.

The existing dashboard entry stays at `https://boxgame.jrhtechservices.party`; no dashboard, tunnel or route modification is required by the menu/display changes. TV/PC receiver URL: `https://boxgame.jrhtechservices.party/screen`. Fullscreen and optional native casting remain subject to the receiving browser’s capabilities and user permission.

## Capacity configuration

`MAX_PLAYERS_PER_ROOM=0` removes a separate room cap; positive values enforce an optional per-room maximum. The server-wide `MAX_CONNECTIONS` remains capped at 1,000 and includes hosts/displays. `CONNECTIONS_PER_NETWORK` defaults to 1,000 for new deployments so a shared Wi-Fi connection can fill a large room. Existing operator environment values remain in force; a lower network setting must be reviewed explicitly before a larger event. Configuration changes require recreation through the gated release path. No real environment file is inspected or modified by this change. Fifty controllers are tested, not 1,000; benchmark the actual host/network before larger events.

## Bundled map and ephemeral artwork routes

`/maps/land.json` is a locally bundled public-domain map asset, delivered by the same web entry service. `/api/art/<room-code>/<random-art-id>.svg` serves a sketch only during the drawing game's voting/reveal phases, after submission; it does not write files or mount storage. Gallery art IDs are random and carry no author name before reveal. SVG is generated from validated numeric strokes and a fixed palette, with `Cache-Control: private, max-age=60`. Public access uses the existing hostname/origin; no additional port, route, service or tunnel is required. Ordinary application logging still records no names, answers, sketch bodies, gallery URLs or session credentials.
