import { randomUUID } from "node:crypto";
import { z } from "zod";
import { GameError } from "./core.js";
import { SimpleGame } from "./simple-base.js";
import { answers, prompts } from "./party-content.js";
import type { RoomView, Scenario } from "../../shared/types.js";
interface Card {
  id: string;
  text: string;
}
export class CardsGame extends SimpleGame {
  private order: string[];
  private judged = new Set<string>();
  private judge: string;
  private hands = new Map<string, Card[]>();
  private plays = new Map<string, Card>();
  private options: { id: string; text: string; authorId: string }[] = [];
  private deck: string[];
  private promptDeck: string[];
  private winner: string | null = null;
  private winnerText: string | null = null;
  private picked: string | null = null;
  private message: string | null = null;
  constructor(players: { id: string; name: string }[]) {
    super(players, players.length);
    this.order = players.map((p) => p.id);
    this.judge = this.order[0];
    this.deck = this.mixed(answers);
    this.promptDeck = this.mixed(prompts);
    for (const p of players)
      this.hands.set(
        p.id,
        Array.from({ length: 5 }, () => this.draw()),
      );
  }
  private draw(): Card {
    if (!this.deck.length) this.deck = this.mixed(answers);
    return { id: randomUUID(), text: this.deck.pop()! };
  }
  get advancesToInput() {
    return (
      this.phase === "instructions" ||
      (this.phase === "reveal" && this.nextJudge() !== undefined)
    );
  }
  private nextJudge() {
    return this.order.find((id) => this.hasPlayer(id) && !this.judged.has(id));
  }
  requiredPlayers() {
    return this.input ? [this.judge] : [];
  }
  advance(): "changed" | "lobby" {
    if (this.final) return "lobby";
    if (this.phase === "instructions") this.phase = "allocate";
    else if (this.phase === "reveal") {
      const next = this.nextJudge();
      if (!next) this.end();
      else {
        this.round++;
        this.judge = next;
        this.plays.clear();
        this.options = [];
        this.picked = null;
        this.winner = null;
        this.winnerText = null;
        this.message = null;
        this.phase = "allocate";
      }
    } else
      throw new GameError("wrong_phase", "Waiting for the players or judge.");
    return "changed";
  }
  duration(base: number) {
    return !this.input || base === 0
      ? null
      : (this.phase === "vote" ? Math.max(60, base) : base) * 1000;
  }
  submit(id: string, action: "submit" | "vote", payload: unknown) {
    if (!this.hasPlayer(id))
      throw new GameError("not_playing", "Join the next game to play.");
    const parsed = z
      .object({ cardId: z.string().uuid() })
      .strict()
      .safeParse(payload);
    if (!parsed.success)
      throw new GameError("invalid_input", "Tap a card to choose it.");
    if (this.phase === "allocate" && action === "submit") {
      if (id === this.judge)
        throw new GameError(
          "judge_waits",
          "You are judging this round. Wait for the cards.",
        );
      if (this.plays.has(id))
        throw new GameError(
          "already_submitted",
          "Your card is already played.",
        );
      const hand = this.hands.get(id)!,
        index = hand.findIndex((c) => c.id === parsed.data.cardId);
      if (index < 0)
        throw new GameError(
          "invalid_card",
          "Choose a card from your own hand.",
        );
      const [card] = hand.splice(index, 1);
      this.plays.set(id, card);
      hand.push(this.draw());
    } else if (this.phase === "vote" && action === "vote") {
      if (id !== this.judge)
        throw new GameError(
          "judge_only",
          "Only this round’s judge can pick the winner.",
        );
      if (!this.options.some((c) => c.id === parsed.data.cardId))
        throw new GameError("invalid_card", "Choose one of the played cards.");
      this.picked = parsed.data.cardId;
    } else throw new GameError("wrong_phase", "The round has moved on.");
  }
  private finish() {
    if (this.picked) {
      const card = this.options.find((c) => c.id === this.picked)!;
      this.winner = card.authorId;
      this.winnerText = card.text;
      this.award(card.authorId);
    } else
      this.message = this.options.length
        ? "No winner was picked this round."
        : "No cards were played this round.";
    this.judged.add(this.judge);
    this.phase = "reveal";
  }
  complete(timeout: boolean) {
    if (
      this.phase === "allocate" &&
      (timeout || this.plays.size >= this.players.size - 1)
    ) {
      this.options = this.mixed(
        [...this.plays].map(([authorId, c]) => ({ ...c, authorId })),
      );
      if (this.options.length) this.phase = "vote";
      else this.finish();
      return true;
    }
    if (this.phase === "vote" && (timeout || this.picked !== null)) {
      this.finish();
      return true;
    }
    return false;
  }
  remove(id: string) {
    const wasJudge = id === this.judge;
    super.remove(id);
    this.hands.delete(id);
    this.plays.delete(id);
    this.options = this.options.filter((c) => c.authorId !== id);
    this.judged.add(id);
    if (wasJudge && this.input) {
      const next = this.nextJudge();
      if (next) {
        this.judge = next;
        this.plays.delete(next);
        this.options = this.options.filter((c) => c.authorId !== next);
        if (this.phase === "vote" && !this.options.length) this.finish();
      } else this.end();
    }
  }
  publicView() {
    const prompt = this.promptDeck[(this.round - 1) % this.promptDeck.length];
    const scenario: Scenario = {
      id: "cards",
      title: "Fill the blank",
      brief: prompt,
      projects: [
        {
          name: "Play a card",
          description: "Choose from your hand.",
          symbol: "cards",
        },
        {
          name: "Read them out",
          description: "The judge reads the combinations.",
          symbol: "cards",
        },
        {
          name: "Pick a winner",
          description: "One favourite earns one point.",
          symbol: "cards",
        },
      ],
    };
    return {
      ...this.shell(
        "blank-slate",
        scenario,
        this.plays.size,
        Math.max(0, this.players.size - 1),
      ),
      cards: {
        prompt,
        judgeId: this.judge,
        options:
          this.phase === "vote"
            ? this.options.map(({ id, text }) => ({ id, text }))
            : this.phase === "reveal"
              ? this.options
              : [],
        winnerId: this.phase === "reveal" ? this.winner : null,
        winnerText: this.phase === "reveal" ? this.winnerText : null,
        message: this.message,
      },
    };
  }
  privateView(id?: string): RoomView["private"] {
    return id && this.hasPlayer(id)
      ? {
          submitted: this.plays.has(id),
          cards: {
            hand: this.hands.get(id) ?? [],
            isJudge: id === this.judge,
            playedId: this.plays.get(id)?.id ?? null,
          },
        }
      : null;
  }
}
