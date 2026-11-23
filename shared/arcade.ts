export type ArcadeKind =
  | "year"
  | "world"
  | "australia"
  | "rapid"
  | "drawing"
  | "rare"
  | "artist"
  | "sound";
export interface InkStroke {
  color: number;
  points: [number, number][];
}
export interface ArcadeRow {
  id: string;
  answer: string;
  points: number;
  distance?: number;
  correct?: boolean;
}
export interface ArcadeView {
  kind: ArcadeKind;
  prompt: string;
  clue?: string;
  category?: string;
  choices?: { id: string; text: string }[];
  claims?: { id: string; text: string }[];
  notes?: number[];
  gallery?: {
    id: string;
    strokes?: InkStroke[];
    authorId?: string;
    votes?: number;
  }[];
  reveal?: {
    answer: string;
    source?: string;
    lat?: number;
    lon?: number;
    rows: ArcadeRow[];
    checks?: { text: string; real: boolean }[];
  } | null;
}
export interface ArcadePrivate {
  submitted: boolean;
  canAnswer: boolean;
  answer?: string;
  choices?: string[];
}
