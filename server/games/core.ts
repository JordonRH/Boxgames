import type { GameView, RoomView, GameSummary } from "../../shared/types.js";
import type { ContentHistory } from "./history.js";
import type { PartySettings } from "../../shared/settings.js";
export interface GameOptions {
  history?: ContentHistory;
  settings?: PartySettings;
}
export class GameError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export type PublicGame = Omit<
  GameView,
  "deadline" | "remainingMs" | "paused" | "pauseReason"
>;
export interface GameEngine {
  readonly id: string;
  phaseId: string;
  readonly phase: GameView["phase"];
  readonly result: GameView["result"];
  readonly input: boolean;
  readonly final: boolean;
  readonly advancesToInput: boolean;
  hasPlayer(id: string): boolean;
  score(id: string): number;
  duration(baseSeconds: number): number | null;
  submit(id: string, action: "submit" | "vote", payload: unknown): void;
  advance(): "changed" | "lobby";
  end(): void;
  complete(timeout: boolean): boolean;
  remove(id: string): void;
  publicView(): PublicGame;
  privateView(id?: string): RoomView["private"];
  requiredPlayers?(): string[];
  connectionIssue?(connectedIds: string[]): string | null;
  waitingPlayers?(): string[];
  feedback?(id: string, reason: string): void;
}
export interface GameFactory {
  minPlayers: number;
  metadata?: GameSummary;
  create(
    players: { id: string; name: string }[],
    options?: GameOptions,
  ): GameEngine;
}
