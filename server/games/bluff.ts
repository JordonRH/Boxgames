import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { KnowledgeRow, RoomView } from "../../shared/types.js";
import { GameError, type GameOptions } from "./core.js";
import { SimpleGame } from "./simple-base.js";
import { oddWords } from "./knowledge-content.js";
import { scenario } from "./knowledge-base.js";
export const normalizeMeaning = (s: string) =>
  s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\p{M}\p{P}\p{S}\s]/gu, "");
interface Option {
  id: string;
  text: string;
  authors: string[];
  truth: boolean;
}
export class BluffGame extends SimpleGame {
  private deck = this.reserve("odd words", oddWords, 5, (w) => w.term);
  private texts = new Map<string, string>();
  private pairs = new Map<string, Option[]>();
  private votes = new Map<string, string>();
  private options: Option[] = [];
  private rows: KnowledgeRow[] = [];
  private skipped = false;
  constructor(
    players: { id: string; name: string }[],
    options: GameOptions = {},
  ) {
    super(players, 5, options);
  }
  private get word() {
    return this.deck[this.round - 1];
  }
  duration(base: number) {
    return !this.input || base === 0
      ? null
      : (this.phase === "allocate" ? 45 : 20) * (base === 90 ? 2 : 1) * 1000;
  }
  submit(id: string, action: "submit" | "vote", payload: unknown) {
    if (!this.hasPlayer(id))
      throw new GameError("not_playing", "Join the next game to play.");
    if (this.phase === "allocate" && action === "submit") {
      if (this.texts.has(id))
        throw new GameError("already_submitted", "Your bluff is locked in.");
      const parsed = z
        .object({ text: z.string().max(160) })
        .strict()
        .safeParse(payload);
      if (!parsed.success)
        throw new GameError(
          "invalid_input",
          "Write a made-up meaning, up to 80 characters.",
        );
      const text = parsed.data.text
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, " ");
      if (
        text.length < 3 ||
        text.length > 80 ||
        /[\p{Cc}\p{Cf}]/u.test(text) ||
        !/[\p{L}\p{N}]/u.test(text)
      )
        throw new GameError(
          "invalid_input",
          "Use 3–80 visible characters for your bluff.",
        );
      const key = normalizeMeaning(text);
      if (
        [this.word.truth, this.word.term, ...this.word.aliases].some(
          (a) => normalizeMeaning(a) === key,
        )
      )
        throw new GameError(
          "known_truth",
          "Already know it? Invent a different, made-up meaning.",
        );
      this.texts.set(id, text);
    } else if (this.phase === "vote" && action === "vote") {
      const p = z
        .object({ optionId: z.string().uuid() })
        .strict()
        .safeParse(payload);
      if (
        !p.success ||
        !this.pairs.get(id)?.some((o) => o.id === p.data.optionId)
      )
        throw new GameError(
          "invalid_input",
          "Choose one of the two meanings on your screen.",
        );
      if (this.votes.has(id))
        throw new GameError("already_submitted", "Your vote is locked in.");
      this.votes.set(id, p.data.optionId);
    } else
      throw new GameError(
        "wrong_phase",
        "That part of the round has finished.",
      );
  }
  private matchPairs() {
    const truth: Option = {
      id: randomUUID(),
      text: this.word.truth,
      truth: true,
      authors: [],
    };
    const groups = new Map<string, Option>();
    for (const [id, text] of this.texts) {
      const key = normalizeMeaning(text),
        existing = groups.get(key);
      if (existing) existing.authors.push(id);
      else
        groups.set(key, {
          id: randomUUID(),
          text,
          truth: false,
          authors: [id],
        });
    }
    // At most one submitted text per player: N+1 alternatives guarantee a
    // fallback distinct from every player's text, even when all bluffs merge.
    const used = new Set([...this.texts.values()].map(normalizeMeaning));
    const houseText = [
      this.word.decoy,
      ...Array.from(
        { length: this.players.size + 1 },
        (_, i) => `A ceremonial box with ${i + 2} hidden compartments`,
      ),
    ].find(
      (text) =>
        !used.has(normalizeMeaning(text)) &&
        normalizeMeaning(text) !== normalizeMeaning(this.word.truth),
    )!;
    const house: Option = {
      id: randomUUID(),
      text: houseText,
      truth: false,
      authors: [],
    };
    const bluffs = this.mixed([...groups.values()]),
      uses = new Map<string, number>();
    this.options = [truth, ...bluffs];
    for (const id of this.players.keys()) {
      const eligible = bluffs.filter((o) => !o.authors.includes(id));
      eligible.sort((a, b) => (uses.get(a.id) ?? 0) - (uses.get(b.id) ?? 0));
      const decoy = eligible[0] ?? house;
      if (decoy === house && !this.options.includes(house))
        this.options.push(house);
      uses.set(decoy.id, (uses.get(decoy.id) ?? 0) + 1);
      this.pairs.set(id, this.mixed([truth, decoy]));
    }
  }
  complete(timeout: boolean) {
    if (!this.input) return false;
    if (this.phase === "allocate") {
      if (!timeout && this.texts.size < this.players.size) return false;
      this.matchPairs();
      this.phase = "vote";
    } else {
      if (!timeout && this.votes.size < this.players.size) return false;
      const points = new Map([...this.players.keys()].map((id) => [id, 0]));
      for (const [id, vote] of this.votes) {
        const option = this.options.find((o) => o.id === vote)!;
        if (option.truth) points.set(id, (points.get(id) ?? 0) + 2);
        else
          for (const author of option.authors)
            if (this.hasPlayer(author))
              points.set(author, (points.get(author) ?? 0) + 1);
      }
      this.rows = [...points].map(([id, points]) => {
        this.award(id, points);
        const truthPoints = this.options.find(
          (o) => o.id === this.votes.get(id),
        )?.truth
          ? 2
          : 0;
        return { id, points, truthPoints, bluffPoints: points - truthPoints };
      });
      this.phase = "reveal";
    }
    return true;
  }
  advance(): "changed" | "lobby" {
    if (this.final) return "lobby";
    if (this.phase === "instructions") this.phase = "allocate";
    else if (this.input) {
      this.clear();
      this.skipped = true;
      this.phase = "reveal";
    } else if (this.phase === "reveal") {
      if (this.round === this.rounds) this.end();
      else {
        this.round++;
        this.clear();
        this.skipped = false;
        this.phase = "allocate";
      }
    }
    return "changed";
  }
  private clear() {
    this.texts.clear();
    this.pairs.clear();
    this.votes.clear();
    this.options = [];
    this.rows = [];
  }
  end() {
    this.clear();
    super.end();
  }
  remove(id: string) {
    super.remove(id);
    this.texts.delete(id);
    this.pairs.delete(id);
    this.votes.delete(id);
    for (const o of this.options) o.authors = o.authors.filter((a) => a !== id);
    this.rows = this.rows.filter((r) => r.id !== id);
  }
  publicView() {
    const revealed = this.phase === "reveal";
    return {
      ...this.shell(
        "false-front",
        scenario("What does it mean?", this.word.term),
        (this.phase === "allocate" ? this.texts : this.votes).size,
      ),
      bluff: {
        term: this.word.term,
        truth: revealed ? this.word.truth : null,
        source: revealed ? this.word.source : null,
        skipped: this.skipped,
        options: revealed
          ? this.options.map((o) => ({
              ...o,
              voters: [...this.votes]
                .filter(([, v]) => v === o.id)
                .map(([id]) => id),
            }))
          : [],
        rows: revealed ? this.rows : [],
      },
    };
  }
  privateView(id?: string): RoomView["private"] {
    if (!id || !this.hasPlayer(id)) return null;
    return {
      submitted:
        this.phase === "allocate" ? this.texts.has(id) : this.votes.has(id),
      bluff: {
        text: this.texts.get(id) ?? null,
        options:
          this.phase === "vote"
            ? (this.pairs.get(id) ?? []).map(({ id, text }) => ({ id, text }))
            : [],
        choice: this.votes.get(id) ?? null,
      },
    };
  }
}
