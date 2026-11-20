import { test } from "node:test";
import assert from "node:assert/strict";
import { CardsGame } from "../server/games/cards.js";
import { CharadesGame } from "../server/games/charades.js";
import { CrowdGame } from "../server/games/crowd.js";
const players = [
  { id: "alice", name: "Alice" },
  { id: "bob", name: "Bob" },
  { id: "charlie", name: "Charlie" },
];
test("Blank Slate keeps hands private, shuffles anonymous plays, restricts judging, and scores once", () => {
  const game = new CardsGame(players);
  game.advance();
  assert.equal(game.publicView().cards!.options.length, 0);
  assert.equal(game.privateView("alice")!.cards!.isJudge, true);
  assert.equal(game.privateView(), null);
  const bobCard = game.privateView("bob")!.cards!.hand[0],
    charlieCard = game.privateView("charlie")!.cards!.hand[0];
  assert.throws(() => game.submit("bob", "submit", { cardId: charlieCard.id }));
  game.submit("bob", "submit", { cardId: bobCard.id });
  assert.equal(game.privateView("bob")!.cards!.hand.length, 5);
  assert.equal(game.privateView("bob")!.submitted, true);
  assert.equal(game.publicView().cards!.options.length, 0);
  assert.throws(() => game.submit("bob", "submit", { cardId: bobCard.id }));
  game.submit("charlie", "submit", { cardId: charlieCard.id });
  assert.ok(game.complete(false));
  assert.equal(game.phase, "vote");
  const options = game.publicView().cards!.options;
  assert.equal(options.length, 2);
  assert.ok(options.every((c) => !("authorId" in c)));
  assert.throws(() => game.submit("bob", "vote", { cardId: bobCard.id }));
  game.submit("alice", "vote", { cardId: bobCard.id });
  assert.ok(game.complete(false));
  assert.equal(game.score("bob"), 1);
  assert.equal(game.publicView().cards!.winnerId, "bob");
  assert.equal(game.complete(true), false);
  assert.equal(game.score("bob"), 1);
  game.advance();
  assert.equal(game.publicView().cards!.judgeId, "bob");
  assert.equal(game.publicView().cards!.options.length, 0);
});
test("card timeouts, judge removal and an early end do not invent winners", () => {
  const game = new CardsGame(players);
  game.advance();
  assert.ok(game.complete(true));
  assert.equal(game.phase, "reveal");
  assert.equal(game.publicView().cards!.winnerId, null);
  game.advance();
  game.remove("bob");
  assert.equal(game.requiredPlayers()[0], "charlie");
  assert.equal(game.hasPlayer("bob"), false);
  game.end();
  assert.ok(players.every((p) => game.score(p.id) === 0));
});
test("Clue Crew waits for the guesser, keeps words off the shared screen, deduplicates each word and banks completed turns", () => {
  const game = new CharadesGame(players);
  game.advance();
  assert.equal(game.duration(45), null);
  assert.throws(() => game.submit("bob", "submit", { action: "ready" }));
  game.submit("alice", "submit", { action: "ready" });
  assert.ok(game.complete(false));
  assert.equal(game.duration(45), 60000);
  const own = game.privateView("alice")!.charades!,
    other = game.privateView("bob")!.charades!;
  assert.equal(own.word, null);
  assert.ok(other.word);
  assert.equal(other.wordId, own.wordId);
  assert.ok(game.publicView().charades!.category);
  assert.throws(
    () =>
      game.submit("alice", "submit", { action: "correct", wordId: own.wordId }),
    /clue-giver/,
  );
  assert.equal(game.privateView(), null);
  assert.equal("word" in game.publicView().charades!, false);
  assert.equal(game.publicView().charades!.history.length, 0);
  game.submit("bob", "submit", { action: "correct", wordId: other.wordId });
  assert.throws(() =>
    game.submit("charlie", "submit", {
      action: "correct",
      wordId: other.wordId,
    }),
  );
  assert.equal(game.publicView().charades!.correct, 1);
  assert.equal(game.score("alice"), 0);
  game.submit("charlie", "submit", {
    action: "pass",
    wordId: game.privateView("charlie")!.charades!.wordId,
  });
  game.complete(true);
  assert.equal(game.score("alice"), 1);
  assert.equal(game.publicView().charades!.history.length, 2);
  assert.equal(game.complete(true), false);
  game.advance();
  assert.equal(game.publicView().charades!.guesserId, "bob");
  game.submit("bob", "submit", { action: "ready" });
  game.complete(false);
  game.submit("alice", "submit", {
    action: "correct",
    wordId: game.privateView("alice")!.charades!.wordId,
  });
  game.end();
  assert.equal(game.score("bob"), 0);
});
test("removing the active guesser safely skips to review and the next available player", () => {
  const game = new CharadesGame(players);
  game.advance();
  game.remove("alice");
  assert.equal(game.phase, "reveal");
  game.advance();
  assert.equal(game.publicView().charades!.guesserId, "bob");
});
test("Crowd Pick is one tap, respects abstentions and ties, and does not reveal live totals", () => {
  const game = new CrowdGame(players);
  game.advance();
  game.submit("alice", "submit", { project: 0 });
  assert.deepEqual(game.publicView().crowd!.totals, [0, 0, 0]);
  assert.equal(game.privateView("bob")!.crowd!.choice, null);
  assert.throws(() => game.submit("alice", "submit", { project: 2 }));
  game.submit("bob", "submit", { project: 1 });
  game.complete(true);
  assert.deepEqual(game.publicView().crowd!.winners, [0, 1]);
  assert.equal(game.score("alice"), 1);
  assert.equal(game.score("bob"), 1);
  assert.equal(game.score("charlie"), 0);
  assert.equal(game.complete(true), false);
  game.advance();
  assert.equal(game.privateView("alice")!.submitted, false);
});
