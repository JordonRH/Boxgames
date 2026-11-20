# Boxgame

**Good company. Questionable decisions.**

An original, self-hosted party-game platform for one shared screen and everyone's phone, tablet, laptop, or desktop browser. Create a room, share its six-character code or QR link, approve your friends, and play. No accounts, downloads, external game APIs, analytics, or sound required.

Production hostname: **https://boxgame.jrhtechservices.party**.

## Pick a game

| Game                          | Your whole move                                                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Blank Slate** · 3–8 players | Tap one of five cards to fill a silly blank. The rotating judge taps their favourite. Winner gets 1 point.                                                            |
| **Clue Crew** · 2–8 players   | The guesser sees only a category. Friends read the word on their own phones and give spoken clues. One 60-second turn per player, or alternate teams toward a target. |
| **Crowd Pick** · 3–8 players  | Read three odd community projects and tap one favourite. The most popular choice wins its voters 1 point. Five rounds.                                                |

| **Blackout Run** · 2–8 players | Tap a trivia answer, then a repair answer. Keep your charge through six rounds; everyone stays in. |
| **False Front** · 2–8 players | Invent a fake word meaning, then spot the truth in a private two-choice duel. Five rounds. |

### Start playing

1. Create a room and share its code or QR link.
2. Friends join on phones, tablets, or PCs; the host approves them.
3. Choose a game, press **Start**, then start the first round after the short rules.
4. Game controls appear on player devices. One tap plays a card or chooses a project; there is no extra submit step for tap-based choices. False Front has one short written bluff and a Lock in button.

**Hosting from your phone? Tap “Play on this device” in the lobby first.** That gives the host a player seat and private controls on the same device. Hosting on a TV? Leave it as the shared display and join on your own phone. A host who is also playing keeps host controls; their reconnect credential restores both roles.

Clue Crew uses large manual buttons on every device, including PCs. Motion sensors and tilt gestures are not required. The shared screen never shows the live word, so the guesser cannot read it from the TV. The phone can face outward, and friends can mark guesses from their own phones.

Blank Slate has 64 original prompts and 240 original response cards; Clue Crew has 240 categorised words/actions; Crowd Pick has 30 original scenario sets. Blackout Run has 72 independently written questions (24 each at Casual, Medium and Hard) across six subjects and 120 multi-step repair puzzles. False Front has 24 odd-word entries with independently phrased definitions. Content used or reserved for a game is tracked for that room. Rematches use fresh items; the host can explicitly reset used content when a pack runs out. Factual source links appear after each reveal. No commercial card packs, game names, art, or branded word decks are included. Repository references and reuse decisions: [research notes](docs/research.md). Quick player instructions: [game guide](docs/game-guide.md).

## A longer game night

- Choose **Casual**, **Mixed**, or **Hard** for Blackout Run in the lobby. Mixed ramps from three medium to three hard questions; other modes use their selected level throughout. Only trivia difficulty changes; repair puzzles keep their own challenge level.
- Pick **Two teams** for Clue Crew with 4–8 players. Assign at least two people per team and choose a 10/15/20-point target. Teams alternate with rotating guessers; a lead after equal turns wins once a team reaches the target. After six turns each, highest score wins or a tie is shared. Solo remains available.
- **Play again · same settings** on the final screen keeps room codes, seats, names, timing and game options. The short rules appear before the host begins. **Choose another game** returns to the same lobby.
- Enable **Keep a session scoreboard** before playing to add completed-game points across the room. Each new game's own scores start at zero. Totals use raw points, not a ranking normalised across games or teams; Clue Crew credits individual points to each turn's guesser. Reset session scores separately in the lobby.
- Blank Slate players get **one five-card hand refresh per game**, before playing a card on a non-judging turn. It remains used after reconnecting.
- Waiting banners name the players whose move is due, without sharing their choices. Trivia reveals repeat the original questions and explain points/battery changes. Bluff reveals show authors, voters, truth points and bluff points.
- Trivia feedback is one flag per seat per round, during reveal only. The room sees aggregate counts; nothing is uploaded to analytics or saved as a permanent report. Flags expire with the current game/room.

No automatic reshuffle introduces repeats into a room. When fresh content is insufficient, the previous game and scores stay intact and the host can return to the lobby to **Reset used content · allow repeats**. Questions, prompts, terms and project sets are reserved for the whole game, including unplayed rounds; response cards are marked when dealt. A full hand-refresh allowance is budgeted before a card game starts, so it may need a reset while some unused cards remain. If the clue-word deck runs out during play, the last completed guesses are scored and the game ends with an explanation. New rooms start fresh, so different rooms can repeat content.

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
- A disconnected player's seat lasts five minutes. The selected game needs two or three connected participants; a named judge or guesser must also be connected.
- Host disconnect pauses input. Host has five minutes to return; host privileges never transfer automatically.
- Closing the tab or changing devices does not transfer a seat. Request a new seat in the lobby instead.
- **A process restart or deployment deletes every room.** Restart persistence is deliberately outside MVP scope.

## Privacy and operations

Player names, choices, scores, optional session totals, used-content history, temporary question-feedback reports, and credential hashes are in memory only. Round submissions disappear after review; room names/scores disappear on closure or expiry. Short-lived network identities serve abuse limits only. Application logs exclude names, answers, codes, credentials, URLs, and headers. Public entry-point providers may independently process connection metadata.

There is no game-state database or backup. Back up source, original content, release references, and deployment instructions. Health: `/api/health` reports only status/version/revision. Logs rotate at three 10 MiB files per container. Avoid inspecting existing environment files, container configuration, credentials, or raw infrastructure logs.

## Architecture and future games

React + TypeScript + Express + Socket.IO. One authoritative Node process. `server/rooms` owns identity, admissions, timers, reconnects, and authorization. `server/games/parcel.ts` contains rules/scoring without transport or UI dependencies. `shared` defines authorized views and event types. Host and player projections are built separately; private state is not broadcast and hidden with CSS.

Target: up to 100 rooms / 900 host-and-player connections, pending deployment-specific validation. Hard ceilings are configurable downwards. No horizontal replicas: a second process would have a separate room registry.

The synthetic fast-round sample measured about 32 Mbps outbound payload at that target; budget **50 Mbps upload** for internet headroom. Default abuse quotas allow five owned rooms per network identity, so a large event behind one shared NAT needs an explicit quota adjustment. The load harness gives each room its own synthetic network identity; it does not imply those quotas disappear in production.

The accepted product specification and remaining risks are in [docs/specification.md](docs/specification.md).
