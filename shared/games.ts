import type { GameSummary } from "./types.js";
import { arcadeGames } from "./arcade-catalogue.js";
export const games: GameSummary[] = [
  ...arcadeGames,
  {
    id: "blackout-run",
    title: "Blackout Run",
    tagline: "Most points wins. Keep a little power in reserve.",
    description:
      "Choose Casual, Mixed or Hard for a six-round quiz with repair puzzles. Earn points and protect your battery bonus.",
    minPlayers: 2,
    minutes: "6–10 min",
    color: "lime",
    steps: [
      "Tap an answer to the trivia question. A correct answer earns 2 points and restores 1 charge.",
      "Tap an answer to the repair puzzle for 1 point. Miss both questions and lose 1 charge.",
      "Highest score after six rounds wins. Charge is your battery bonus: each unit left adds 1 final point. Zero charge never knocks you out.",
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
      "Play together or split into two teams. Guess from spoken clues while your friends read the word on their own screens.",
    minPlayers: 2,
    minutes: "3–8 min",
    color: "coral",
    steps: [
      "The named guesser taps I’m ready. They see the category, never the word.",
      "Everyone else reads the word on their own screen and gives clues without saying the word, any part of it, or rhymes.",
      "Clue-givers tap Got it when the guesser says the word. Anyone can Pass. Each correct guess earns 1 point.",
    ],
  },
  {
    id: "crowd-pick",
    title: "Crowd Pick",
    tagline: "One tap. One big opinion.",
    description:
      "Vote on delightfully odd proposals with at least three players. Pick the room’s favourite for 1 point.",
    minPlayers: 3,
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
