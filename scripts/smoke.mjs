// Disposable production-image check. Outputs only aggregate checks and public revision.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { io } from "socket.io-client";

const base = process.argv[2] ?? "http://127.0.0.1:8100";
const origin = process.argv[3] ?? "http://localhost:8100";
const expected = process.argv[4];
const strategy = process.argv[5] ?? "mixed";
if (!["mixed", "websocket"].includes(strategy))
  throw new Error("Use mixed or websocket transport mode.");
const sockets = [],
  states = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check) {
  for (let i = 0; i < 300; i++) {
    if (check()) return;
    await sleep(10);
  }
  throw new Error("Expected smoke-test state did not arrive");
}
async function command(s, event, payload) {
  return new Promise((resolve, reject) =>
    s.timeout(4000).emit(event, payload, (err, ack) => {
      if (err || !ack?.ok) reject(new Error(`${event} failed in smoke test`));
      else resolve(ack.data);
    }),
  );
}
async function connect() {
  // Alternate normal browser polling (no Origin on same-origin GET) and WebSockets.
  const polling = strategy === "mixed" && sockets.length % 2 === 0;
  const s = io(base, {
    forceNew: true,
    reconnection: false,
    transports: polling ? ["polling"] : ["websocket"],
    upgrade: false,
    extraHeaders: polling
      ? { "Sec-Fetch-Site": "same-origin" }
      : { Origin: origin },
  });
  sockets.push(s);
  s.on("room:state", (v) => states.set(s, v));
  await new Promise((resolve, reject) => {
    s.once("connect", resolve);
    s.once("connect_error", () =>
      reject(
        new Error(
          `Smoke-test ${polling ? "polling" : "WebSocket"} handshake was refused`,
        ),
      ),
    );
  });
  return s;
}
const envelope = (s) => ({
  commandId: randomUUID(),
  gameId: states.get(s).game.id,
  phaseId: states.get(s).game.phaseId,
});
let host;
try {
  const health = await fetch(`${base}/api/health?check=${Date.now()}`, {
    cache: "no-store",
  });
  assert.ok(health.ok);
  const info = await health.json();
  if (expected) assert.equal(info.revision, expected);
  const screenPage = await fetch(`${base}/screen`);
  assert.ok(screenPage.ok, "Shared-screen route must load");
  assert.ok(
    (await fetch(`${base}/maps/land.json`)).ok,
    "Bundled map must load",
  );
  const page = await fetch(base);
  assert.ok(page.ok);
  assert.match(
    page.headers.get("content-security-policy") ?? "",
    /frame-ancestors 'none'/,
  );
  const html = await page.text();
  assert.match(html, /<title>Boxgame/);
  const assets = [...html.matchAll(/(?:src|href)="(\/[^\"]+)"/g)].map(
    (m) => m[1],
  );
  assert.ok(assets.length >= 2);
  for (const asset of assets)
    assert.ok((await fetch(`${base}${asset}`)).ok, "A built asset was missing");
  assert.equal((await fetch(`${base}/assets/missing-file.js`)).status, 404);
  assert.ok((await fetch(`${base}/privacy`)).ok);
  host = await connect();
  const session = await command(host, "room:create", {});
  assert.deepEqual(
    states
      .get(host)
      .games.map((g) => g.id)
      .sort(),
    [
      "blackout-run",
      "blank-slate",
      "clue-crew",
      "crowd-pick",
      "false-front",
      "time-tangle",
      "world-wander",
      "road-trip",
      "creature-check",
      "odd-canvas",
      "rare-find",
      "mic-check",
      "echo-box",
    ].sort(),
  );
  assert.equal(states.get(host).playerLimit, null);
  const pair = await command(host, "host:screen", {});
  const display = await connect();
  await command(display, "display:join", { code: pair.code });
  assert.equal(states.get(display).role, "display");
  assert.equal(states.get(display).private, null);
  await command(host, "host:play", { name: "Smoke host" });
  const hostId = states.get(host).playerId;
  assert.ok(hostId);
  const players = [];
  for (let i = 0; i < 3; i++) {
    const p = await connect();
    players.push(p);
    await command(p, "room:join", {
      code: session.code,
      name: `Smoke player ${i + 1}`,
    });
    await until(() => states.get(host).pending.length === 1);
    await command(host, "host:admit", { id: states.get(host).pending[0].id });
  }
  await sleep(1100);
  await command(host, "host:settings", { carryScores: true });
  const arcadeKeys = [
    "time-tangle",
    "world-wander",
    "road-trip",
    "creature-check",
    "odd-canvas",
    "rare-find",
    "mic-check",
    "echo-box",
  ];
  for (const gameKey of arcadeKeys) {
    await sleep(1100);
    if (gameKey === "odd-canvas")
      await command(host, "host:settings", { drawingCategory: "movies" });
    await command(host, "host:game", { gameKey });
    await command(host, "game:start", { commandId: randomUUID() });
    await command(host, "game:advance", envelope(host));
    const group = [host, ...players];
    await until(
      () =>
        group.every((p) => states.get(p)?.game?.phase === "allocate") &&
        states.get(display)?.game?.phase === "allocate",
    );
    assert.equal(states.get(display).private, null);
    assert.equal(states.get(display).game.arcade.reveal, null);
    for (const p of group) {
      const a = states.get(p).game.arcade;
      const payload =
        a.kind === "year"
          ? { year: 1990 }
          : a.kind === "world"
            ? { lat: 0, lon: 0 }
            : a.kind === "australia"
              ? { lat: -30, lon: 135 }
              : a.kind === "rapid"
                ? { checks: [true, false, true, false, true, false] }
                : a.kind === "drawing"
                  ? {
                      strokes: [
                        {
                          color: 0,
                          points: [
                            [10, 10],
                            [100, 100],
                            [190, 40],
                          ],
                        },
                      ],
                    }
                  : a.kind === "sound"
                    ? { choiceId: a.choices[0].id }
                    : { text: "An unlikely answer" };
      await command(p, "game:submit", { ...envelope(p), ...payload });
    }
    if (gameKey === "odd-canvas" || gameKey === "mic-check") {
      await until(
        () =>
          group.every((p) => states.get(p)?.game?.phase === "vote") &&
          states.get(display)?.game?.phase === "vote",
      );
      if (gameKey === "odd-canvas") {
        assert.equal(states.get(display).game.arcade.category, "movies");
        const gallery = states.get(display).game.arcade.gallery;
        assert.ok(gallery.every((g) => !g.authorId && !g.strokes));
        const art = await fetch(
          `${base}/api/art/${session.code}/${gallery[0].id}.svg`,
        );
        assert.ok(art.ok);
        assert.match(art.headers.get("content-type") ?? "", /image\/svg\+xml/);
      }
      for (const p of group)
        await command(p, "game:vote", {
          ...envelope(p),
          ...(gameKey === "odd-canvas"
            ? { choiceId: states.get(p).private.arcade.choices[0] }
            : { text: "Still unlikely" }),
        });
    }
    await until(() => states.get(display)?.game?.phase === "reveal");
    assert.equal(states.get(display).private, null);
    assert.equal(states.get(display).game.arcade.reveal.rows.length, 4);
    await sleep(1100);
    await command(host, "game:end", envelope(host));
    await command(host, "game:advance", envelope(host));
    await until(() => group.every((p) => states.get(p)?.game === null));
  }
  for (const gameKey of [
    "blank-slate",
    "crowd-pick",
    "clue-crew",
    "blackout-run",
    "false-front",
  ]) {
    await sleep(1100);
    await command(host, "host:game", { gameKey });
    await command(host, "game:start", { commandId: randomUUID() });
    await command(host, "game:advance", envelope(host));
    await until(() =>
      players.every((p) => states.get(p)?.game?.phase === "allocate"),
    );
    await until(() => states.get(display)?.game?.phase === "allocate");
    assert.equal(states.get(display).private, null);
    assert.equal(states.get(display).playerId, null);
    assert.equal(states.get(display).id, states.get(host).id);
    assert.equal(states.get(host).role, "host");
    assert.equal(states.get(host).playerId, hostId);
    if (gameKey === "blank-slate") {
      assert.equal(states.get(host).private.cards.isJudge, true);
      for (const p of players)
        await command(p, "game:submit", {
          ...envelope(p),
          cardId: states.get(p).private.cards.hand[0].id,
        });
      await until(() => states.get(host).game.phase === "vote");
      const options = states.get(host).game.cards.options;
      assert.ok(options.every((c) => !("authorId" in c)));
      await command(host, "game:vote", {
        ...envelope(host),
        cardId: options[0].id,
      });
      await until(() => states.get(host).game.phase === "reveal");
      assert.equal(
        states.get(host).players.reduce((n, p) => n + p.score, 0),
        1,
      );
    } else if (gameKey === "crowd-pick") {
      for (const p of [host, ...players])
        await command(p, "game:submit", { ...envelope(p), project: 0 });
      await until(() => states.get(host).game.phase === "reveal");
      assert.ok(states.get(host).players.every((p) => p.score === 1));
    } else if (gameKey === "blackout-run" || gameKey === "false-front") {
      const all = [host, ...players];
      for (const [i, p] of all.entries())
        await command(p, "game:submit", {
          ...envelope(p),
          ...(gameKey === "blackout-run"
            ? { optionId: states.get(p).game.survival.options[0].id }
            : { text: `A ceremonial sock basket number ${i}` }),
        });
      await until(() => all.every((p) => states.get(p).game.phase === "vote"));
      if (gameKey === "false-front") {
        assert.deepEqual(states.get(host).game.bluff.options, []);
        assert.equal(states.get(host).game.bluff.truth, null);
      } else assert.equal(states.get(host).game.survival.answers, null);
      for (const p of all) {
        const options =
          gameKey === "blackout-run"
            ? states.get(p).game.survival.options
            : states.get(p).private.bluff.options;
        assert.ok(options.every((o) => !("truth" in o) && !("authors" in o)));
        await command(p, "game:vote", {
          ...envelope(p),
          optionId: options[0].id,
        });
      }
      await until(() => states.get(host).game.phase === "reveal");
      assert.equal(
        (gameKey === "blackout-run"
          ? states.get(host).game.survival.rows
          : states.get(host).game.bluff.rows
        ).length,
        4,
      );
    } else {
      assert.equal(states.get(host).game.charades.guesserId, hostId);
      await command(host, "game:submit", {
        ...envelope(host),
        action: "ready",
      });
      await until(() =>
        players.every((p) => states.get(p).game.phase === "vote"),
      );
      assert.equal("word" in states.get(host).game.charades, false);
      assert.equal(states.get(host).private.charades.word, null);
      assert.ok(states.get(host).game.charades.category);
      assert.ok(states.get(players[0]).private.charades.word);
      const first = states.get(players[0]).private.charades.wordId;
      await command(players[0], "game:submit", {
        ...envelope(players[0]),
        action: "correct",
        wordId: first,
      });
      await until(
        () => states.get(players[1]).private.charades.wordId !== first,
      );
      await command(players[1], "game:submit", {
        ...envelope(players[1]),
        action: "correct",
        wordId: states.get(players[1]).private.charades.wordId,
      });
      await command(host, "game:advance", envelope(host));
      await until(() => states.get(host).game.phase === "reveal");
      assert.equal(
        states.get(host).players.find((p) => p.id === hostId).score,
        2,
      );
    }
    await sleep(1100);
    await command(host, "game:end", envelope(host));
    const oldGame = states.get(host).game.id;
    const previousTotals = states
      .get(host)
      .standings.map((p) => ({ id: p.id, points: p.points, games: p.games }));
    await command(host, "game:rematch", envelope(host));
    assert.notEqual(states.get(host).game.id, oldGame);
    assert.equal(states.get(host).game.phase, "instructions");
    assert.equal(states.get(host).playerId, hostId);
    assert.deepEqual(
      states
        .get(host)
        .standings.map((p) => ({ id: p.id, points: p.points, games: p.games })),
      previousTotals,
    );
    await sleep(1100);
    await command(host, "game:end", envelope(host));
    await command(host, "game:advance", envelope(host));
    await until(() => states.get(host).game === null);
  }
  // A complete two-team game: active helpers only, equal turns, then fresh replay.
  await sleep(1100);
  await command(host, "host:settings", { clueMode: "teams", teamTarget: 5 });
  await command(host, "game:start", {
    commandId: randomUUID(),
    gameKey: "clue-crew",
  });
  await command(host, "game:advance", envelope(host));
  await command(host, "game:submit", { ...envelope(host), action: "ready" });
  await until(() => players.every((p) => states.get(p).game.phase === "vote"));
  const helper = players[1],
    opponent = players[0];
  assert.ok(states.get(helper).private.charades.word);
  assert.equal(states.get(host).private.charades.word, null);
  assert.equal(states.get(opponent).private.charades.word, null);
  for (let i = 0; i < 5; i++)
    await command(helper, "game:submit", {
      ...envelope(helper),
      action: "correct",
      wordId: states.get(helper).private.charades.wordId,
    });
  await sleep(1100);
  await command(host, "game:advance", envelope(host));
  assert.equal(states.get(host).game.charades.outcome, null);
  await command(host, "game:advance", envelope(host));
  await until(() => states.get(opponent).game.phase === "allocate");
  await command(opponent, "game:submit", {
    ...envelope(opponent),
    action: "ready",
  });
  await until(() => states.get(host).game.phase === "vote");
  await command(host, "game:advance", envelope(host));
  assert.match(states.get(host).game.charades.outcome, /Team Lime wins/);
  assert.deepEqual(
    states.get(host).game.charades.teams.map((t) => t.turns),
    [1, 1],
  );
  await command(host, "game:advance", envelope(host));
  assert.equal(states.get(host).game.phase, "final");
  await command(host, "room:close", {});
  host = null;
  console.log(
    JSON.stringify({
      status: "pass",
      revision: info.revision,
      assets: assets.length,
      players: 4,
      games: [
        ...arcadeKeys,
        "blank-slate",
        "crowd-pick",
        "clue-crew",
        "blackout-run",
        "false-front",
      ],
      rematches: true,
      sessionScores: true,
      teams: true,
      hostPlayer: true,
      privateViews: true,
      sharedScreen: true,
      transports:
        strategy === "mixed" ? ["polling", "websocket"] : ["websocket"],
    }),
  );
} finally {
  if (host?.connected) await command(host, "room:close", {}).catch(() => {});
  sockets.forEach((s) => s.disconnect());
}
