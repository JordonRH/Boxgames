import { test } from "node:test";
import assert from "node:assert/strict";
import { SurvivalGame } from "../server/games/survival.js";
import { BluffGame } from "../server/games/bluff.js";
import {
  oddWords,
  trivia,
  repairQuestion,
} from "../server/games/knowledge-content.js";
const players = [
  { id: "a", name: "Alex" },
  { id: "b", name: "Blair" },
  { id: "c", name: "Casey" },
];
function answer(g: SurvivalGame, id: string, correct: boolean) {
  const v = g.publicView().survival,
    q =
      trivia.find((x) => x.question === v.question) ??
      Array.from({ length: 20 }, (_, i) => repairQuestion(i)).find(
        (x) => x.question === v.question,
      )!;
  const o = v.options.find((o) => (o.text === q.answer) === correct)!;
  g.submit(id, g.phase === "allocate" ? "submit" : "vote", { optionId: o.id });
}
test("Blackout Run protects answers, banks completed rounds only, keeps backup players in, and awards final charge exactly once", () => {
  const g = new SurvivalGame(players);
  g.advance();
  assert.equal(g.publicView().survival.answers, null);
  assert.equal(g.privateView("a")!.survival!.atRisk, null);
  answer(g, "a", true);
  answer(g, "b", false);
  answer(g, "c", false);
  assert.throws(() => answer(g, "a", true), /locked in/);
  assert.throws(
    () =>
      g.submit("a", "vote", {
        optionId: g.publicView().survival.options[0].id,
      }),
    /finished/,
  );
  g.complete(false);
  assert.equal(g.score("a"), 0);
  assert.equal(g.privateView("b")!.survival!.atRisk, true);
  assert.equal(g.privateView("a")!.survival!.atRisk, false);
  answer(g, "a", true);
  answer(g, "b", true);
  answer(g, "c", false);
  g.complete(false);
  assert.deepEqual(
    players.map((p) => g.score(p.id)),
    [3, 1, 0],
  );
  assert.deepEqual(
    g.publicView().survival.charge.map((p) => p.charge),
    [3, 3, 2],
  );
  assert.equal(g.complete(true), false);
  for (let round = 2; round <= 6; round++) {
    g.advance();
    for (const p of players) answer(g, p.id, p.id === "a");
    g.complete(false);
    for (const p of players) answer(g, p.id, p.id === "a");
    g.complete(false);
  }
  assert.equal(g.publicView().survival.charge[2].charge, 0);
  assert.ok(g.hasPlayer("c"));
  assert.equal(g.score("a"), 18);
  g.advance();
  assert.equal(g.score("a"), 21);
  assert.equal(g.phase, "final");
  g.end();
  g.advance();
  assert.equal(g.score("a"), 21);
  assert.equal(g.privateView("a")!.survival!.choice, null);
});
test("Blackout Run timeouts abstain, invalid answers fail, removed players disappear, and early end discards incomplete scores", () => {
  const g = new SurvivalGame(players);
  g.advance();
  assert.throws(
    () => g.submit("a", "submit", { optionId: "bad" }),
    /four answers/,
  );
  assert.throws(() => g.submit("outsider", "submit", {}), /next game/);
  answer(g, "a", true);
  g.complete(true);
  answer(g, "a", true);
  g.end();
  assert.equal(g.score("a"), 0);
  const h = new SurvivalGame(players);
  h.advance();
  h.complete(true);
  h.remove("c");
  h.complete(true);
  assert.equal(h.publicView().survival.rows.length, 2);
  assert.deepEqual(
    h.publicView().survival.charge.map((p) => p.charge),
    [2, 2],
  );
});
function truth(g: BluffGame) {
  return oddWords.find((w) => w.term === g.publicView().bluff.term)!;
}
function prepare(
  g: BluffGame,
  texts = [
    "A ceremonial sock basket",
    "A chair reserved for a cat",
    "A tiny weatherproof spoon",
  ],
) {
  g.advance();
  players.forEach((p, i) => g.submit(p.id, "submit", { text: texts[i] }));
  g.complete(false);
}
test("False Front has private duels, no own bluff, hidden truth/ownership, correct scoring and locked votes", () => {
  const g = new BluffGame(players);
  prepare(g);
  assert.equal(g.publicView().bluff.truth, null);
  assert.equal(g.publicView().bluff.source, null);
  assert.deepEqual(g.publicView().bluff.options, []);
  for (const p of players) {
    const v = g.privateView(p.id)!.bluff!;
    assert.equal(v.options.length, 2);
    assert.ok(v.options.every((o) => o.text !== v.text));
    assert.ok(v.options.every((o) => !("truth" in o) && !("authors" in o)));
    const correct = v.options.find((o) => o.text === truth(g).truth)!;
    g.submit(p.id, "vote", { optionId: correct.id });
  }
  assert.throws(
    () =>
      g.submit("a", "vote", {
        optionId: g.privateView("a")!.bluff!.options[0].id,
      }),
    /locked in/,
  );
  g.complete(false);
  assert.ok(players.every((p) => g.score(p.id) === 2));
  assert.equal(g.publicView().bluff.truth, truth(g).truth);
  assert.equal(
    g.publicView().bluff.options.find((o) => o.truth)!.voters.length,
    3,
  );
  assert.equal(g.complete(true), false);
  g.advance();
  assert.equal(g.privateView("a")!.bluff!.text, null);
});
test("False Front merges duplicate bluffs, excludes every coauthor, credits shared authors and rejects forged choices", () => {
  const g = new BluffGame(players);
  prepare(g, [
    "A ceremonial sock basket!",
    "a ceremonial sock basket",
    "A tiny weatherproof spoon",
  ]);
  const a = g.privateView("a")!.bluff!,
    b = g.privateView("b")!.bluff!,
    c = g.privateView("c")!.bluff!;
  assert.ok(a.options.every((o) => !o.text.toLowerCase().includes("sock")));
  assert.ok(b.options.every((o) => !o.text.toLowerCase().includes("sock")));
  const sock = c.options.find((o) => o.text.toLowerCase().includes("sock"))!;
  assert.throws(
    () => g.submit("a", "vote", { optionId: sock.id }),
    /two meanings/,
  );
  g.submit("c", "vote", { optionId: sock.id });
  g.complete(true);
  assert.equal(g.score("a"), 1);
  assert.equal(g.score("b"), 1);
  assert.equal(g.score("c"), 0);
  const merged = g.publicView().bluff.options.find((o) => o.id === sock.id)!;
  assert.equal(merged.authors.length, 2);
  g.remove("a");
  assert.ok(
    g.publicView().bluff.options.every((o) => !o.authors.includes("a")),
  );
});
test("False Front validates typed text, uses house fallbacks, supports skips and discards incomplete votes on end", () => {
  const g = new BluffGame(players);
  g.advance();
  for (const text of [
    " ",
    "x".repeat(81),
    "abc\u200bdef",
    truth(g).truth,
    truth(g).aliases[0],
  ])
    assert.throws(() => g.submit("a", "submit", { text }));
  g.complete(true);
  assert.equal(g.privateView("a")!.bluff!.options.length, 2);
  const correct = g
    .privateView("a")!
    .bluff!.options.find((o) => o.text === truth(g).truth)!;
  g.submit("a", "vote", { optionId: correct.id });
  g.advance();
  assert.equal(g.publicView().bluff.skipped, true);
  assert.equal(g.score("a"), 0);
  assert.deepEqual(g.publicView().bluff.options, []);
  g.advance();
  g.complete(true);
  g.end();
  assert.equal(g.score("a"), 0);
  assert.equal(g.privateView("a")!.bluff!.options.length, 0);
});
test("content packs have enough unique rounds, distinct answers, verified source URLs and bounded definitions", () => {
  assert.ok(trivia.length >= 16 && oddWords.length >= 8);
  assert.equal(new Set(trivia.map((q) => q.question)).size, trivia.length);
  for (const q of trivia) assert.equal(new Set([q.answer, ...q.wrong]).size, 4);
  for (let i = 0; i < 20; i++) {
    const q = repairQuestion(i);
    assert.equal(new Set([q.answer, ...q.wrong]).size, 4);
  }
  for (const w of oddWords) {
    assert.ok(w.truth.length <= 80);
    assert.ok(w.source.startsWith("https://"));
    assert.notEqual(w.truth, w.decoy);
  }
});
test("False Front completes five distinct rounds, clears each private duel and never scores twice", () => {
  const g = new BluffGame(players),
    seen = new Set<string>();
  g.advance();
  for (let round = 1; round <= 5; round++) {
    const word = truth(g);
    assert.equal(seen.has(word.term), false);
    seen.add(word.term);
    g.complete(true);
    for (const p of players)
      g.submit(p.id, "vote", {
        optionId: g
          .privateView(p.id)!
          .bluff!.options.find((o) => o.text === word.truth)!.id,
      });
    g.complete(false);
    assert.equal(g.score("a"), round * 2);
    g.complete(true);
    assert.equal(g.score("a"), round * 2);
    g.advance();
    if (round < 5) assert.deepEqual(g.privateView("a")!.bluff!.options, []);
  }
  assert.equal(g.phase, "final");
  assert.equal(g.advance(), "lobby");
  assert.equal(g.score("a"), 10);
});

test("house fallback cannot repeat the player's own text when every player wrote the default house bluff", () => {
  const g = new BluffGame(players);
  g.advance();
  const text = truth(g).decoy;
  for (const p of players) g.submit(p.id, "submit", { text });
  g.complete(false);
  for (const p of players)
    assert.ok(
      g.privateView(p.id)!.bluff!.options.every((o) => o.text !== text),
    );
});
