# Accepted MVP specification

Approved by the owner on 20 November 2026: original Parcel Parliament game; in-memory rooms cleared on restart; host controls on the shared screen, with separate host remote deferred. Additional instruction: phones **and** other PCs must join; sleek UI; fast, simple play. Source destination: `JordonRH/Boxgames`; Docker and CI/CD required.

## Product boundary

Boxgame is an anonymous browser party platform for 3–8 players and one shared host display. A host may join as a player using a separate phone/controller browser tab. No accounts, email, permanent profiles, native apps, uploads, chat, external analytics, third-party content calls, spectator tier, or public room directory.

Interface: ink background, lime accents, coral/violet project cards, large controls, reduced-motion support, keyboard focus, no required sound. React adapts from 360px controllers to desktop/TV. The server is authoritative. Built-in family-suitable English content is original; no copied rules/presentation/content from commercial games.

## Journeys and permissions

- Visitor creates a room anonymously, or enters a code/scans a public join link and chooses a name.
- Names normalize whitespace and Unicode, contain 1–20 visible graphemes, reject reserved/control/bidirectional-formatting names, and handle duplicates with an explicit suggestion.
- Host approves joining requests, which expire in 60 seconds; maximum 16 pending. Players join only before a game. Eight admitted seats maximum.
- Host starts with at least three connected players, pauses/resumes active input, advances instructions/results, ends early, removes players, locks admissions, or closes the room.
- Players submit allocation/forecast and spotlight vote from their own phone, tablet, or computer. Submission is final only on server acknowledgement.
- Same-tab reconnect restores an existing identity and acknowledged action; knowing the code/name does not reclaim a seat.
- Host token and player tokens are separate random 256-bit credentials. Server stores SHA-256 hashes; browser session storage holds its own token, never a URL.

## Screens

Home/create and quick join; code/name admission screen; pending/waiting screen; host lobby with QR/code/roster/admissions/settings; controller lobby; rules screen; shared scenario/aggregate progress; private allocation/forecast; private spotlight vote; submitted state; round results with transparent scoring; final shared-tie standings/rematch; pause/reconnect/expiry/error states; plain-language privacy page.

## State and cleanup

Room: lobby → instructions → playing → results → final → lobby/rematch → closed. Input stages can pause. Host controls remain bound to its credential; no automatic authority transfer.

Player seats are reserved five minutes. Detected host disconnect pauses active input and grants a five-minute return window. Fewer than three connected participants pauses input. Explicit pause remains after reconnect. Missing actions abstain; no invented submissions. A removal invalidates the credential, removes unfinished actions, and anonymizes completed-round participation. Completed scores remain.

Empty rooms expire after two minutes; inactive lobby/final rooms after 30 minutes; every room after four hours. A client receives the expiry time and a warning near expiry. Closing/expiry/restart deletes room state. Completed round submission data is cleared after review. No gameplay database or backup.

## Parcel Parliament

Each of six rounds uses a non-repeated scenario with three fictional civic projects. All players allocate exactly six integer crates between projects and forecast a private assigned rank: largest/middle/smallest combined crate total. Assignments are balanced at game start and rotate each round. Allocation + forecast are one atomic private submission. A later private vote chooses one spotlight project, without revealing allocations. Reveal shows allocations, forecasts, votes, totals and scores.

Default timing: 45-second allocation, 20-second vote; relaxed: 90/40; untimed: complete on all submissions. Host controls the results review. All-in submissions can finish a stage early.

Correct rank forecast: 3 points. Allocating two or more crates to any spotlight vote winner: 2 points total. Equal crate totals occupy all tied rank positions; equal spotlight votes create joint winners. No votes means no spotlight bonus. Missing allocation receives no forecast or allocation bonus. No speed bonus or elimination. Highest six-round total wins; ties are shared. Ending early counts only completed rounds.

18 original scenario sets ship. Example: Rain Check funds Puddle Post, Dry-Seat Carousel, or Cloud Exchange. No external factual/trivia source or adult content pack is needed.

## Architecture, data, events

Single Node LTS process, Express static assets, Socket.IO, React/TypeScript/Vite, runtime schemas, local QR generation. Docker Compose production runtime and a separate deployment updater. Independent pure game rules/scoring; room manager owns identity, projections, timers, authorization and lifecycle. No Redis, database, native apps, or cross-instance state.

