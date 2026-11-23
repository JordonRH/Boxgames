import { test } from "node:test";
import assert from "node:assert/strict";
import { ArcadeGame, arcadeKinds, kmBetween } from "../server/games/arcade.js";
import { renderInk } from "../server/games/render-ink.js";
import { defaultSettings } from "../shared/settings.js";
const players = [
  { id: "a", name: "Alex" },
  { id: "b", name: "Blair" },
  { id: "c", name: "Casey" },
];
const ink = (color: number) => [
  {
    color,
    points: [
      [10, 10],
      [100, 100],
      [180, 40],
    ] as [number, number][],
  },
];
for (const [key, kind] of Object.entries(arcadeKinds))
  test(`${key}: complete game, private answers, timeouts, validation, bounded scoring and reveal-only results`, () => {
    const game = new ArcadeGame(players, key);
    assert.equal(game.publicView().arcade!.reveal, null);
    game.advance();
    for (let round = 1; round <= game.rounds; round++) {
      const card = (game as any).card;
      const payload = (id: string): any =>
        kind === "year"
          ? { year: card.year }
          : kind === "world" || kind === "australia"
            ? { lat: card.lat, lon: card.lon }
            : kind === "rapid"
              ? { checks: card.claims.map((c: any) => c.real) }
              : kind === "drawing"
                ? { strokes: ink(id === "a" ? 0 : 1) }
                : kind === "artist"
                  ? { text: id === "a" ? card.name : "Wrong person" }
                  : kind === "rare"
                    ? { text: card.answers[id === "a" ? 0 : 1] }
                    : { choiceId: (game as any).soundAnswer };
      assert.throws(() => game.submit("outsider", "submit", payload("a")));
      assert.throws(() => game.submit("a", "submit", { unexpected: true }));
      assert.equal(game.privateView("outsider"), null);
      assert.equal(game.privateView()?.arcade, undefined);
      game.submit("a", "submit", payload("a"));
      assert.throws(() => game.submit("a", "submit", payload("a")));
      game.submit("b", "submit", payload("b"));
      assert.equal(
        game.complete(false),
        false,
        "must wait for the third participant",
      );
      assert.equal(game.publicView().arcade!.reveal, null);
      if (kind === "drawing")
        assert.deepEqual(game.publicView().arcade!.gallery, []);
      if (kind === "artist")
        assert.ok(!JSON.stringify(game.publicView()).includes('"aliases"'));
      assert.equal(game.complete(true), true);
      if (kind === "drawing") {
        const gallery = game.publicView().arcade!.gallery!;
        assert.equal(gallery.length, 2);
        assert.ok(gallery.every((g) => !g.authorId && !g.strokes));
        const own = (game as any).gallery.find((g: any) => g.authorId === "a");
        assert.throws(() => game.submit("a", "vote", { choiceId: own.id }));
        const other = game.privateView("a")!.arcade!.choices![0];
        game.submit("a", "vote", { choiceId: other });
        assert.throws(() => game.submit("a", "vote", { choiceId: other }));
        assert.ok(game.artwork(other));
        assert.equal(game.artwork("not-an-image"), null);
        game.complete(true);
        assert.equal(
          game.publicView().arcade!.reveal!.rows.find((r) => r.id === "b")!
            .points,
          2,
        );
      } else if (kind === "artist") {
        assert.equal(game.phase, "vote");
        assert.equal(game.privateView("a")!.arcade!.canAnswer, false);
        assert.throws(() => game.submit("a", "vote", { text: card.name }));
        game.submit("b", "vote", { text: card.name });
        game.complete(true);
        assert.deepEqual(
          game.publicView().arcade!.reveal!.rows.map((r) => r.points),
          [10, 5, 0],
        );
      }
      assert.equal(game.phase, "reveal");
      const revealed = game.publicView().arcade!.reveal!;
      assert.equal(revealed.rows.length, 3);
      assert.equal(revealed.rows.find((r) => r.id === "c")!.points, 0);
      if (kind === "world" || kind === "australia")
        assert.equal(revealed.rows[0].distance, 0);
      if (
        kind === "year" ||
        kind === "world" ||
        kind === "australia" ||
        kind === "rare"
      )
        assert.equal(revealed.rows[0].points, 12);
      if (kind === "sound") assert.equal(revealed.rows[0].points, 10);
      if (kind === "rapid") assert.equal(revealed.rows[0].points, 15);
      const before = game.score("a");
      assert.equal(game.complete(true), false);
      assert.equal(game.score("a"), before);
      game.advance();
    }
    assert.equal(game.final, true);
    assert.equal(game.advance(), "lobby");
  });

test("arcade map distances wrap the dateline and clamp floating-point error", () => {
  assert.ok(kmBetween(0, 179, 0, -179) < 225);
  assert.ok(Math.abs(kmBetween(0, 0, 0, 180) - 20015) < 10);
  assert.equal(kmBetween(-33, 151, -33, 151), 0);
});
test("drawing validation rejects unbounded or executable data; artwork never exists before voting", () => {
  const game = new ArcadeGame(players, "odd-canvas");
  game.advance();
  for (const payload of [
    { strokes: [] },
    { strokes: [{ color: 99, points: [[0, 0]] }] },
    { strokes: [{ color: 0, points: Array(401).fill([0, 0]) }] },
    { strokes: [{ color: 0, points: [["<script>", 0]] }] },
    { strokes: ink(0), authorId: "b" },
  ])
    assert.throws(() => game.submit("a", "submit", payload));
  game.submit("a", "submit", { strokes: ink(0) });
  assert.equal(game.artwork("anything"), null);
  const svg = renderInk(ink(0));
  assert.match(svg, /<svg/);
  assert.ok(!svg.includes("script"));
});
test("drawing categories filter prompts, large rooms work and early end never banks unfinished input", () => {
  for (const drawingCategory of [
    "movies",
    "games",
    "sports",
    "creatures",
    "everyday",
  ] as const) {
    const game = new ArcadeGame(players, "odd-canvas", {
      settings: { ...defaultSettings(), drawingCategory },
    });
    game.advance();
    assert.equal(game.publicView().arcade!.category, drawingCategory);
  }
  const group = Array.from({ length: 50 }, (_, i) => ({
    id: `p${i}`,
    name: `P${i}`,
  }));
  for (const key of Object.keys(arcadeKinds)) {
    const game = new ArcadeGame(group, key);
    game.advance();
    game.end();
    assert.equal(game.final, true);
    assert.ok(group.every((p) => game.score(p.id) === 0));
  }
});
