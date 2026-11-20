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
export interface KnowledgeOption {
  id: string;
  text: string;
}
export interface KnowledgeRow {
  id: string;
  points: number;
  quiz?: boolean;
  repair?: boolean;
}
export interface GameView {
  gameKey?: string;
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
  survival?: {
    question: string;
    options: KnowledgeOption[];
    charge: { id: string; charge: number }[];
    answers: {
      quiz: string;
      repair: string;
      explanation: string;
      source: string;
    } | null;
    rows: KnowledgeRow[];
  };
  bluff?: {
    term: string;
    truth: string | null;
    source: string | null;
    skipped: boolean;
    options: {
      id: string;
      text: string;
      authors: string[];
      truth: boolean;
      voters: string[];
    }[];
    rows: KnowledgeRow[];
  };
  crowd?: { totals: Triple; winners: number[]; revealed: boolean };
  cards?: {
    prompt: string;
    judgeId: string;
    options: { id: string; text: string; authorId?: string }[];
    winnerId: string | null;
    winnerText: string | null;
    message: string | null;
  };
  charades?: {
    guesserId: string;
    guesserName: string;
    ready: boolean;
    correct: number;
    passed: number;
    history: { word: string; correct: boolean }[];
  };
}
export interface GameSummary {
  id: string;
  title: string;
  tagline: string;
  description: string;
  minPlayers: number;
  minutes: string;
  color: string;
  steps: string[];
  hidden?: boolean;
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
  selectedGame: string;
  games: GameSummary[];
  game: GameView | null;
  private: {
    rank?: Rank;
    allocation?: Triple | null;
    forecast?: number | null;
    vote?: number | null;
    submitted: boolean;
    survival?: { choice: string | null; atRisk: boolean | null };
    bluff?: {
      text: string | null;
      options: KnowledgeOption[];
      choice: string | null;
    };
    crowd?: { choice: number | null };
    cards?: {
      hand: { id: string; text: string }[];
      isJudge: boolean;
      playedId: string | null;
    };
    charades?: {
      word: string | null;
      wordId: string | null;
      isGuesser: boolean;
    };
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