Room fields: UUID/code, host hash/socket lease, created/activity/expiry, lock, members, pending requests, game, phase deadline/frozen duration, revision, bounded command receipts. Player: UUID/name/hash/socket/lease. Game: ID/phase ID, round/deck, private inputs, scores, reveal projection.

Commands: room create/join/resume/leave/close; host admit/deny/remove/lock/settings; game start/submit/vote/pause/resume/advance/end. Authorized snapshots contain only host/public or own-private fields. Reconnect always resynchronizes from a full authorized snapshot. Mutations validate game/phase IDs and actor authority; command IDs deduplicate retries. Scores are never client-supplied. Timers use server deadlines; clients render their countdown locally.

Codes: six cryptographically generated characters from `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`; approximately 887 million possibilities. Active uniqueness check/reservation, twenty collision retries, 30-minute released-code quarantine. Old credentials never authorize a reused code.

## Security and non-functional requirements

Exact allowed origins, 8 KiB event limit, schema validation, plain-text names, CSP, no embedding, no third-party scripts/fonts, no room discovery. Limits bound connections, pending requests, rooms and request windows. Production proxy identity is opt-in and trusts only exact configured peers. Network identity normalizes IPv4 and IPv6 /64.

Defaults: create 5 rooms/10 minutes/network and 5 owned rooms; joins 30/minute/network and 20/minute/room; authenticated resumes 120/minute/network; per-socket bounded events; 100 connections/network; 1,000 global connections; 100 rooms; 8 players. Anonymous bans are not permanent identity enforcement: approval and lock are practical controls.

Core flows use keyboard operation, focus indicators, 44px targets, text status labels, no color-only decisions or sound dependency, configurable/untimed stages, and useful disconnected/stale/locked/full/expired errors. WCAG 2.2 AA is the usability target and still requires real-browser review.

Capacity target: 100 rooms / 900 game connections. Shared Linux host has four reported CPUs and ~16 GiB RAM; app container limited to 2 CPUs/1 GiB, with other workloads present. Small JSON, no media. Initial bandwidth estimate was 25 Mbps; the fast-round synthetic test measured ~32 Mbps, so provision **50 Mbps upload** for headroom at the full internet-play target. Validate command latency, memory, event-loop lag, and a 30-minute soak; never claim unlimited or measured public capacity from synthetic results alone.

## Deployment and recovery

Host `boxgame.jrhtechservices.party`; origin `http://127.0.0.1:8100` for a host-native connector. Containerized connector needs operator-selected reachable origin. All tunnel/routes and all sudo commands are operator-only. LAN mode explicitly binds a reachable LAN address and sets its matching public origin; QR always encodes the configured reachable address.

Non-root read-only game container, capability drop, resource/PID/log bounds, health/readiness version+revision. CI on GitHub-hosted workers: test/audit/build/container smoke. Main-branch releases feed a local Docker updater over public HTTPS without stored GitHub credentials. Checksum/archive allowlist, current-main verification, health/revision check, rollback; no PR jobs on the Linux box. Updater Docker access is an administrative trust boundary. Back up source/content/releases, not transient player data. No tunnel or credential inspection needed.

## Acceptance and remaining risks

Automated gates: complete six-round flow; all tie scoring combinations; idempotent reveal/commands; private-view and cross-room isolation; forged role/origin rejection; deadlines/expiry/reconnect/pause; production type/build/audit; hardened Docker health and expected revision; CI publication and local deployment observed.

Device gates: a phone plus another PC join using reachable origin/QR; 360px and 1080p presentation; keyboard/screen reader/zoom; refresh/background reconnect; content clarity/fun in a group playtest. These cannot be replaced by a Socket.IO test or static compilation.

Risks: gameplay balance/fun needs playtesting; public anonymity permits repeated admission requests; bad proxy identity reduces capacity; host/power/redeploy interrupts play; mixed workloads reduce performance; Docker updater and repository writers control deployment. MVP excludes crash persistence, separate remote host controls, spectators, additional games, localization, and horizontal scaling. Add those only after the first game is proven.
