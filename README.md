# Boxgame

**Good company. Questionable decisions.**

An original, self-hosted party-game platform for one shared screen and everyone's phone, tablet, laptop, or desktop browser. Create a room, share its six-character code or QR link, approve your friends, and play. No accounts, downloads, external game APIs, analytics, or sound required.

Production hostname: **https://boxgame.jrhtechservices.party**.

## Pick a game

The new eight are shown first. **More games · the original five** opens the earlier collection without removing it.

| Game               | Players | Your move                                                                                                       |
| ------------------ | ------- | --------------------------------------------------------------------------------------------------------------- |
| **Time Tangle**    | 2+      | Estimate the year. Six real events, with points for near misses.                                                |
| **World Wander**   | 2+      | Pin a city on an unlabelled world map. Six locations, scored by distance.                                       |
| **Road Trip**      | 2+      | Find Australian towns and cities. Six stops, scored by distance.                                                |
| **Creature Check** | 2+      | Mark six names real or invented, then submit the whole set. Three sets.                                         |
| **Odd Canvas**     | 3+      | Draw a movie, game, sport, original creature or everyday scene. Vote anonymously; no self-votes. Three prompts. |
| **Rare Find**      | 3+      | Type a valid answer that fewer people in the room choose. Six categories.                                       |
| **Mic Check**      | 2+      | Guess music artists or acts from two progressively clearer written clues. Six acts.                             |
| **Echo Box**       | 2+      | Match an original four-note pattern by listening or watching. Six patterns.                                     |
| **Blank Slate**    | 3+      | Play a private response card; a rotating judge picks a favourite.                                               |
| **Clue Crew**      | 2+      | One guesses from spoken clues; teammates see the word privately.                                                |
| **Crowd Pick**     | 3+      | Vote for a favourite odd proposal. Five rounds.                                                                 |
| **Blackout Run**   | 2+      | Answer trivia and repair puzzles; six rounds plus a battery bonus.                                              |
| **False Front**    | 2+      | Write a fake definition and find the real one in a private duel. Five rounds.                                   |

All online games support phone and PC controllers and the dedicated TV/PC browser display. The original identity, wording, content and scoring are Boxgame's. The reference repository was read only; no code, assets or game packs were copied from it.

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
- Pick **Two teams** for Clue Crew with 4+ players. Assign at least two people per team and choose a 10/15/20-point target. Teams alternate with rotating guessers; a lead after equal turns wins once a team reaches the target. After six turns each, highest score wins or a tie is shared. Solo remains available for groups of up to eight. Larger groups use teams automatically.
- **Play again · same settings** on the final screen keeps room codes, seats, names, timing and game options. The short rules appear before the host begins. **Choose another game** returns to the same lobby.
- Enable **Keep a session scoreboard** before playing to add completed-game points across the room. Each new game's own scores start at zero. Totals use raw points, not a ranking normalised across games or teams; Clue Crew credits individual points to each turn's guesser. Reset session scores separately in the lobby.
- Blank Slate players get **one five-card hand refresh per game**, before playing a card on a non-judging turn. It remains used after reconnecting.
- Waiting banners name the players whose move is due, without sharing their choices. Trivia reveals repeat the original questions and explain points/battery changes. Bluff reveals show authors, voters, truth points and bluff points.
- Trivia feedback is one flag per seat per round, during reveal only. The room sees aggregate counts; nothing is uploaded to analytics or saved as a permanent report. Flags expire with the current game/room.

Apart from the documented large-card response recycling, no automatic reshuffle introduces repeats into a room. When fresh content is insufficient, the previous game and scores stay intact and the host can return to the lobby to **Reset used content · allow repeats**. Questions, prompts, terms and project sets are reserved for the whole game, including unplayed rounds; response cards are marked when dealt. A full hand-refresh allowance is budgeted before a card game starts, so it may need a reset while some unused cards remain. If the clue-word deck runs out during play, the last completed guesses are scored and the game ends with an explanation. New rooms start fresh, so different rooms can repeat content.

## Run with Docker

Requires Docker Engine and Docker Compose v2. No database or game credentials are needed.

