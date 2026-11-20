import type {
  Phase,
  Rank,
  RoundResult,
  Scenario,
  Triple,
} from "../../shared/types.js";
import { scenarios } from "./content.js";
export interface Entry {
  id: string;
  name: string;
  rank: Rank;
  allocation: Triple | null;
  forecast: number | null;
  vote: number | null;
}
export interface ParcelState {
  id: string;
  phaseId: string;
  phase: Phase;
  round: number;
  rounds: number;
  deck: Scenario[];
  entries: Map<string, Entry>;
  scores: Map<string, number>;
  result: RoundResult | null;
}
export function shuffle<T>(items: T[], random: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function createGame(
  players: { id: string; name: string }[],
  id: () => string,
  random: () => number,
): ParcelState {
  const order = shuffle(players, random);
  return {
    id: id(),
    phaseId: id(),
    phase: "instructions",
    round: 1,
    rounds: 6,
    deck: shuffle(scenarios, random).slice(0, 6),
    entries: new Map(
      order.map((p, i) => [
        p.id,
        {
          ...p,
          rank: (["largest", "middle", "smallest"] as Rank[])[i % 3],
          allocation: null,
          forecast: null,
          vote: null,
        },
      ]),
    ),
    scores: new Map(players.map((p) => [p.id, 0])),
    result: null,
  };
}
export function rankMatches(
  totals: Triple,
  project: number,
  rank: Rank,
): boolean {
  const sorted = [...totals].sort((a, b) => b - a);
  return (
    totals[project] ===
    sorted[rank === "largest" ? 0 : rank === "middle" ? 1 : 2]
  );
}
export function scoreRound(game: ParcelState): RoundResult {
  const totals: Triple = [0, 0, 0],
    votes: Triple = [0, 0, 0];
  for (const p of game.entries.values()) {
    p.allocation?.forEach((n, i) => (totals[i] += n));
    if (p.vote !== null) votes[p.vote]++;
  }
  const high = Math.max(...votes);
  const spotlight = high ? [0, 1, 2].filter((i) => votes[i] === high) : [];
  const rows = [...game.entries.values()].map((p) => {
    const forecastPoints =
      p.allocation &&
      p.forecast !== null &&
      rankMatches(totals, p.forecast, p.rank)
        ? 3
        : 0;
    const spotlightPoints =
      p.allocation && spotlight.some((i) => p.allocation![i] >= 2) ? 2 : 0;
    const points = forecastPoints + spotlightPoints;
    const total = (game.scores.get(p.id) ?? 0) + points;
    return { ...p, forecastPoints, spotlightPoints, points, total };
  });
  return { totals, votes, spotlight, rows };
}
export function reveal(game: ParcelState) {
  if (game.phase !== "vote") return;
  game.result = scoreRound(game);
  for (const row of game.result.rows) game.scores.set(row.id, row.total);
  game.phase = "reveal";
}
export function clearInputs(game: ParcelState) {
  for (const p of game.entries.values()) {
    p.allocation = null;
    p.forecast = null;
    p.vote = null;
  }
}
export function nextRound(game: ParcelState) {
  game.round++;
  game.result = null;
  for (const p of game.entries.values()) {
    p.rank = (
      { largest: "middle", middle: "smallest", smallest: "largest" } as const
    )[p.rank];
  }
  clearInputs(game);
  game.phase = "allocate";
}
