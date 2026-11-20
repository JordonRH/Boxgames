import { z } from "zod";
import type { RoomView, Triple } from "../../shared/types.js";
import { GameError, type GameOptions } from "./core.js";
import { SimpleGame } from "./simple-base.js";
import { scenarios } from "./content.js";
export class CrowdGame extends SimpleGame {
  private choices = new Map<string, number>();
  private deck = this.reserve("projects", scenarios, 5, (s) => s.id);
  private totals: Triple = [0, 0, 0];
  private winners: number[] = [];
  constructor(
    players: { id: string; name: string }[],
    options: GameOptions = {},
  ) {
    super(players, 5, options);
  }
  advance(): "changed" | "lobby" {
    if (this.final) return "lobby";
    if (this.phase === "instructions") this.phase = "allocate";
    else if (this.phase === "reveal") {
      if (this.round === this.rounds) this.end();
      else {
        this.round++;
        this.choices.clear();
        this.totals = [0, 0, 0];
        this.winners = [];
        this.phase = "allocate";
      }
    } else
      throw new GameError(
        "wrong_phase",
        "Wait for everyone to pick, or for the timer.",
      );
    return "changed";
  }
  submit(id: string, _action: string, payload: unknown) {
    if (!this.hasPlayer(id))
      throw new GameError("not_playing", "Join the next game to play.");
    if (this.phase !== "allocate")
      throw new GameError("wrong_phase", "Picking has finished.");
    const p = z
      .object({ project: z.number().int().min(0).max(2) })
      .strict()
      .safeParse(payload);
    if (!p.success)
      throw new GameError("invalid_input", "Tap one of the three projects.");
    if (this.choices.has(id))
      throw new GameError("already_submitted", "Your choice is locked in.");
    this.choices.set(id, p.data.project);
  }
  complete(timeout: boolean) {
    if (
      this.phase !== "allocate" ||
      (!timeout && this.choices.size < this.players.size)
    )
      return false;
    this.totals = [0, 0, 0];
    for (const c of this.choices.values()) this.totals[c]++;
    const max = Math.max(...this.totals);
    this.winners = max ? [0, 1, 2].filter((i) => this.totals[i] === max) : [];
    for (const [id, c] of this.choices)
      if (this.winners.includes(c)) this.award(id);
    this.phase = "reveal";
    return true;
  }
  remove(id: string) {
    super.remove(id);
    this.choices.delete(id);
  }
  publicView() {
    return {
      ...this.shell("crowd-pick", this.deck[this.round - 1], this.choices.size),
      crowd: {
        totals: this.phase === "reveal" ? this.totals : ([0, 0, 0] as Triple),
        winners: this.phase === "reveal" ? this.winners : [],
        revealed: this.phase === "reveal",
      },
    };
  }
  privateView(id?: string): RoomView["private"] {
    return id && this.hasPlayer(id)
      ? {
          submitted: this.choices.has(id),
          crowd: { choice: this.choices.get(id) ?? null },
        }
      : null;
  }
}
