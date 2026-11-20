# Linux deployment handoff

## Public entry point — operator only

| Setting                              | Required value                                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Hostname                             | `boxgame.jrhtechservices.party`                                                                     |
| Game host binding                    | `127.0.0.1:8100`                                                                                    |
| Origin for a host-native connector   | `http://127.0.0.1:8100`                                                                             |
| Origin for a containerized connector | Operator-selected reachable service address; container `localhost` does not refer to the Linux host |
| Protocol support                     | HTTP and Socket.IO WebSocket upgrade; polling fallback allowed                                      |
| Cache                                | No caching of `/socket.io`, `/api`, or HTML; hashed `/assets/` may be cached                        |
| Application public origin            | `https://boxgame.jrhtechservices.party`                                                             |

No tunnel, DNS, route, reverse-proxy, or certificate configuration has been inspected or modified. The operator must configure that boundary. Do not publish the Docker API. Public access requires HTTPS; private Wi-Fi play can use the explicit LAN profile described in README.

If the existing connector cannot reach loopback, the operator can choose an explicitly shared Docker network and service origin, or a restricted LAN binding. Confirm reachability before routing. Do not expose port 8100 to the internet as a substitute for HTTPS.

Proxy identity controls must trust only the actual immediate upstream peer; do not use an unrestricted proxy trust setting. The app understands `CF-Connecting-IP` only when explicitly enabled for exact allowlisted peer addresses. Until that is configured, public traffic shares a proxy network quota. Basic admission, actor limits, and global ceilings still apply.

## Deployment flow

1. Push to `main`, or merge a reviewed PR.
2. GitHub-hosted CI tests, audits, builds, and container-smoke-tests the commit.
3. A narrowly scoped publish job uses its temporary Actions token to create that commit's public release. No permanent deployment secret is configured.
4. The Linux updater polls main and downloads only its matching release over HTTPS.
5. Checksum and archive allowlist checks run before extraction/execution.
6. The script checks main again, loads the image, updates only Compose project `boxgame`, and verifies the revision and health.
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
BOXGAME_IMAGE=boxgame:<previous-commit-sha> docker compose up -d --no-build
```

Verify health before restarting the updater. It will attempt the current main release again. Use a reviewed revert commit to restore previous source behavior permanently.

Docker restart policies restore both services after daemon/host restart. No cron job or host system service is required. Update the updater image periodically using `docker compose -f compose.updater.yml up -d --build`; application releases do not silently replace the deployment agent itself.

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
