import { test } from "node:test";
import assert from "node:assert/strict";
import { CardsGame } from "../server/games/cards.js";
import { CharadesGame } from "../server/games/charades.js";
import { SurvivalGame } from "../server/games/survival.js";
import { BluffGame } from "../server/games/bluff.js";
import { CrowdGame } from "../server/games/crowd.js";
import { defaultSettings } from "../shared/settings.js";
import { trivia, oddWords } from "../server/games/knowledge-content.js";
import { answers, prompts, clueCards } from "../server/games/party-content.js";
import { scenarios } from "../server/games/content.js";
const people = ["a", "b", "c", "d"].map((id) => ({
  id,
  name: id.toUpperCase(),
}));
const context = () => ({
  history: new Map<string, Set<string>>(),
  settings: defaultSettings(),
});
test("expanded packs have unique content, balanced difficulty coverage and enough full fresh games", () => {
  for (const [pool, key] of [
    [trivia, (q: any) => q.question],
    [oddWords, (w: any) => w.term],
    [clueCards, (w: any) => w.word],
    [answers, (s: any) => s],
    [prompts, (s: any) => s],
    [scenarios, (s: any) => s.id],
  ] as const)
    assert.equal(new Set(pool.map(key as any)).size, pool.length);
  assert.equal(trivia.length, 72);
  assert.equal(oddWords.length, 24);
  assert.equal(answers.length, 240);
  assert.equal(prompts.length, 64);
  assert.equal(clueCards.length, 240);
  assert.equal(scenarios.length, 30);
  for (const category of new Set(trivia.map((q) => q.category)))
    for (const difficulty of ["casual", "medium", "hard"])
      assert.equal(
        trivia.filter(
          (q) => q.category === category && q.difficulty === difficulty,
        ).length,
        4,
      );
});
test("every difficulty survives a complete game; trivia and other packs stay fresh across games", () => {
  for (const difficulty of ["casual", "mixed", "hard"] as const) {
    const c = context();
    c.settings.difficulty = difficulty;
    const seen = new Set<string>();
    for (let game = 0; game < 3; game++) {
      const g = new SurvivalGame(people, c);
      g.advance();
      for (let round = 1; round <= 6; round++) {
        const s = g.publicView().survival;
        assert.equal(
          s.difficulty,
          difficulty === "mixed"
            ? round <= 3
              ? "medium"
              : "hard"
            : difficulty,
        );
        assert.equal(seen.has(s.question), false);
        seen.add(s.question);
        g.complete(true);
        g.complete(true);
        g.advance();
      }
    }
  }
  const c = context();
  const words = new Set<string>();
  for (let i = 0; i < 4; i++) {
    const g = new BluffGame(people, c);
    g.advance();
    for (let r = 0; r < 5; r++) {
      const term = g.publicView().bluff.term;
      assert.equal(words.has(term), false);
      words.add(term);
      g.complete(true);
      g.complete(true);
      g.advance();
    }
  }
  assert.throws(() => new BluffGame(people, c), /fresh/);
  c.history.clear();
  assert.ok(new BluffGame(people, c));
  const d = context();
  const first = new CrowdGame(people, d).publicView().scenario.id;
  const next = new CrowdGame(people, d).publicView().scenario.id;
  assert.notEqual(first, next);
});
test("one hand refresh gives five new private cards and cannot be reused, stolen or used after submitting", () => {
  const c = context(),
    g = new CardsGame(people, c);
  g.advance();
  const before = g.privateView("b")!.cards!.hand;
  g.submit("b", "submit", { action: "refresh" });
  const after = g.privateView("b")!.cards!;
  assert.equal(after.hand.length, 5);
  assert.equal(after.refreshUsed, true);
  assert.ok(
    after.hand.every(
      (card) =>
        !before.some((old) => old.text === card.text || old.id === card.id),
    ),
  );
  assert.deepEqual(g.publicView().cards!.options, []);
  assert.throws(
    () => g.submit("b", "submit", { action: "refresh" }),
    /already used/,
  );
  assert.throws(
    () => g.submit("a", "submit", { action: "refresh" }),
    /before playing/,
  );
  g.submit("c", "submit", { cardId: g.privateView("c")!.cards!.hand[0].id });
  assert.throws(
    () => g.submit("c", "submit", { action: "refresh" }),
    /before playing/,
  );
  const h = new CardsGame(people, c);
  assert.equal(h.privateView("b")!.cards!.refreshUsed, false);
  assert.ok(
    h
      .privateView("b")!
      .cards!.hand.every(
        (card) => !after.hand.some((old) => old.text === card.text),
      ),
  );
});
function teamGame() {
  const c = context();
  c.settings.clueMode = "teams";
  c.settings.teamTarget = 5;
  return new CharadesGame(people, c);
}
function ready(g: CharadesGame) {
  g.submit(g.publicView().charades.guesserId, "submit", { action: "ready" });
  g.complete(false);
}
function points(g: CharadesGame, count: number) {
  for (let i = 0; i < count; i++) {
    const helper = people.find((p) => g.privateView(p.id)!.charades!.canMark)!;
    g.submit(helper.id, "submit", {
      action: "correct",
      wordId: g.privateView(helper.id)!.charades!.wordId,
    });
  }
  g.advance();
}
test("teams alternate, conceal words from guessers/opponents, reject opponent commands and wait for equal turns", () => {
  const g = teamGame();
  g.advance();
  ready(g);
  assert.equal(g.publicView().charades.activeTeam, 0);
  assert.equal(g.privateView("a")!.charades!.word, null);
  assert.equal(g.privateView("b")!.charades!.word, null);
  assert.equal(g.privateView("d")!.charades!.wordId, null);
  const helper = g.privateView("c")!.charades!;
  assert.ok(helper.word);
  assert.throws(
    () => g.submit("b", "submit", { action: "correct", wordId: helper.wordId }),
    /active team/,
  );
  assert.equal(
    g.connectionIssue(["a", "b", "c"]),
    "Waiting for two connected players on each team",
  );
  points(g, 5);
  assert.equal(g.publicView().charades.outcome, null);
  g.advance();
  assert.equal(g.publicView().charades.guesserId, "b");
  ready(g);
  points(g, 5);
  assert.equal(
    g.publicView().charades.outcome,
    null,
    "a tie at the target must continue",
  );
  g.advance();
  assert.equal(g.publicView().charades.guesserId, "c");
  ready(g);
  points(g, 1);
  g.advance();
  assert.equal(g.publicView().charades.guesserId, "d");
  ready(g);
  points(g, 0);
  assert.equal(g.publicView().charades.outcome, "Team Lime wins!");
  assert.deepEqual(
    g.publicView().charades.teams!.map((t) => t.turns),
    [2, 2],
  );
  g.advance();
  assert.equal(g.phase, "final");
});
test("teams have a bounded six-turn limit, zero-score tie, safe removal and fresh solo words", () => {
  const g = teamGame();
  g.advance();
  for (let i = 0; i < 12; i++) {
    ready(g);
    points(g, 0);
    g.advance();
  }
  assert.equal(g.phase, "final");
  assert.match(g.publicView().charades.outcome!, /tied/);
  const h = teamGame();
  h.advance();
  ready(h);
  points(h, 2);
  h.advance();
  ready(h);
  h.remove("d");
  assert.equal(h.phase, "final");
  assert.equal(h.publicView().charades.teams![0].score, 2);
  const c = context();
  const first = new CharadesGame(people, c);
  first.advance();
  ready(first);
  const word = first.privateView("b")!.charades!.word;
  const second = new CharadesGame(people, c);
  second.advance();
  ready(second);
  assert.notEqual(second.privateView("b")!.charades!.word, word);
});
test("question feedback is reveal-only, bounded to one per person per round, and does not affect points", () => {
  const g = new SurvivalGame(people);
  g.advance();
  assert.throws(() => g.feedback("a", "too_easy"), /reveal/);
  g.complete(true);
  g.complete(true);
  g.feedback("a", "ambiguous");
  assert.throws(() => g.feedback("a", "incorrect"), /saved/);
  assert.throws(() => g.feedback("b", "bogus"), /reason/);
  assert.throws(() => g.feedback("outsider", "too_hard"), /reveal/);
  assert.equal(g.privateView("a")!.survival!.feedback, "ambiguous");
  assert.equal(
    g.publicView().survival.feedback!.find((f) => f.reason === "ambiguous")!
      .count,
    1,
  );
  assert.equal(g.score("a"), 0);
  assert.ok(g.publicView().survival.answers?.quizQuestion);
  g.advance();
  assert.equal(g.privateView("a")!.survival!.feedback, null);
});

