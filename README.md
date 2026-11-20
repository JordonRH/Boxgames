# Boxgame

**Good company. Questionable decisions.**

An original, self-hosted party-game platform for one shared screen and everyone's phone, tablet, laptop, or desktop browser. Create a room, share its six-character code or QR link, approve your friends, and play. No accounts, downloads, external game APIs, analytics, or sound required.

Production hostname: **https://boxgame.jrhtechservices.party**.

## The first game: Parcel Parliament

Three wonderfully odd community projects need funding. Each player privately splits six crates, predicts which project will receive the largest, middle, or smallest combined pile, then votes for a spotlight project. A correct prediction earns three points. Putting at least two crates into a spotlight winner earns two points, at most once. Six rounds, shared ties, no speed bonuses.

Includes 18 original scenario sets. Rules, scoring, content, UI, and wording are independently written. The broad host-and-controller format is the only product inspiration; no commercial game content or assets are bundled.

## Run with Docker

Requires Docker Engine and Docker Compose v2. No database or game credentials are needed.

This server already has the shared `aitrace_proxy` Docker network used by the other public apps. Boxgame joins it with the DNS alias `boxgame`. On a fresh machine, create that external network first (`docker network create aitrace_proxy`), or set `PROXY_NETWORK` to your existing proxy network.

```bash
docker compose up -d --build
curl -fsS http://127.0.0.1:8100/api/health
```

If your shell needs to activate the existing Docker group, use `sg docker -c 'docker compose up -d --build'`. Do not run the container as privileged or mount the Docker socket into the **game** container.

Defaults bind the game to **127.0.0.1:8100**, with the public hostname as its join origin. You can review it on the server at `http://localhost:8100`; both loopback browser origins are explicitly allowed. The public entry point must forward HTTP and WebSocket traffic to that origin. Until routing is configured, other devices cannot reach this loopback binding directly.

For the existing containerized connector, set the route's service to **HTTP `boxgame:3000`**, reachable on `aitrace_proxy`. The host-local `127.0.0.1:8100` address is for a connector running on the host network; a container's loopback refers to that container.

The operator performs every tunnel/route action and every `sudo` command. Hostname and origin handoff: [deployment guide](docs/deployment.md). No tunnel is created or managed by this project.

### Local Wi-Fi play

Find the Linux machine's LAN address with `hostname -I`, choosing its Wi-Fi/Ethernet address that phones can reach, not a Docker address. For example:

```bash
PUBLIC_ORIGIN=http://192.168.1.50:8100 BIND_ADDRESS=192.168.1.50 docker compose up -d --build
```

Open `http://192.168.1.50:8100` on the host and phones/PCs on the same network. Replace that example address with yours. Guest Wi-Fi client isolation or a firewall may block local access. The host screen warns when its configured join address is localhost. Nothing depends on a phone-specific app or platform.

### Configuration

See `.env.example` for non-secret defaults. You may create your own ignored `.env`; never commit credentials or share its contents. Public and LAN origins must be configured explicitly. Extra allowed origins use a comma-separated `ALLOWED_ORIGINS` list. Join QR links always use `PUBLIC_ORIGIN`.

Forwarded network identity is ignored by default. Set `TRUST_CF_CONNECTING_IP=true` **and** list only the exact trusted immediate proxy addresses in `TRUSTED_PROXY_IPS` when the operator has verified that topology. Never trust arbitrary clients' forwarding headers. Without trusted proxy configuration, proxied users share a single rate-limit budget; the advertised multi-room capacity may therefore be lower.

## CI/CD

