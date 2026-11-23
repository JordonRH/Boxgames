import { randomUUID } from "node:crypto";
import { z } from "zod";
import { SimpleGame } from "./simple-base.js";
import { GameError, type GameOptions } from "./core.js";
import type { RoomView, Scenario } from "../../shared/types.js";
import type {
  ArcadeKind,
  ArcadeView,
  ArcadeRow,
  InkStroke,
} from "../../shared/arcade.js";
import {
  years,
  artists,
  drawingPrompts,
  rareTopics,
  realCreatures,
  fakeCreatures,
} from "./arcade-content.js";
import places from "./arcade-places.json" with { type: "json" };
export const arcadeKinds: Record<string, ArcadeKind> = {
  "time-tangle": "year",
  "world-wander": "world",
  "road-trip": "australia",
  "creature-check": "rapid",
  "odd-canvas": "drawing",
  "rare-find": "rare",
  "mic-check": "artist",
  "echo-box": "sound",
};
const text = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine((t) => !/[\p{Cc}\p{Cf}]/u.test(t));
const ink = z
  .array(
    z
      .object({
        color: z.number().int().min(0).max(4),
        points: z
          .array(
            z.tuple([
              z.number().int().min(0).max(255),
              z.number().int().min(0).max(255),
            ]),
          )
          .min(1)
          .max(400),
      })
      .strict(),
  )
  .min(1)
  .max(30)
  .refine((s) => s.reduce((n, line) => n + line.points.length, 0) <= 400);
export const normalizeAnswer = (s: string) =>
  s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\p{M}\p{P}\p{S}\s]/gu, "");
