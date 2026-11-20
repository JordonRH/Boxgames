import { randomUUID } from "node:crypto";
import { z } from "zod";
import { GameError, type GameOptions } from "./core.js";
import { SimpleGame } from "./simple-base.js";
import { clueCards } from "./party-content.js";
import type { RoomView, Scenario } from "../../shared/types.js";
export class CharadesGame extends SimpleGame {
  private order: string[];
  private done = new Set<string>();
  private guesser: string;
  private guesserName: string;
  private deck = this.mixed(
    this.unused("clue words", clueCards, (c) => c.word),
  );
  private teams:
    { name: string; ids: string[]; score: number; turns: number }[] | null =
    null;
  private target = 15;
  private outcome: string | null = null;
  private word = "";
  private category: string | null = null;
  private wordId = randomUUID();
  private ready = false;
  private correct = 0;
  private passed = 0;
  private history: { word: string; correct: boolean }[] = [];
  constructor(
    players: { id: string; name: string }[],
    options: GameOptions = {},
  ) {
    super(players, players.length, options);
    this.order = players.map((p) => p.id);
    if (!this.deck.length)
      throw new GameError(
        "content_exhausted",
        "All clue words have been used. Reset used content in the lobby.",
      );
    if (options.settings?.clueMode === "teams") {
      this.target = options.settings.teamTarget;
      this.teams = ["Team Lime", "Team Coral"].map((name, team) => ({
        name,
        ids: players
          .filter(
            (p, index) => (options.settings!.teams[p.id] ?? index % 2) === team,
          )
          .map((p) => p.id),
        score: 0,
        turns: 0,
      }));
      if (players.length < 4 || this.teams.some((t) => t.ids.length < 2))
        throw new GameError(
          "invalid_teams",
          "Team mode needs at least two players on each team.",
        );
      this.rounds = 12;
    }
    this.guesser = this.teams?.[0].ids[0] ?? this.order[0];
    this.guesserName = this.players.get(this.guesser)!.name;
  }
  private next() {
    if (this.teams) {
      if (this.outcome) return undefined;
      const next = this.teams[this.round % 2];
      return next.ids[next.turns % next.ids.length];
    }
    return this.order.find((id) => this.hasPlayer(id) && !this.done.has(id));
  }
  get advancesToInput() {
    return (
      this.phase === "instructions" ||
      (this.phase === "reveal" && this.next() !== undefined)
    );
  }
  waitingPlayers() {
    return this.phase === "allocate" ? [this.guesser] : [];
  }
  connectionIssue(connected: string[]) {
    return this.teams?.some(
      (team) => team.ids.filter((id) => connected.includes(id)).length < 2,
    )
      ? "Waiting for two connected players on each team"
      : null;
  }
  requiredPlayers() {
    return this.input ? [this.guesser] : [];
  }
  private draw() {
    if (!this.deck.length) return false;
    const card = this.deck.pop()!;
    this.seen("clue words", card.word);
    this.word = card.word;
    this.category = card.category;
    this.wordId = randomUUID();
    return true;
  }
  duration(base: number) {
    return this.phase !== "vote" || base === 0
      ? null
      : (base === 90 ? 90 : 60) * 1000;
  }
  advance(): "changed" | "lobby" {
    if (this.final) return "lobby";
    if (this.phase === "instructions") this.phase = "allocate";
    else if (this.phase === "vote") {
      this.finish();
    } else if (this.phase === "reveal") {
      const next = this.next();
      if (!next) this.end();
      else {
        this.round++;
        this.guesser = next;
        this.guesserName = this.players.get(next)!.name;
        this.category = null;
        this.word = "";
        this.ready = false;
        this.correct = 0;
        this.passed = 0;
        this.history = [];
        this.phase = "allocate";
      }
    } else
      throw new GameError("wrong_phase", "The guesser needs to tap I’m ready.");
    return "changed";
  }
  submit(id: string, _action: "submit" | "vote", payload: unknown) {
    if (!this.hasPlayer(id))
      throw new GameError("not_playing", "Join the next game to play.");
    if (this.phase === "allocate") {
      const p = z
        .object({ action: z.literal("ready") })
        .strict()
        .safeParse(payload);
      if (!p.success || id !== this.guesser)
        throw new GameError(
          "guesser_ready",
          "The named guesser must tap I’m ready.",
        );
      this.ready = true;
      return;
    }
    if (this.phase !== "vote")
      throw new GameError("wrong_phase", "This turn has finished.");
    const p = z
      .object({
        action: z.enum(["correct", "pass"]),
        wordId: z.string().uuid(),
      })
      .strict()
      .safeParse(payload);
    if (!p.success) throw new GameError("invalid_input", "Tap Got it or Pass.");
    if (p.data.wordId !== this.wordId)
      throw new GameError("stale_word", "That word already moved on.");
    if (id === this.guesser && p.data.action === "correct")
      throw new GameError(
        "clue_giver_only",
        "A clue-giver marks correct guesses. You can still tap Pass.",
      );
    if (this.teams && !this.teams[(this.round - 1) % 2].ids.includes(id))
      throw new GameError(
        "opponent_waits",
        "The active team controls this turn.",
      );
    const correct = p.data.action === "correct";
    this.history.push({ word: this.word, correct });
    if (correct) this.correct++;
    else this.passed++;
    if (!this.draw()) {
      this.finish();
      this.notice =
        "All clue words have been used. Completed guesses are scored; reset used content in the lobby for more.";
      this.end();
    }
  }
  private finish() {
    if (this.hasPlayer(this.guesser)) this.award(this.guesser, this.correct);
    this.done.add(this.guesser);
    if (this.teams) {
      const active = this.teams[(this.round - 1) % 2];
      active.score += this.correct;
      active.turns++;
      if (
        this.teams[0].turns === this.teams[1].turns &&
        ((Math.max(...this.teams.map((t) => t.score)) >= this.target &&
          this.teams[0].score !== this.teams[1].score) ||
          this.round >= this.rounds)
      ) {
        const [a, b] = this.teams;
        this.outcome =
          a.score === b.score
            ? "Teams tied after equal turns."
            : `${a.score > b.score ? a.name : b.name} wins!`;
      }
    }
    this.phase = "reveal";
  }
  complete(timeout: boolean) {
    if (this.phase === "allocate" && this.ready) {
      if (!this.draw()) {
        this.notice =
          "All clue words have been used. Reset used content in the lobby.";
        this.end();
        return true;
      }
      this.phase = "vote";
      return true;
    }
    if (this.phase === "vote" && timeout) {
      this.finish();
      return true;
    }
    return false;
  }
  end() {
    super.end();
    this.word = "";
    this.category = null;
    this.history = [];
  }
  remove(id: string) {
    super.remove(id);
    this.done.add(id);
    if (this.teams) {
      this.teams.forEach((t) => (t.ids = t.ids.filter((p) => p !== id)));
      if (this.teams.some((t) => t.ids.length < 2)) {
        this.notice =
          "Team game ended because a team has fewer than two players. Completed-turn scores are kept.";
        this.end();
        return;
      }
    }
    if (id === this.guesser && this.input) {
      this.guesserName = "Player left";
      this.correct = 0;
      this.passed = 0;
      this.history = [];
      if (this.teams) this.finish();
      else this.phase = "reveal";
    }
  }
  publicView() {
    const scenario: Scenario = {
      id: "clues",
      title: "Guess the word",
      brief: `${this.guesserName} is guessing`,
      projects: [
        {
          name: "Listen to your friends",
          description: "The guesser sees only the category.",
          symbol: "clues",
        },
        {
          name: "Give spoken clues",
          description: "Do not say the word itself.",
          symbol: "clues",
        },
        {
          name: "Got it or Pass",
          description: "Clue-givers mark correct guesses; anyone can pass.",
          symbol: "clues",
        },
      ],
    };
    return {
      ...this.shell("clue-crew", scenario, 0),
      charades: {
        teams: this.teams ?? undefined,
        activeTeam: this.teams ? (this.round - 1) % 2 : undefined,
        target: this.teams ? this.target : undefined,
        outcome: this.outcome,
        guesserId: this.guesser,
        guesserName: this.guesserName,
        ready: this.ready,
        category: this.phase === "vote" ? this.category : null,
        correct: this.correct,
        passed: this.passed,
        history: this.phase === "reveal" ? this.history : [],
      },
    };
  }
  privateView(id?: string): RoomView["private"] {
    return id && this.hasPlayer(id)
      ? {
          submitted: false,
          charades: {
            word:
              this.phase === "vote" &&
              id !== this.guesser &&
              (!this.teams || this.teams[(this.round - 1) % 2].ids.includes(id))
                ? this.word
                : null,
            wordId:
              this.phase === "vote" &&
              (!this.teams || this.teams[(this.round - 1) % 2].ids.includes(id))
                ? this.wordId
                : null,
            canMark:
              id !== this.guesser &&
              (!this.teams ||
                this.teams[(this.round - 1) % 2].ids.includes(id)),
            canPass:
              !this.teams || this.teams[(this.round - 1) % 2].ids.includes(id),
            isGuesser: id === this.guesser,
          },
        }
      : null;
  }
}