This server already has the shared `aitrace_proxy` Docker network used by the other public apps. Boxgame joins it with the DNS alias `boxgame`. On a fresh machine, create that external network first (`docker network create aitrace_proxy`), or set `PROXY_NETWORK` to your existing proxy network.

```bash
python3 scripts/jrh-compliance.py preflight --approved-config --selector all --compose compose.yml
docker compose up -d --build
curl -fsS http://127.0.0.1:8100/api/health
```

If your shell needs to activate the existing Docker group, use `sg docker -c 'docker compose up -d --build'`. Do not run the container as privileged or mount the Docker socket into the **game** container.

Defaults bind the game to **127.0.0.1:8100**, with the public hostname as its join origin. You can review it on the server at `http://localhost:8100`; both loopback browser origins are explicitly allowed. The public entry point must forward HTTP and WebSocket traffic to that origin. Until routing is configured, other devices cannot reach this loopback binding directly.

For the existing containerized connector, set the route's service to **HTTP `boxgame:3000`**, reachable on `aitrace_proxy`. The host-local `127.0.0.1:8100` address is for a connector running on the host network; a container's loopback refers to that container.

The operator performs every tunnel/route action and every `sudo` command. Hostname and origin handoff: [deployment guide](docs/deployment.md). No tunnel is created or managed by this project.

### Local Wi-Fi play

Find the Linux machine's LAN address with `hostname -I`, choosing its Wi-Fi/Ethernet address that phones can reach, not a Docker address. The production Compose port is fixed to localhost for JRH policy; `BIND_ADDRESS` and `HOST_PORT` no longer override it. For an isolated LAN deployment, prepare and review a separate explicit port binding and set `PUBLIC_ORIGIN` to that reachable address. Do not change this production bind to make a TV connect: use the public URL on both devices.

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

Planning target: 80 eight-player rooms (880 connections with separate hosts and two displays each) on a 2-core, 2 GiB Linux host, pending deployment-specific load validation. All hosts, players and displays count against a hard server-wide ceiling of 1,000 connections (configurable downwards); network/proxy quotas can reduce capacity. A 50-controller room is covered by automated integration tests; this is not a 1,000-player benchmark. No horizontal replicas: a second process would have a separate room registry.

The synthetic fast-round sample measured about 32 Mbps outbound payload at that target; budget **50 Mbps upload** for internet headroom. Default abuse quotas allow five owned rooms per network identity, so a large event behind one shared NAT needs an explicit quota adjustment. The load harness gives each room its own synthetic network identity; it does not imply those quotas disappear in production.

The accepted product specification and remaining risks are in [docs/specification.md](docs/specification.md).

## Choose your setup

- **Shared screen:** create a room from a PC, laptop or phone; each player uses their own phone or PC. A paired TV/PC shows only the public game.
- **Host on phone:** the host gets a player seat automatically. Friends join with the room code. A separate display is optional.
- **Pass one phone:** Pocket Circuit runs locally in the browser. Three to twelve people take turns answering original spoken challenges. Two turns each, twenty seconds per turn, two points for three accepted answers. The group judges; ties share the win. Refreshing or leaving loses this local game. Nothing from it is sent to the game server.

### Put the game on a TV or PC

1. In your room, choose **Connect a screen** below the host controls.
2. On the TV/PC browser open **https://boxgame.jrhtechservices.party/screen**.
3. Enter the separate screen pairing code within two minutes. It works once. Players use the normal room code, not this pairing code.
4. Tap **Enter fullscreen** on the receiving browser if it did not enter fullscreen when connecting. Browser permissions require a local tap; the host cannot force this remotely.

The paired screen shows the lobby, public questions, submission counts, reveal results and scores. It receives no private card hand, bluff choices or live guessing word, and has no host/player powers. Two screens may connect per room; disconnects can resume for five minutes. **Disconnect shared screens** revokes both screen credentials immediately. A screen disconnect never pauses a round. Screen credentials stay in that tab’s session storage and are separate from host/player credentials.

