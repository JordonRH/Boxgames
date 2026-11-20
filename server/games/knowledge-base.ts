import type { Scenario } from "../../shared/types.js";
import { randomUUID } from "node:crypto";
import type { Question } from "./knowledge-content.js";
export function scenario(title: string, brief: string): Scenario {
  return {
    id: "knowledge",
    title,
    brief,
    projects: [
      { name: "Read", description: "Read the question.", symbol: "question" },
      {
        name: "Choose",
        description: "Use your own screen.",
        symbol: "question",
      },
      {
        name: "Reveal",
        description: "See the result together.",
        symbol: "question",
      },
    ],
  };
}
export function questionOptions(q: Question) {
  return [q.answer, ...q.wrong].map((text) => ({ id: randomUUID(), text }));
}