export function kmBetween(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const rad = Math.PI / 180,
    a =
      Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
      Math.cos(lat1 * rad) *
        Math.cos(lat2 * rad) *
        Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
}
type Input = {
  year?: number;
  lat?: number;
  lon?: number;
  text?: string;
  checks?: boolean[];
  strokes?: InkStroke[];
  choiceId?: string;
};
export class ArcadeGame extends SimpleGame {
  private deck: any[];
  private inputs = new Map<string, Input>();
  private later = new Map<string, Input>();
  private votes = new Map<string, string>();
  private gallery: {
    id: string;
    strokes: InkStroke[];
    authorId: string;
    votes: number;
  }[] = [];
  private rows: ArcadeRow[] = [];
  private choiceOptions: { id: string; text: string; notes: number[] }[] = [];
  private soundAnswer = "";
  readonly kind: ArcadeKind;
  constructor(
    players: { id: string; name: string }[],
    readonly key: string,
    options: GameOptions = {},
  ) {
    const kind = arcadeKinds[key];
    if (!kind) throw new GameError("unknown_game", "Choose an available game.");
    super(players, kind === "drawing" || kind === "rapid" ? 3 : 6, options);
    this.kind = kind;
    const reserve = (
      pool: any[],
      count = this.rounds,
      keyFn = (v: any) => v.text ?? v.name,
    ) => this.reserve(`arcade:${key}`, pool, count, keyFn);
    if (kind === "year") this.deck = reserve(years);
    else if (kind === "world" || kind === "australia")
      this.deck = reserve(places[kind]);
    else if (kind === "artist") this.deck = reserve(artists);
    else if (kind === "rare") this.deck = reserve(rareTopics);
    else if (kind === "drawing") {
      const category = options.settings?.drawingCategory ?? "mixed";
      const pool = Object.entries(drawingPrompts)
        .filter(([k]) => category === "mixed" || category === k)
        .flatMap(([category, rows]) =>
          rows.map((text) => ({ text, category })),
        );
      this.deck = reserve(pool);
    } else if (kind === "rapid") {
      const pool = [
        ...realCreatures.map((text) => ({ text, real: true })),
        ...fakeCreatures.map((text) => ({ text, real: false })),
      ];
      const picked = reserve(pool, this.rounds * 6);
      this.deck = Array.from({ length: this.rounds }, (_, i) => ({
        claims: picked
          .slice(i * 6, i * 6 + 6)
          .map((c) => ({ ...c, id: randomUUID() })),
      }));
    } else {
      const pool = Array.from({ length: 64 }, (_, n) => ({
        name: `pattern-${n}`,
        notes: [0, Math.floor(n / 25) % 5, Math.floor(n / 5) % 5, n % 5],
      }));
      this.deck = reserve(pool);
    }
    this.prepareSound();
  }
  private get card() {
    return this.deck[this.round - 1];
  }
  private prepareSound() {
    if (this.kind !== "sound") return;
    const notes = this.card.notes as number[],
      variants = [
        notes,
        ...[1, 2, 3].map((i) =>
          notes.map((n, j) => (j === i % notes.length ? (n + i) % 5 : n)),
        ),
      ];
    this.choiceOptions = this.mixed(
      variants.map((n) => ({
        id: randomUUID(),
        notes: n,
        text: n
          .map((v) => ["low", "low-mid", "middle", "high-mid", "high"][v])
          .join(" · "),
      })),
    );
    this.soundAnswer = this.choiceOptions.find((o) =>
      o.notes.every((n, i) => n === notes[i]),
    )!.id;
  }
  duration(base: number) {
    if (!this.input || base === 0) return null;
    return (
      (this.kind === "drawing"
        ? this.phase === "allocate"
          ? 60
          : 30
        : this.kind === "rapid"
          ? 30
          : this.kind === "artist"
            ? 20
            : 35) *
      (base === 90 ? 2 : 1) *
      1000
    );
  }
  private artistCorrect(input?: Input) {
    return (
      !!input?.text &&
      [this.card.name, ...this.card.aliases].some(
        (s: string) => normalizeAnswer(s) === normalizeAnswer(input.text!),
      )
    );
  }
  waitingPlayers() {
    return [...this.players.keys()].filter((id) =>
      this.phase === "vote"
        ? this.kind === "drawing"
          ? !this.votes.has(id)
          : !this.artistCorrect(this.inputs.get(id)) && !this.later.has(id)
        : !this.inputs.has(id),
    );
  }
  submit(id: string, action: "submit" | "vote", payload: unknown) {
    if (!this.hasPlayer(id))
      throw new GameError("not_playing", "Join the next game to play.");
    const voted = this.phase === "vote";
    if (!this.input || action !== (voted ? "vote" : "submit"))
      throw new GameError("wrong_phase", "The round moved on.");
    if (voted && this.kind === "drawing") {
      if (this.votes.has(id))
        throw new GameError("already_submitted", "Your vote is locked.");
      const data = z
        .object({ choiceId: z.string().uuid() })
        .strict()
        .safeParse(payload);
      const art =
        data.success &&
        this.gallery.find(
          (g) => g.id === data.data.choiceId && g.authorId !== id,
        );
      if (!art)
        throw new GameError(
          "invalid_choice",
          "Choose another player's sketch.",
        );
      this.votes.set(id, art.id);
      return;
    }
    const target = voted ? this.later : this.inputs;
    if (
      target.has(id) ||
      (voted &&
        this.kind === "artist" &&
        this.artistCorrect(this.inputs.get(id)))
    )
      throw new GameError(
        "already_submitted",
        "Your answer is locked for this stage.",
      );
    let schema: z.ZodTypeAny;
    if (this.kind === "year")
      schema = z
        .object({ year: z.number().int().min(1000).max(2100) })
        .strict();
    else if (this.kind === "world" || this.kind === "australia")
      schema = z
        .object({
          lat: z
            .number()
            .min(this.kind === "australia" ? -45 : -85)
            .max(this.kind === "australia" ? -9 : 85),
          lon: z
            .number()
            .min(this.kind === "australia" ? 110 : -180)
            .max(this.kind === "australia" ? 155 : 180),
        })
        .strict();
    else if (this.kind === "rapid")
      schema = z.object({ checks: z.array(z.boolean()).length(6) }).strict();
    else if (this.kind === "drawing")
      schema = z.object({ strokes: ink }).strict();
    else if (this.kind === "sound")
      schema = z
        .object({
          choiceId: z.enum(
            this.choiceOptions.map((o) => o.id) as [string, ...string[]],
          ),
        })
        .strict();
    else schema = z.object({ text }).strict();
    const parsed = schema.safeParse(payload);
    if (!parsed.success)
      throw new GameError(
        "invalid_input",
        "Check your answer and submit again.",
      );
    target.set(id, parsed.data as Input);
  }
  complete(timeout: boolean) {
    if (!this.input) return false;
    if (!timeout && this.waitingPlayers().length) return false;
    if (this.phase === "allocate" && this.kind === "drawing") {
      this.gallery = this.mixed(
        [...this.inputs].map(([authorId, p]) => ({
          id: randomUUID(),
          authorId,
          strokes: p.strokes!,
          votes: 0,
        })),
      );
      if (this.gallery.length > 1) {
        this.phase = "vote";
        return true;
      }
    }
    if (
      this.phase === "allocate" &&
      this.kind === "artist" &&
      [...this.players.keys()].some(
        (id) => !this.artistCorrect(this.inputs.get(id)),
      )
    ) {
      this.phase = "vote";
      return true;
    }
    this.finish();
    return true;
  }
  private finish() {
    if (this.kind === "drawing")
      for (const art of this.gallery)
        art.votes = [...this.votes.values()].filter(
          (id) => id === art.id,
        ).length;
    const canon = (raw: string) => {
      const normalized = normalizeAnswer(raw),
        aliases = this.card.aliases ?? {};
      const aliased = Object.entries(aliases).find(
        ([k]) => normalizeAnswer(k) === normalized,
      )?.[1];
      return this.card.answers?.find(
        (a: string) =>
          normalizeAnswer(a) === normalizeAnswer(String(aliased ?? raw)),
      );
    };
    const frequencies = new Map<string, number>();
    if (this.kind === "rare")
      for (const p of this.inputs.values()) {
        const key = canon(p.text!);
        if (key) frequencies.set(key, (frequencies.get(key) ?? 0) + 1);
      }
    this.rows = [...this.players.keys()].map((id) => {
      const input = this.inputs.get(id),
        later = this.later.get(id);
      let answer = "No answer",
        points = 0,
        distance: number | undefined;
      if (this.kind === "drawing") {
        const art = this.gallery.find((a) => a.authorId === id);
        answer = art ? `${art.votes} votes` : "No sketch";
        points = (art?.votes ?? 0) * 2;
      } else if (this.kind === "artist") {
        answer = later?.text ?? input?.text ?? answer;
        points = this.artistCorrect(input)
          ? 10
          : this.artistCorrect(later)
            ? 5
            : 0;
      } else if (input) {
        if (this.kind === "year") {
          distance = Math.abs(input.year! - this.card.year);
          answer = String(input.year);
          points = Math.max(0, 12 - 2 * Math.ceil(Math.log2(distance + 1)));
        } else if (this.kind === "world" || this.kind === "australia") {
          distance = kmBetween(
            input.lat!,
            input.lon!,
            this.card.lat,
            this.card.lon,
          );
          answer = `${Math.round(distance)} km away`;
          points = Math.max(
            0,
            12 - Math.floor(distance / (this.kind === "australia" ? 150 : 500)),
          );
        } else if (this.kind === "rapid") {
          const correct = input.checks!.filter(
            (v, i) => v === this.card.claims[i].real,
          ).length;
          answer = `${correct}/6 correct`;
          points = correct * 2 + (correct === 6 ? 3 : 0);
        } else if (this.kind === "sound") {
          answer =
            this.choiceOptions.find((o) => o.id === input.choiceId)?.text ??
            answer;
          points = input.choiceId === this.soundAnswer ? 10 : 0;
        } else {
          const key = canon(input.text!);
          answer = input.text!;
          points = key
            ? Math.max(1, 12 - 2 * Math.ceil(Math.log2(frequencies.get(key)!)))
            : 0;
        }
      }
      this.award(id, points);
      return {
        id,
        answer,
        points,
        ...(distance === undefined ? {} : { distance }),
      };
    });
    this.phase = "reveal";
  }
  advance(): "changed" | "lobby" {
    if (this.final) return "lobby";
    if (this.phase === "instructions") {
      this.phase = "allocate";
      return "changed";
    }
    if (this.phase !== "reveal")
      throw new GameError("wrong_phase", "Wait for answers or skip the timer.");
    if (this.round >= this.rounds) {
      this.end();
      return "changed";
    }
    this.round++;
    this.phase = "allocate";
    this.inputs.clear();
    this.later.clear();
    this.votes.clear();
    this.gallery = [];
    this.rows = [];
    this.prepareSound();
    return "changed";
  }
  remove(id: string) {
    super.remove(id);
    this.inputs.delete(id);
    this.later.delete(id);
    this.votes.delete(id);
    const removed = new Set(
      this.gallery.filter((g) => g.authorId === id).map((g) => g.id),
    );
    this.gallery = this.gallery.filter((g) => g.authorId !== id);
    for (const [player, vote] of this.votes)
      if (removed.has(vote)) this.votes.delete(player);
    this.rows = this.rows.filter((r) => r.id !== id);
  }
  artwork(id: string) {
    if (!["vote", "reveal"].includes(this.phase)) return null;
    return this.gallery.find((g) => g.id === id)?.strokes ?? null;
  }
  publicView() {
    const revealing = this.phase === "reveal",
      c = this.card;
    const prompt =
      this.kind === "year"
        ? c.text
        : this.kind === "artist"
          ? "Who is the music artist or act?"
          : this.kind === "world" || this.kind === "australia"
            ? `Put a pin on ${c.name}.`
            : this.kind === "drawing"
              ? c.text
              : this.kind === "rare"
                ? c.text
                : this.kind === "rapid"
                  ? "Real animal name, or something we invented?"
                  : "Listen to the four-note pattern. Which set of pitches matches?";
    const scenario: Scenario = {
      id: this.key,
      title: prompt,
      brief: prompt,
      projects: [
        {
          name: "Make your move",
          description: "Use your own controller.",
          symbol: "arcade",
        },
        {
          name: "Lock it in",
          description: "Submit one answer.",
          symbol: "arcade",
        },
        {
          name: "See the result",
          description: "Points appear after the reveal.",
          symbol: "arcade",
        },
      ],
    };
    const result: ArcadeView = { kind: this.kind, prompt, reveal: null };
    if (this.kind === "artist")
      result.clue = c.clues[this.phase === "vote" || revealing ? 1 : 0];
    if (this.kind === "drawing") {
      result.category = c.category;
      result.gallery =
        this.phase === "vote"
          ? this.gallery.map(({ id }) => ({ id }))
          : revealing
            ? this.gallery.map(({ id, authorId, votes }) => ({
                id,
                authorId,
                votes,
              }))
            : [];
    }
    if (this.kind === "rapid")
      result.claims = c.claims.map(
        ({ id, text }: { id: string; text: string }) => ({ id, text }),
      );
    if (this.kind === "sound") {
      result.notes = c.notes;
      result.choices = this.choiceOptions.map(({ id, text }) => ({ id, text }));
    }
    if (revealing)
      result.reveal = {
        answer:
          this.kind === "year"
            ? String(c.year)
            : this.kind === "world" || this.kind === "australia"
              ? `${c.name}, ${c.country}`
              : this.kind === "artist"
                ? c.name
                : this.kind === "rare"
                  ? "Less common valid answers earn more."
                  : this.kind === "sound"
                    ? this.choiceOptions.find((o) => o.id === this.soundAnswer)!
                        .text
                    : this.kind === "drawing"
                      ? "Two points per vote. No self-votes."
                      : "Two points per correct name, plus 3 for six out of six.",
        source: c.source,
        ...(this.kind === "world" || this.kind === "australia"
          ? {
              lat: c.lat,
              lon: c.lon,
              source: "https://www.naturalearthdata.com/",
            }
          : {}),
        rows: this.rows,
        ...(this.kind === "rapid"
          ? {
              checks: c.claims.map(
                ({ text, real }: { text: string; real: boolean }) => ({
                  text,
                  real,
                }),
              ),
            }
          : {}),
      };
    return {
      ...this.shell(
        this.key,
        scenario,
        this.phase === "vote"
          ? this.kind === "drawing"
            ? this.votes.size
            : this.players.size - this.waitingPlayers().length
          : this.inputs.size,
      ),
      arcade: result,
    };
  }
  privateView(id?: string): RoomView["private"] {
    if (!id || !this.hasPlayer(id)) return null;
    const submitted =
      this.phase === "vote"
        ? this.kind === "drawing"
          ? this.votes.has(id)
          : this.artistCorrect(this.inputs.get(id)) || this.later.has(id)
        : this.inputs.has(id);
    return {
      submitted,
      arcade: {
        submitted,
        canAnswer: this.input && !submitted,
        answer: (this.phase === "vote"
          ? (this.later.get(id) ?? this.inputs.get(id))
          : this.inputs.get(id)
        )?.text,
        choices:
          this.kind === "drawing" && this.phase === "vote"
            ? this.gallery.filter((a) => a.authorId !== id).map((a) => a.id)
            : undefined,
      },
    };
  }
}
