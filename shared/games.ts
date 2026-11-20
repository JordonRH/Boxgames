import type { GameSummary } from "./types.js";
export const games: GameSummary[] = [
  {
    id: "blackout-run",
    title: "Blackout Run",
    tagline: "Keep your lights on.",
    description:
      "Answer trivia, then race a quick repair puzzle. Protect your charge through six rounds. Everyone stays in.",
    minPlayers: 2,
    minutes: "6–10 min",
    color: "lime",
    steps: [
      "Tap an answer to the trivia question. A correct answer earns 2 points and restores 1 charge.",
      "Tap an answer to the repair puzzle for 1 point. Miss both questions and lose 1 charge.",
      "Everyone plays all six rounds. Your remaining charge adds a final bonus of up to 3 points.",
    ],
  },
  {
    id: "false-front",
    title: "False Front",
    tagline: "Make nonsense sound official.",
    description:
      "Invent a believable meaning for an odd word. Then spot the real meaning in a private two-choice duel.",
    minPlayers: 2,
    minutes: "5–8 min",
    color: "coral",
    steps: [
      "Write a made-up meaning for the word. Keep it short and convincing.",
      "Pick the real meaning from two options on your own screen. You never face your own bluff.",
      "Find the truth for 2 points; earn 1 each time your bluff fools someone. Five rounds.",
    ],
  },
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
