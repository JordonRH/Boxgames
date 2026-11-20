import { randomUUID } from "node:crypto";
import { z } from "zod";
import { GameError } from "./core.js";
import { SimpleGame } from "./simple-base.js";
import { clueWords } from "./party-content.js";
import type { RoomView, Scenario } from "../../shared/types.js";
export class CharadesGame extends SimpleGame {
  private order: string[];
  private done = new Set<string>();
  private guesser: string;
  private guesserName: string;
  private deck = this.mixed(clueWords);
  private word = "";
  private wordId = randomUUID();
  private ready = false;
  private correct = 0;
  private passed = 0;
  private history: { word: string; correct: boolean }[] = [];
  constructor(players: { id: string; name: string }[]) {
    super(players, players.length);
    this.order = players.map((p) => p.id);
    this.guesser = this.order[0];
    this.guesserName = players[0].name;
  }
  private next() {
    return this.order.find((id) => this.hasPlayer(id) && !this.done.has(id));
  }
  get advancesToInput() {
    return (
      this.phase === "instructions" ||
      (this.phase === "reveal" && this.next() !== undefined)
    );
  }
  requiredPlayers() {
    return this.input ? [this.guesser] : [];
  }
  private draw() {
    if (!this.deck.length) this.deck = this.mixed(clueWords);
    this.word = this.deck.pop()!;
    this.wordId = randomUUID();
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
    const correct = p.data.action === "correct";
    this.history.push({ word: this.word, correct });
    if (correct) this.correct++;
    else this.passed++;
    this.draw();
  }
  private finish() {
    this.award(this.guesser, this.correct);
    this.done.add(this.guesser);
    this.phase = "reveal";
  }
  complete(timeout: boolean) {
    if (this.phase === "allocate" && this.ready) {
      this.draw();
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
    this.history = [];
  }
  remove(id: string) {
    super.remove(id);
    this.done.add(id);
    if (id === this.guesser && this.input) {
      this.guesserName = "Player left";
      this.correct = 0;
      this.passed = 0;
      this.history = [];
      this.phase = "reveal";
    }
  }
  publicView() {
    const scenario: Scenario = {
      id: "clues",
      title: "Guess the word",
      brief: `${this.guesserName} is guessing`,
      projects: [
        {
          name: "Hold up your phone",
          description: "Face the screen towards your friends.",
          symbol: "clues",
        },
        {
          name: "Give spoken clues",
          description: "Do not say the word itself.",
          symbol: "clues",
        },
        {
          name: "Got it or Pass",
          description: "Anyone can mark the current word.",
          symbol: "clues",
        },
      ],
    };
    return {
      ...this.shell("clue-crew", scenario, 0),
      charades: {
        guesserId: this.guesser,
        guesserName: this.guesserName,
        ready: this.ready,
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
            word: this.phase === "vote" ? this.word : null,
            wordId: this.phase === "vote" ? this.wordId : null,
            isGuesser: id === this.guesser,
          },
        }
      : null;
  }
}
