import { randomUUID, randomInt } from "node:crypto";
import type { GameEngine, PublicGame } from "./core.js";
import type { Phase, RoomView, Scenario } from "../../shared/types.js";
import { shuffle } from "./parcel.js";
export abstract class SimpleGame implements GameEngine {
  readonly id = randomUUID();
  phaseId = randomUUID();
  phase: Phase = "instructions";
  result = null;
  round = 1;
  readonly players: Map<string, { id: string; name: string }>;
  protected scores = new Map<string, number>();
  constructor(
    players: { id: string; name: string }[],
    readonly rounds: number,
  ) {
    this.players = new Map(players.map((p) => [p.id, p]));
    players.forEach((p) => this.scores.set(p.id, 0));
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
      (this.phase === "reveal" && this.round < this.rounds)
    );
  }
  hasPlayer(id: string) {
    return this.players.has(id);
  }
  score(id: string) {
    return this.scores.get(id) ?? 0;
  }
  protected award(id: string, n = 1) {
    this.scores.set(id, this.score(id) + n);
  }
  protected mixed<T>(items: T[]) {
    return shuffle(items, () => randomInt(1000000) / 1000000);
  }
  duration(base: number) {
    return !this.input || base === 0 ? null : base * 1000;
  }
  end() {
    this.phase = "final";
  }
  remove(id: string) {
    this.players.delete(id);
    this.scores.delete(id);
  }
  protected shell(
    gameKey: string,
    scenario: Scenario,
    submitted: number,
    eligible = this.players.size,
  ): PublicGame {
    return {
      gameKey,
      id: this.id,
      phaseId: this.phaseId,
      phase: this.phase,
      round: this.round,
      rounds: this.rounds,
      scenario,
      submitted,
      eligible,
      result: null,
    };
  }
  abstract advance(): "changed" | "lobby";
  abstract submit(
    id: string,
    action: "submit" | "vote",
    payload: unknown,
  ): void;
  abstract complete(timeout: boolean): boolean;
  abstract publicView(): PublicGame;
  abstract privateView(id?: string): RoomView["private"];
}
