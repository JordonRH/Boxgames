export type Difficulty = "casual" | "mixed" | "hard";
export interface PartySettings {
  difficulty: Difficulty;
  clueMode: "solo" | "teams";
  teamTarget: number;
  carryScores: boolean;
  teams: Record<string, 0 | 1>;
}
export const defaultSettings = (): PartySettings => ({
  difficulty: "mixed",
  clueMode: "solo",
  teamTarget: 15,
  carryScores: false,
  teams: {},
});
