import { z } from "zod";
import type { KnowledgeRow, RoomView } from "../../shared/types.js";
import { GameError, type GameOptions } from "./core.js";
import { SimpleGame } from "./simple-base.js";
import { trivia, repairQuestion } from "./knowledge-content.js";
import { questionOptions, scenario } from "./knowledge-base.js";
const choiceSchema = z.object({ optionId: z.string().uuid() }).strict();
export class SurvivalGame extends SimpleGame {
  private deck = this.buildDeck();
  private buildDeck() {
    const mode = this.context.settings?.difficulty ?? "mixed";
    const levels =
      mode === "mixed"
        ? ["medium", "medium", "medium", "hard", "hard", "hard"]
        : Array(6).fill(mode);
    const fresh = this.unused("trivia", trivia, (q) => q.question);
    const plan = (index: number, used: Set<string>): typeof trivia | null => {
      if (index === 6) return [];
      const subjects = this.mixed([
        ...new Set(
          fresh
            .filter(
              (q) => q.difficulty === levels[index] && !used.has(q.category!),
            )
            .map((q) => q.category!),
        ),
      ]);
      for (const subject of subjects) {
        const q = this.mixed(
          fresh.filter(
            (q) => q.category === subject && q.difficulty === levels[index],
          ),
        )[0];
        const rest = plan(index + 1, new Set([...used, subject]));
        if (rest) return [q, ...rest];
      }
      return null;
    };
    const deck = plan(0, new Set());
    if (!deck)
      throw new GameError(
        "content_exhausted",
        "Not enough fresh trivia subjects at this difficulty. Change difficulty or reset used content in the lobby.",
      );
    deck.forEach((q) => this.seen("trivia", q.question));
    return deck;
  }
  private repairs = this.reserve(
    "repairs",
    Array.from({ length: 120 }, (_, seed) => repairQuestion(seed)),
    6,
    (q) => q.question,
  );
  private reports = new Map<string, string>();
  feedback(id: string, reason: string) {
    if (this.phase !== "reveal" || !this.hasPlayer(id))
      throw new GameError(
        "wrong_phase",
        "Give feedback during the answer reveal.",
      );
    if (!["too_easy", "too_hard", "ambiguous", "incorrect"].includes(reason))
      throw new GameError("invalid_input", "Choose a feedback reason.");
    if (this.reports.has(`${this.round}:${id}`))
      throw new GameError("already_reported", "Your feedback is saved.");
    this.reports.set(`${this.round}:${id}`, reason);
  }
  private quizOptions = this.deck.map((q) => this.mixed(questionOptions(q)));
  private repairOptions = this.repairs.map((q) =>
    this.mixed(questionOptions(q)),
  );
  private quiz = new Map<string, string>();
  private repair = new Map<string, string>();
  private charge = new Map<string, number>();
  private rows: KnowledgeRow[] = [];
  private bonus = false;
  constructor(
    players: { id: string; name: string }[],
    options: GameOptions = {},
  ) {
    super(players, 6, options);
    players.forEach((p) => this.charge.set(p.id, 3));
  }
  private get index() {
    return this.round - 1;
  }
  private correct(id: string, repair = false) {
    const opts = repair
      ? this.repairOptions[this.index]
      : this.quizOptions[this.index];
    const q = repair ? this.repairs[this.index] : this.deck[this.index];
    return (
      opts.find((o) => o.id === (repair ? this.repair : this.quiz).get(id))
        ?.text === q.answer
    );
  }
  duration(base: number) {
    return !this.input || base === 0
      ? null
      : (this.phase === "allocate" ? 20 : 15) * (base === 90 ? 2 : 1) * 1000;
  }
  submit(id: string, action: "submit" | "vote", payload: unknown) {
    if (!this.hasPlayer(id))
      throw new GameError("not_playing", "Join the next game to play.");
    if (
      !this.input ||
      action !== (this.phase === "allocate" ? "submit" : "vote")
    )
      throw new GameError("wrong_phase", "This question has finished.");
    const p = choiceSchema.safeParse(payload),
      options =
        this.phase === "allocate"
          ? this.quizOptions[this.index]
          : this.repairOptions[this.index];
    if (!p.success || !options.some((o) => o.id === p.data.optionId))
      throw new GameError("invalid_input", "Tap one of the four answers.");
    const choices = this.phase === "allocate" ? this.quiz : this.repair;
    if (choices.has(id))
      throw new GameError("already_submitted", "Your answer is locked in.");
    choices.set(id, p.data.optionId);
  }
  complete(timeout: boolean) {
    if (!this.input) return false;
    const choices = this.phase === "allocate" ? this.quiz : this.repair;
    if (!timeout && choices.size < this.players.size) return false;
    if (this.phase === "allocate") this.phase = "vote";
    else {
      this.rows = [...this.players.keys()].map((id) => {
        const quiz = this.correct(id),
          repair = this.correct(id, true),
          points = (quiz ? 2 : 0) + (repair ? 1 : 0);
        const before = this.charge.get(id) ?? 3;
        this.charge.set(
          id,
          Math.max(0, Math.min(3, before + (quiz ? 1 : repair ? 0 : -1))),
        );
        this.award(id, points);
        return {
          id,
          quiz,
          repair,
          points,
          chargeBefore: before,
          chargeAfter: this.charge.get(id)!,
        };
      });
      this.phase = "reveal";
    }
    return true;
  }
  advance(): "changed" | "lobby" {
    if (this.final) return "lobby";
    if (this.phase === "instructions") this.phase = "allocate";
    else if (this.phase === "reveal") {
      if (this.round === this.rounds) {
        if (!this.bonus) {
          for (const [id, charge] of this.charge) this.award(id, charge);
          this.bonus = true;
        }
        this.end();
      } else {
        this.round++;
        this.quiz.clear();
        this.repair.clear();
        this.rows = [];
        this.phase = "allocate";
      }
    } else
      throw new GameError("wrong_phase", "Wait for the answers or the timer.");
    return "changed";
  }
  end() {
    this.quiz.clear();
    this.repair.clear();
    this.rows = [];
    super.end();
  }
  remove(id: string) {
    super.remove(id);
    this.quiz.delete(id);
    this.repair.delete(id);
    this.charge.delete(id);
    this.rows = this.rows.filter((r) => r.id !== id);
  }
  publicView() {
    const revealed = this.phase === "reveal",
      q =
        this.phase === "vote"
          ? this.repairs[this.index]
          : this.deck[this.index];
    return {
      ...this.shell(
        "blackout-run",
        scenario("Keep the lights on", q.question),
        (this.phase === "vote" ? this.repair : this.quiz).size,
      ),
      survival: {
        question: q.question,
        difficulty: this.deck[this.index].difficulty!,
        category: this.deck[this.index].category!,
        options:
          this.phase === "vote"
            ? this.repairOptions[this.index]
            : this.quizOptions[this.index],
        charge: [...this.charge].map(([id, charge]) => ({ id, charge })),
        answers: revealed
          ? {
              quizQuestion: this.deck[this.index].question,
              repairQuestion: this.repairs[this.index].question,
              quiz: this.deck[this.index].answer,
              repair: this.repairs[this.index].answer,
              explanation: `${this.deck[this.index].explanation} Repair: ${this.repairs[this.index].explanation}`,
              source: this.deck[this.index].source,
            }
          : null,
        feedback: revealed
          ? ["too_easy", "too_hard", "ambiguous", "incorrect"].map(
              (reason) => ({
                reason,
                count: [...this.reports].filter(
                  ([key, r]) =>
                    key.startsWith(`${this.round}:`) && r === reason,
                ).length,
              }),
            )
          : [],
        rows: revealed ? this.rows : [],
      },
    };
  }
  privateView(id?: string): RoomView["private"] {
    if (!id || !this.hasPlayer(id)) return null;
    const choice =
      (this.phase === "vote" ? this.repair : this.quiz).get(id) ?? null;
    return {
      submitted: choice !== null,
      survival: {
        choice,
        feedback: this.reports.get(`${this.round}:${id}`) ?? null,
        atRisk: this.phase === "vote" ? !this.correct(id) : null,
      },
    };
  }
}