[GitHub Actions](https://github.com/JordonRH/Boxgames/actions) runs on PRs and pushes to `main`: install locked dependencies, audit production packages, run tests/type checks, build the UI/server, build Docker, and smoke-test the hardened container.

Successful `main` builds publish an immutable commit-tagged release containing the Docker image, deployment files, and SHA-256 checksum. The public repository allows downloads without deployment credentials. No self-hosted Actions runner is exposed to PR code.

Start the deployment agent once on your Linux host:

```bash
docker compose -f compose.updater.yml up -d --build
```

The agent checks `main` every minute, waits for that exact commit's verified release, validates the checksum and archive entries, loads the image, and starts the game. It verifies the running revision and health. Failed startup restores and checks the previous image. Superseded releases are skipped.

**The updater holds Docker socket access to deploy containers.** Restrict write access to this repository and the server accordingly. The game container has no socket access. GitHub releases are trusted through HTTPS and repository publishing permissions; the checksum checks download integrity, not independent author identity. Do not publish unrelated files under the updater's `boxgame-<SHA>` release tags.

Automatic deployments and restarts end current rooms. Pause automatic updates before a planned game night:

```bash
docker compose -f compose.updater.yml stop updater
# Resume later:
docker compose -f compose.updater.yml up -d
```

The updater has no personal access token, SSH key, or runner registration. Its small state volume stores only release markers and public release files. Old image tags remain available for rollback; periodically review `docker image ls boxgame` and remove only versions you no longer need. Do not prune unrelated applications.

## Development and checks

Node.js 24 LTS is the production runtime. Node 22 also works for local checks.

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`. Vite proxies real-time traffic to port 3000. For development from other devices, start with `PUBLIC_ORIGIN=http://<LAN-IP>:5173 npm run dev` and open that same address on each device.

```bash
npm test
npm run build
npm audit --omit=dev --audit-level=high
npm run test:load -- 10 30
# Full provisional capacity exercise:
npm run test:load -- 100 1800
```

Tests use disposable local rooms and generated credentials; they never target production. The load test runs simulated clients and server in one process, so its memory figure includes both. See [verification](docs/verification.md) for scope and limits.

## What survives a disconnect?

- Refresh/reconnect in the same browser tab restores your seat and acknowledged submission.
- The server stores only hashes of reconnect credentials. The tab stores its random pass in session storage, never in a QR or URL.
- A disconnected player's seat lasts five minutes. Three connected game participants are required to run an input stage.
- Host disconnect pauses input. Host has five minutes to return; host privileges never transfer automatically.
- Closing the tab or changing devices does not transfer a seat. Request a new seat in the lobby instead.
- **A process restart or deployment deletes every room.** Restart persistence is deliberately outside MVP scope.

## Privacy and operations

Player names, choices, scores, and credential hashes are in memory only. Round submissions disappear after review; room names/scores disappear on closure or expiry. Short-lived network identities serve abuse limits only. Application logs exclude names, answers, codes, credentials, URLs, and headers. Public entry-point providers may independently process connection metadata.

There is no game-state database or backup. Back up source, original content, release references, and deployment instructions. Health: `/api/health` reports only status/version/revision. Logs rotate at three 10 MiB files per container. Avoid inspecting existing environment files, container configuration, credentials, or raw infrastructure logs.

## Architecture and future games

React + TypeScript + Express + Socket.IO. One authoritative Node process. `server/rooms` owns identity, admissions, timers, reconnects, and authorization. `server/games/parcel.ts` contains rules/scoring without transport or UI dependencies. `shared` defines authorized views and event types. Host and player projections are built separately; private state is not broadcast and hidden with CSS.

Target: up to 100 rooms / 900 host-and-player connections, pending deployment-specific validation. Hard ceilings are configurable downwards. No horizontal replicas: a second process would have a separate room registry.

The synthetic fast-round sample measured about 32 Mbps outbound payload at that target; budget **50 Mbps upload** for internet headroom. Default abuse quotas allow five owned rooms per network identity, so a large event behind one shared NAT needs an explicit quota adjustment. The load harness gives each room its own synthetic network identity; it does not imply those quotas disappear in production.

The accepted product specification and remaining risks are in [docs/specification.md](docs/specification.md).
