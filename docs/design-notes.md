# Game library and shared-screen redesign

Reference: https://party.hinds.group/ (public HTML, JavaScript and CSS inspected 23 November 2026). Its compact host/player flow, rounded colourful cards and direct joining instructions informed the structure. Boxgame keeps its own ink/lime/coral/violet palette, typography, illustration compositions, wording and original rules/content. No reference code or assets were incorporated, and no licence for copying its games was assumed.

## Setup modes

The five network games all support a PC or phone host and phone/PC controllers. The menu groups them by the setup the group chooses, rather than suggesting that a phone is incapable of hosting them. Shared screen keeps the creator out of the player roster until they choose to play. Host on phone selects a game and automatically adds the host's player seat. Pass one phone launches Pocket Circuit locally with no room, code or network game state.

## Display boundary

A separate display role authenticates using a one-use code valid for two minutes. Its resumable credential is stored in the receiver tab, while the server stores only its hash. At most two displays pair per room; disconnect leases last five minutes. The screen is excluded from player counts, input completion and required-player disconnect pauses. Closing the room removes pairing data and credentials. Host revocation disconnects all displays and invalidates pending codes.

The server creates a display projection with `private: null`, no player ID and no pending admission list. The receiver renders a dedicated public stage and never reads a host/player session. Authorization denies host controls and all game submissions from display sockets. Public rendering contains no controller actions. Existing game engines remain independent from transport and UI.

A browser on a TV/PC can open `/screen`, enter the host's separate screen code and request fullscreen with its own user gesture. The host cannot remotely bypass browser fullscreen permissions. The optional native Presentation API picker is progressive enhancement; it is not universally available. A registered custom Google Cast receiver is outside this release. Desktop Chrome may cast the public display tab using its own browser command. Never mirror private host/controller tabs.

Primary documentation: [PresentationRequest](https://developer.mozilla.org/en-US/docs/Web/API/PresentationRequest), [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API), [Google Cast receiver registration](https://developers.google.com/cast/docs/registration), [Chrome tab casting](https://support.google.com/chromecast/answer/3228332).

## Acceptance evidence

- DOM controls select the chosen online game and correct host mode; local play requires a handoff before revealing each timed task.
- Real Socket.IO tests cover each online game with an independently authenticated display, null private state, denied actions, reconnection and revocation.
- Lifecycle tests cover two-minute expiry, one-time use, replacement, room isolation, room closure, five-minute reconnect expiry, two-screen cap and join rate limiting.
- Public-stage rendering ignores even injected private clue state and has no game control buttons.
- Deployment tests verify failed preflight stops cutover and failed readiness restores the previous image.
- Candidate production smoke covers all five games, host participation, four controllers, paired screen, rematches, session totals, teams and polling/WebSockets.
- Build and production dependency audit pass. DOM checks do not prove a rendered mobile/TV layout. Physical TV fullscreen/native picker/casting and a real phone visual check remain device acceptance work; no connected browser was available to automate those checks.

The connection ceiling includes displays. Eighty full rooms with eight players, a separate host and two screens use 880 of the 900 connection ceiling. This is a planning target for 2 CPU / 2 GiB Linux hardware, not a new measured capacity claim. Existing deployment-specific network quotas may lower it. Game state remains memory-only and is lost on deployment/restart; no gameplay backup is introduced.
