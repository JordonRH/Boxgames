export type Difficulty = "casual" | "mixed" | "hard";
export interface PartySettings {
  drawingCategory?:
    "mixed" | "movies" | "games" | "sports" | "creatures" | "everyday";
  difficulty: Difficulty;
  clueMode: "solo" | "teams";
  teamTarget: number;
  carryScores: boolean;
  teams: Record<string, 0 | 1>;
}
export const defaultSettings = (): PartySettings => ({
  drawingCategory: "mixed",
  difficulty: "mixed",
  clueMode: "solo",
  teamTarget: 15,
  carryScores: false,
  teams: {},
});
