import React, { useState } from "react";
import type { KnowledgeRow, RoomView } from "../shared/types.js";
type Action = (event: string, data?: Record<string, unknown>) => Promise<void>;
interface Props {
  room: RoomView;
  locked: boolean;
  gameAction: Action;
}
function RoundPoints({ rows, room }: { rows: KnowledgeRow[]; room: RoomView }) {
  return (
    <div className="knowledge-results">
      {rows.map((r) => (
        <div key={r.id}>
          <strong>
            {room.players.find((p) => p.id === r.id)?.name ?? "Player"}
          </strong>
          <span>
            {r.quiz !== undefined
              ? `Trivia ${r.quiz ? "✓" : "missed"} · Repair ${r.repair ? "✓" : "missed"} · `
              : ""}
            +{r.points}
          </span>
        </div>
      ))}
    </div>
  );
}
export function KnowledgeGame({ room, locked, gameAction }: Props) {
  const g = room.game!,
    playing = !!room.playerId,
    reveal = g.phase === "reveal";
  const name = (id: string) =>
    room.players.find((p) => p.id === id)?.name ?? "Player";
  if (g.survival) {
    const s = g.survival,
      p = room.private?.survival;
    return (
      <section className="knowledge-board">
        <div className="blackout-goal">
          <strong>Goal: highest score after 6 rounds.</strong>
          <span>
            Trivia +2 · Repair puzzle +1 · Each battery unit left is +1 at the
            finish.
          </span>
          <small>
            Start with 3 battery units. Right trivia restores 1; miss both
            answers and lose 1. Everyone keeps playing at zero.
          </small>
        </div>
        <div className="charge-roster" aria-label="Battery bonus remaining">
          {s.charge.map((c) => (
            <span key={c.id} className={c.charge === 0 ? "charge-empty" : ""}>
              <strong>{name(c.id)}</strong> {c.charge}/3 battery bonus
              {c.charge === 0 ? " · backup mode" : ""}
            </span>
          ))}
        </div>
        <div className="turn-instruction">
          <span>
            {reveal
              ? "ROUND POINTS & BATTERY BONUS"
              : g.phase === "allocate"
                ? `${s.category.toUpperCase()} · ${s.difficulty.toUpperCase()} · 2 POINTS`
                : "REPAIR PUZZLE · 1 POINT"}
          </span>
          <h1>{reveal ? "Round complete." : s.question}</h1>
          <p>
            {reveal
              ? "Battery is a final score bonus, not an elimination counter. Most total points wins."
              : g.phase === "vote"
                ? !p
                  ? "Everyone solves a repair puzzle for 1 point. Players who missed trivia also need it to protect their battery bonus."
                  : p.atRisk
                    ? "Missed the trivia? Solve this puzzle for 1 point and keep your battery bonus. Miss both and lose 1 battery unit."
                    : "Trivia right! This puzzle is a chance to earn 1 more point."
                : "Tap one answer. It locks in immediately."}
          </p>
        </div>
        {reveal && s.answers ? (
          <div className="knowledge-reveal">
            <span className="eyebrow">THE ANSWERS</span>
            <h2>Trivia: {s.answers.quiz}</h2>
            <h2>Repair: {s.answers.repair}</h2>
            <p>{s.answers.explanation}</p>
            {s.answers.source && (
              <a href={s.answers.source} target="_blank" rel="noreferrer">
                Check the fact ↗
              </a>
            )}
            <RoundPoints rows={s.rows} room={room} />
          </div>
        ) : room.private?.submitted ? (
          <div className="party-waiting" role="status">
            <p>Answer locked in. Waiting for the others.</p>
          </div>
        ) : (
          <div className="knowledge-choices">
            {s.options.map((o, i) =>
              playing && p ? (
                <button
                  type="button"
                  className="knowledge-choice"
                  key={o.id}
                  disabled={locked}
                  onClick={() =>
                    gameAction(
                      g.phase === "allocate" ? "game:submit" : "game:vote",
                      { optionId: o.id },
                    )
                  }
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  <strong>{o.text}</strong>
                </button>
              ) : (
                <article className="knowledge-choice" key={o.id}>
                  <span>{String.fromCharCode(65 + i)}</span>
                  <strong>{o.text}</strong>
                </article>
              ),
            )}
          </div>
        )}
        {!reveal && (
          <p className="party-message" role="status">
            {g.submitted} of {g.eligible} answers in
            {!playing ? " · choose on your own phone or PC" : ""}
          </p>
        )}
      </section>
    );
  }
  if (!g.bluff) return null;
  const b = g.bluff,
    p = room.private?.bluff;
  return (
    <section className="knowledge-board">
      <div className="turn-instruction">
        <span>
          {reveal
            ? "THE REAL MEANING"
            : g.phase === "allocate"
              ? "SOUND CONVINCING"
              : "ONE IS REAL. ONE IS A BLUFF."}
        </span>
        <h1 className="odd-word">{b.term}</h1>
        <p>
          {reveal
            ? b.skipped
              ? "Round skipped by the host. No points awarded."
              : "The truth, the bluffs, and who believed them."
            : g.phase === "allocate"
              ? "What could it mean? Invent a short, believable definition."
              : "Tap the meaning you think is real. Your two choices are private."}
        </p>
      </div>
      {reveal ? (
        <div className="knowledge-reveal">
          <h2>{b.truth}</h2>
          <a href={b.source!} target="_blank" rel="noreferrer">
            Check the definition ↗
          </a>
          <div className="bluff-reveal">
            {b.options.map((o) => (
              <article key={o.id} className={o.truth ? "is-truth" : ""}>
                <strong>{o.text}</strong>
                <p>
                  {o.truth
                    ? "TRUE MEANING"
                    : o.authors.length
                      ? `Bluff by ${o.authors.map(name).join(" & ")}`
                      : "House bluff"}
                </p>
                <small>
                  {o.voters.length
                    ? `Picked by ${o.voters.map(name).join(", ")}`
                    : "No votes"}
                </small>
              </article>
            ))}
          </div>
          <RoundPoints rows={b.rows} room={room} />
        </div>
      ) : room.private?.submitted ? (
        <div className="party-waiting" role="status">
          <p>
            {g.phase === "allocate"
              ? "Your bluff is saved. Next you’ll spot the truth."
              : "Your choice is locked in. The reveal is next."}
          </p>
        </div>
      ) : playing && p ? (
        g.phase === "allocate" ? (
          <BluffForm
            key={`${g.id}-${g.round}`}
            seed={
              g.round + room.players.findIndex((p) => p.id === room.playerId)
            }
            locked={locked}
            gameAction={gameAction}
          />
        ) : (
          <div className="knowledge-choices bluff-duel">
            {p.options.map((o, i) => (
              <button
                type="button"
                className="knowledge-choice"
                key={o.id}
                disabled={locked}
                onClick={() => gameAction("game:vote", { optionId: o.id })}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                <strong>{o.text}</strong>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="party-waiting" role="status">
          <p>
            {g.phase === "allocate"
              ? "Players are writing their bluffs on their own screens."
              : "Players each see the truth beside someone else’s bluff."}
          </p>
        </div>
      )}
      {!reveal && (
        <p className="party-message" role="status">
          {g.submitted} of {g.eligible}{" "}
          {g.phase === "allocate" ? "bluffs" : "votes"} in
        </p>
      )}
      {room.role === "host" && !reveal && (
        <button
          className="button subtle small"
          disabled={locked}
          onClick={() => gameAction("game:advance")}
        >
          Skip round · no points
        </button>
      )}
    </section>
  );
}

const bluffExamples = [
  "A tiny umbrella used by garden gnomes",
  "The pause before pretending you heard someone",
  "A tool for straightening bent spaghetti",
  "A formal complaint made by a duck",
  "The last biscuit nobody admits to taking",
  "A special pocket for emergency cheese",
  "The smell of a freshly opened board game",
  "A polite word for a spectacularly bad haircut",
];
function BluffForm({
  seed,
  locked,
  gameAction,
}: {
  seed: number;
  locked: boolean;
  gameAction: Action;
}) {
  const [example, setExample] = useState(seed % bluffExamples.length);
  return (
    <form
      className="bluff-form"
      onSubmit={(event) => {
        event.preventDefault();
        const text = new FormData(event.currentTarget).get("bluff") as string;
        void gameAction("game:submit", { text });
      }}
    >
      <label htmlFor="bluff-meaning">Your made-up meaning</label>
      <textarea
        id="bluff-meaning"
        name="bluff"
        minLength={3}
        maxLength={80}
        rows={3}
        required
        disabled={locked}
        placeholder={bluffExamples[example]}
        autoComplete="off"
        aria-describedby="bluff-help"
      />
      <button
        type="button"
        className="button subtle small bluff-example"
        disabled={locked}
        onClick={() => setExample((example + 1) % bluffExamples.length)}
      >
        Different example
      </button>
      <p id="bluff-help">
        3–80 characters. Keep it made up—even if you know the real meaning.
        Examples are hints, not answers.
      </p>
      <button
        className="button primary large full bluff-submit"
        type="submit"
        disabled={locked}
      >
        Lock in my bluff
      </button>
    </form>
  );
}
