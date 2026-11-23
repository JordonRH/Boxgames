import type { PartySettings } from "./settings.js";
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
  chargeBefore?: number;
  chargeAfter?: number;
  truthPoints?: number;
  bluffPoints?: number;
}
export interface GameView {
  waitingFor?: string[];
  notice?: string | null;
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
    difficulty: "casual" | "medium" | "hard";
    category: string;
    question: string;
    options: KnowledgeOption[];
    charge: { id: string; charge: number }[];
    answers: {
      quizQuestion?: string;
      repairQuestion?: string;
      quiz: string;
      repair: string;
      explanation: string;
      source: string;
    } | null;
    feedback?: { reason: string; count: number }[];
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
    teams?: { name: string; ids: string[]; score: number; turns: number }[];
    activeTeam?: number;
    target?: number;
    outcome?: string | null;
    canMark?: boolean;
    guesserId: string;
    guesserName: string;
    category: string | null;
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
  role: "host" | "player" | "pending" | "display";
  playerId: string | null;
  locked: boolean;
  hostConnected: boolean;
  displayCount?: number;
  players: PlayerView[];
  pending: { id: string; name: string }[];
  settings?: PartySettings;
  standings?: { id: string; name: string; points: number; games: number }[];
  contentUsed?: number;
  selectedGame: string;
  games: GameSummary[];
  game: GameView | null;
  private: {
    rank?: Rank;
    allocation?: Triple | null;
    forecast?: number | null;
    vote?: number | null;
    submitted: boolean;
    survival?: {
      choice: string | null;
      atRisk: boolean | null;
      feedback?: string | null;
    };
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
      refreshUsed?: boolean;
    };
    charades?: {
      word: string | null;
      wordId: string | null;
      isGuesser: boolean;
      canMark?: boolean;
      canPass?: boolean;
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
  role: "host" | "player" | "pending" | "display";
}
export type Ack<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; message: string; retryAfter?: number };
export interface GameCommand {
  commandId: string;
  gameId: string;
  phaseId: string;
}
