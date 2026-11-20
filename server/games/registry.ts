import { z } from "zod";
import { randomInt, randomUUID } from "node:crypto";
import type { GameView, RoomView, Triple } from "../../shared/types.js";
import {
  clearInputs,
  createGame,
  nextRound,
  reveal,
  type ParcelState,
} from "./parcel.js";

import {
  GameError,
  type GameEngine,
  type GameFactory,
  type PublicGame,
} from "./core.js";
export { GameError } from "./core.js";
export type { GameEngine, GameFactory } from "./core.js";
import { games as catalogue } from "../../shared/games.js";
import { CardsGame } from "./cards.js";
import { CharadesGame } from "./charades.js";
import { CrowdGame } from "./crowd.js";
import { SurvivalGame } from "./survival.js";
import { BluffGame } from "./bluff.js";
const constructors = {
  "blank-slate": CardsGame,
  "clue-crew": CharadesGame,
  "crowd-pick": CrowdGame,
  "blackout-run": SurvivalGame,
  "false-front": BluffGame,
};

const allocationSchema = z
  .object({
    allocation: z
      .tuple([
        z.number().int().min(0).max(6),
        z.number().int().min(0).max(6),
        z.number().int().min(0).max(6),
      ])
      .refine((a) => a.reduce((a, b) => a + b, 0) === 6),
    forecast: z.number().int().min(0).max(2),
  })
  .strict();
const voteSchema = z
  .object({ project: z.number().int().min(0).max(2) })
  .strict();

export class ParcelEngine implements GameEngine {
  constructor(private readonly state: ParcelState) {}
  get id() {
    return this.state.id;
  }
  get phaseId() {
    return this.state.phaseId;
  }
  set phaseId(value: string) {
    this.state.phaseId = value;
  }
  get phase() {
    return this.state.phase;
  }
  get result() {
    return this.state.result;
  }
  get input() {
    return this.phase === "allocate" || this.phase === "vote";
  }
  get final() {
    return this.phase === "final";
  }
  get advancesToInput() {
    return (
      this.phase === "instructions" ||
      (this.phase === "reveal" && this.state.round < this.state.rounds)
    );
  }
  hasPlayer(id: string) {
    return this.state.entries.has(id);
  }
  score(id: string) {
    return this.state.scores.get(id) ?? 0;
  }
  duration(base: number) {
    return !this.input || base === 0
      ? null
      : (this.phase === "vote" ? Math.round((base * 20) / 45) : base) * 1000;
  }
  submit(id: string, action: "submit" | "vote", payload: unknown) {
    const p = this.state.entries.get(id);
    if (!p) throw new GameError("not_playing", "You can play the next game.");
    if (action === "submit") {
      if (this.phase !== "allocate")
        throw new GameError(
          "stale_phase",
          "Allocation has finished. Your screen will update.",
        );
      const parsed = allocationSchema.safeParse(payload);
      if (!parsed.success)
        throw new GameError(
          "invalid_input",
          "Use exactly six whole crates and choose a forecast.",
        );
      if (p.allocation)
        throw new GameError(
          "already_submitted",
          "Your allocation is already locked in.",
        );
      p.allocation = parsed.data.allocation as Triple;
      p.forecast = parsed.data.forecast;
    } else {
      if (this.phase !== "vote")
        throw new GameError(
          "stale_phase",
          "Voting is not open. Your screen will update.",
        );
      const parsed = voteSchema.safeParse(payload);
      if (!parsed.success)
        throw new GameError(
          "invalid_input",
          "Choose one of the three projects.",
        );
      if (p.vote !== null)
        throw new GameError(
          "already_submitted",
          "Your vote is already locked in.",
        );
      p.vote = parsed.data.project;
    }
  }
  advance(): "changed" | "lobby" {
    if (this.final) return "lobby";
    if (this.phase === "instructions") this.state.phase = "allocate";
    else if (this.phase === "reveal") {
      if (this.state.round >= this.state.rounds) this.end();
      else nextRound(this.state);
    } else
      throw new GameError(
        "wrong_phase",
        "Wait for submissions or the timer. Pause if your group needs more time.",
      );
    return "changed";
  }
  end() {
    clearInputs(this.state);
    this.state.result = null;
    this.state.phase = "final";
  }
  complete(timeout: boolean) {
    const entries = [...this.state.entries.values()];
    if (
      this.phase === "allocate" &&
      (timeout || entries.every((p) => p.allocation !== null))
    ) {
      this.state.phase = "vote";
      return true;
    }
    if (
      this.phase === "vote" &&
      (timeout || entries.every((p) => p.vote !== null))
    ) {
      reveal(this.state);
      return true;
    }
    return false;
  }
  remove(id: string) {
    this.state.entries.delete(id);
    this.state.scores.delete(id);
    if (this.state.result)
      this.state.result.rows = this.state.result.rows.map((row) =>
        row.id === id ? { ...row, name: "Removed player" } : row,
      );
  }
  publicView(): PublicGame {
    const g = this.state;
    return {
      gameKey: "parcel-parliament",
      id: g.id,
      phaseId: g.phaseId,
      phase: g.phase,
      round: g.round,
      rounds: g.rounds,
      scenario: g.deck[g.round - 1],
      submitted: [...g.entries.values()].filter((p) =>
        this.phase === "allocate"
          ? p.allocation !== null
          : this.phase === "vote"
            ? p.vote !== null
            : false,
      ).length,
      eligible: g.entries.size,
      result: g.result,
    };
  }
  privateView(id?: string): RoomView["private"] {
    const p = id ? this.state.entries.get(id) : undefined;
    if (!p) return null;
    return {
      rank: p.rank,
      allocation: this.input ? p.allocation : null,
      forecast: this.input ? p.forecast : null,
      vote: this.phase === "vote" ? p.vote : null,
      submitted:
        this.phase === "allocate"
          ? p.allocation !== null
          : this.phase === "vote"
            ? p.vote !== null
            : false,
    };
  }
}
export const gameRegistry = new Map<string, GameFactory>([
  ...catalogue.map(
    (summary) =>
      [
        summary.id,
        {
          minPlayers: summary.minPlayers,
          metadata: summary,
          create: (players: { id: string; name: string }[]) =>
            new constructors[summary.id as keyof typeof constructors](players),
        },
      ] as [string, GameFactory],
  ),
  // Keep the original engine for existing protocol clients and historical checks.
  [
    "parcel-parliament",
    {
      minPlayers: 3,
      metadata: {
        id: "parcel-parliament",
        title: "Parcel Parliament",
        tagline: "Original advanced mode",
        description: "Legacy game",
        minPlayers: 3,
        minutes: "10–15 min",
        color: "lime",
        steps: [],
        hidden: true,
      },
      create: (players) =>
        new ParcelEngine(
          createGame(players, randomUUID, () => randomInt(1000000) / 1000000),
        ),
    },
  ],
]);