test("clue-word exhaustion finishes safely with the last correct guess scored; fresh-card shortage is explicit", () => {
  const c = context();
  c.history.set(
    "clue words",
    new Set(clueCards.slice(1).map((card) => card.word)),
  );
  const g = new CharadesGame(people, c);
  g.advance();
  ready(g);
  g.submit("b", "submit", {
    action: "correct",
    wordId: g.privateView("b")!.charades!.wordId,
  });
  assert.equal(g.phase, "final");
  assert.equal(g.score("a"), 1);
  assert.match(g.publicView().notice!, /All clue words/);
  const d = context();
  d.history.set("cards", new Set(answers.slice(10)));
  assert.throws(() => new CardsGame(people, d), /fresh response cards/);
});

test("removing a guesser from a larger team counts a skipped zero-point turn and preserves the equal-turn limit", () => {
  const six = [...people, { id: "e", name: "E" }, { id: "f", name: "F" }],
    c = context();
  c.settings.clueMode = "teams";
  const g = new CharadesGame(six, c);
  g.advance();
  g.remove("a");
  assert.equal(g.phase, "reveal");
  assert.deepEqual(
    g.publicView().charades.teams!.map((t) => t.turns),
    [1, 0],
  );
  g.advance();
  for (let i = 0; i < 11; i++) {
    ready(g);
    g.advance();
    g.advance();
  }
  assert.equal(g.phase, "final");
  assert.deepEqual(
    g.publicView().charades.teams!.map((t) => t.turns),
    [6, 6],
  );
});
