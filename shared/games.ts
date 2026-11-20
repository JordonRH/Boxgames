import type { GameSummary } from "./types.js";
export const games: GameSummary[] = [
  {
    id: "blank-slate",
    title: "Blank Slate",
    tagline: "Play a card. Get a laugh.",
    description:
      "Fill a silly blank with a card from your hand. A different judge picks their favourite each round.",
    minPlayers: 3,
    minutes: "5–10 min",
    color: "violet",
    steps: [
      "Read the sentence.",
      "Tap one card from your hand to play it.",
      "The judge picks a favourite. Winner gets 1 point.",
    ],
  },
  {
    id: "clue-crew",
    title: "Clue Crew",
    tagline: "One guesses. Everyone gives clues.",
    description:
      "Hold your phone facing your friends. Guess the word while they give clues and tap Got it or Pass.",
    minPlayers: 2,
    minutes: "3–8 min",
    color: "coral",
    steps: [
      "The named player holds their phone facing everyone else.",
      "Everyone else describes the word without saying it.",
      "Tap Got it for a correct guess, or Pass. Each correct guess earns 1 point.",
    ],
  },
  {
    id: "crowd-pick",
    title: "Crowd Pick",
    tagline: "One tap. One big opinion.",
    description:
      "Three wonderfully odd projects. Tap the one you think the room will love. Pick a winner for 1 point.",
    minPlayers: 2,
    minutes: "3–5 min",
    color: "lime",
    steps: [
      "Read the three projects.",
      "Tap one favourite. That is your whole move.",
      "The most popular project wins. Its voters get 1 point. Ties share the win.",
    ],
  },
];
export const defaultGame = "blank-slate";