**Cast / choose screen** uses the browser’s optional Presentation API when available. Browser support and receivers vary. The reliable path for a TV with a browser is the pairing flow above. For a Chromecast-capable TV, open the public shared-screen tab in desktop Chrome and use Chrome’s Cast tab command. Cast that tab only: casting the host/controller tab can expose your own private information. No registered Google Cast receiver or universal device discovery is bundled. See [Chrome casting guidance](https://support.google.com/chromecast/answer/3228332) and [Presentation API compatibility](https://developer.mozilla.org/en-US/docs/Web/API/PresentationRequest).

Both devices need access to the configured public URL. Being on the same Wi-Fi does not require exposing another server port. Direct LAN-only deployments require an explicitly reviewed LAN bind and `PUBLIC_ORIGIN` set to the reachable LAN address; the JRH production Compose file intentionally binds diagnostics only to localhost.

## Larger groups

There is no game-level eight-player limit. `MAX_PLAYERS_PER_ROOM=0` (default) removes a separate room cap; a positive value sets an optional operator cap. Pending requests reserve capacity when a cap is configured. All rooms still share the server's finite `MAX_CONNECTIONS` ceiling (default and supported maximum 1,000), and `CONNECTIONS_PER_NETWORK` may impose a lower network budget. Hosts and paired displays count too. These are resource safeguards, not a promise that this machine can sustain 1,000 people in one game.

The lobby has **Let everyone in** for bulk approval. Per-network join/resume/action quotas scale with the server budget; room creation and per-socket limits remain bounded. Public room state is built once per broadcast and each controller gets only its own private overlay. Large broadcasts still grow with room size; 50 real Socket.IO controllers on one simulated network have been tested across every online game. Measure CPU, memory, latency and bandwidth before using substantially larger audiences.

Above eight players, **Blank Slate** uses six rounds with randomly ordered rotating judges, rather than one round per attendee. A hand still contains five different private cards; one refresh gives five different replacements. Response texts may repeat between players or across large games, while fresh prompt history remains room-scoped. Judging gets at least four seconds per submitted card (or the host can choose untimed play). The TV cycles through six plays every eight seconds; the judge sees all plays on their controller.

Above eight, **Clue Crew** uses two teams automatically, with at least two members per team and at most six turns per team. Only the active guesser's teammates get the secret word. Blackout Run, False Front and Crowd Pick keep their existing fixed round counts and accept the whole room. Phone and PC controllers use the same rules; the larger-room support also works when the host is on a phone. Pocket Circuit remains a deliberately local 3–12-person pass-one-phone game.

## Drawing, music and map details

Choose Odd Canvas's category in the lobby: **Mixed, Movies, Video games & board games, Sport, Original creatures, Everyday chaos**. Prompts are original writing; named film/game subjects are drawn by players. No film stills, character art, commercial music clips or artist portraits are bundled. Mic Check uses independently written factual clues and source links to artists’ official sites. Echo Box synthesises its own notes in the browser; **Watch without sound** provides pitch playback without audio. Browsers require a local user gesture for sound, so the receiving screen has a Play button.

Sketches are bounded to 30 strokes and 400 quantised points, submitted only when the player taps Submit. The server holds them in game memory. During voting, participants receive anonymous gallery IDs and fetch validated SVG sketches from the same server. Artists and vote totals appear only at reveal. The SVG endpoint refuses unrevealed, missing or removed art, never embeds player-provided markup, and uses a one-minute private browser cache. Closing/restarting the room removes server state; already revealed art may remain cached briefly on a player’s device.

Maps are bundled locally from public-domain Natural Earth data; there are no tile-server calls. Tap, keyboard arrow movement, zoom/pan buttons and coordinate fields are available. The starter packs contain 23 world cities, 26 Australian towns/cities, 16 year questions, 12 music artists/acts, 48 real/invented creature names, 40 drawing prompts across five categories, 12 rarity categories and 64 original sound patterns. Room-scoped fresh-content checks apply; use Reset used content deliberately when a pack is exhausted.

Tests cover complete games/scoring, all input modes, draw/vote privacy, invalid/oversized submissions, artist second chances, no self-votes, authenticated display projections and production asset routes. Desktop/phone/TV rendering and actual audio/casting hardware still need device acceptance; DOM and protocol tests are not visual or hardware tests.
