export type Triple = [number, number, number];
export type Rank = "largest" | "middle" | "smallest";
export type Phase = "instructions" | "allocate" | "vote" | "reveal" | "final";
export interface Project {
  name: string;
  description: string;
  symbol: string;
}
export interface Scenario {
  id: string;
  title: string;
  brief: string;
  projects: [Project, Project, Project];
}
export interface ResultRow {
  id: string;
  name: string;
  allocation: Triple | null;
  forecast: number | null;
  rank: Rank;
  vote: number | null;
  forecastPoints: number;
  spotlightPoints: number;
  points: number;
  total: number;
}
export interface RoundResult {
  totals: Triple;
  votes: Triple;
  spotlight: number[];
  rows: ResultRow[];
}
export interface PlayerView {
  id: string;
  name: string;
  connected: boolean;
  score: number;
}
export interface GameView {
  id: string;
  phaseId: string;
  phase: Phase;
  round: number;
  rounds: number;
  scenario: Scenario;
  deadline: number | null;
  remainingMs: number | null;
  paused: boolean;
  pauseReason: string | null;
  submitted: number;
  eligible: number;
  result: RoundResult | null;
}
export interface RoomView {
  id: string;
  code: string;
  role: "host" | "player" | "pending";
  playerId: string | null;
  locked: boolean;
  hostConnected: boolean;
  players: PlayerView[];
  pending: { id: string; name: string }[];
  game: GameView | null;
  private: {
    rank: Rank;
    allocation: Triple | null;
    forecast: number | null;
    vote: number | null;
    submitted: boolean;
  } | null;
  joinUrl: string;
  now: number;
  expiresAt: number;
  revision: number;
  duration: number;
}
export interface Session {
  roomId: string;
  code: string;
  token: string;
  role: "host" | "player" | "pending";
}
export type Ack<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; message: string; retryAfter?: number };
export interface GameCommand {
  commandId: string;
  gameId: string;
  phaseId: string;
}
