import React, { useEffect, useState } from "react";
import {
  Check,
  CheckCheck,
  Clock3,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  X,
} from "lucide-react";
import type { RoomView, GameView } from "../shared/types.js";
import { games as catalogue } from "../shared/games.js";
import { KnowledgeGame } from "./knowledge-games.js";
type Action = (event: string, data?: Record<string, unknown>) => Promise<void>;
export interface PartyProps {
  room: RoomView;
  busy: boolean;
  gameAction: Action;
  end: () => void;
}
export function GameClock({
  game,
  serverNow,
}: {
  game: GameView;
  serverNow: number;
}) {
  const [now, setNow] = useState(Date.now());
  const [offset, setOffset] = useState(serverNow - Date.now());
  useEffect(() => setOffset(serverNow - Date.now()), [serverNow]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const left = game.paused
    ? game.remainingMs
    : game.deadline === null
      ? null
      : Math.max(0, game.deadline - now - offset);
  return (
    <span
      className={`timer ${left !== null && left < 10000 ? "timer-urgent" : ""}`}
    >
      <Clock3 size={18} />
      {left === null
        ? "No rush"
        : `${Math.floor(Math.ceil(left / 1000) / 60)}:${String(Math.ceil(left / 1000) % 60).padStart(2, "0")}`}
    </span>
  );
}
function Waiting({ children }: { children: React.ReactNode }) {
  return (
    <div className="party-waiting" role="status">
      <CheckCheck size={28} />
      <p>{children}</p>
    </div>
  );
}
export function PartyGame({ room, busy, gameAction, end }: PartyProps) {
  const g = room.game!,
    meta = catalogue.find((x) => x.id === g.gameKey)!,
    host = room.role === "host",
    playing = !!room.playerId;
  const [help, setHelp] = useState(false);
  const locked = busy || g.paused;
  const advance = () => gameAction("game:advance");
  const names = (id: string) =>
    room.players.find((p) => p.id === id)?.name ?? "Player";
  const phase =
    g.phase === "instructions"
      ? "How to play"
      : g.phase === "final"
        ? "Final scores"
        : g.phase === "reveal"
          ? "Round result"
          : g.cards
            ? g.phase === "allocate"
              ? "Play one card"
              : "Judge picks a winner"
            : g.charades
              ? g.phase === "allocate"
                ? "Get ready"
                : "Give clues & guess"
              : g.survival
                ? g.phase === "allocate"
                  ? "Answer trivia"
                  : "Quick repair"
                : g.bluff
                  ? g.phase === "allocate"
                    ? "Write a bluff"
                    : "Spot the truth"
                  : "Pick one favourite";
  return (
    <main
      className={`party-game party-${g.gameKey} ${playing ? "is-controller" : "is-display"}`}
    >
      <div className="game-top">
        <div className="game-title">
          <p className="eyebrow">{meta.title.toUpperCase()}</p>
          <div>
            <span className="round-pill">
              {g.charades ? "TURN" : "ROUND"} {g.round} / {g.rounds}
            </span>
            <span className="phase-label">{phase}</span>
          </div>
        </div>
        <div className="game-tools">
          {g.phase !== "instructions" && g.phase !== "final" && (
            <GameClock game={g} serverNow={room.now} />
          )}
          <button
            className="button subtle small"
            onClick={() => setHelp(!help)}
          >
            {help ? "Hide rules" : "Rules"}
          </button>
          {host && (
            <>
              <button
                className="button subtle small"
                disabled={busy || !["allocate", "vote"].includes(g.phase)}
                onClick={() =>
                  gameAction(g.paused ? "game:resume" : "game:pause")
                }
              >
                {g.paused ? <Play size={16} /> : <Pause size={16} />}{" "}
                {g.paused ? "Resume" : "Pause"}
              </button>
              <button
                className="button subtle small"
                disabled={busy}
                onClick={end}
              >
                End game
              </button>
            </>
          )}
        </div>
      </div>
      <div className="controller-role">
        <Users size={17} />
        {playing
          ? `You’re playing as ${names(room.playerId!)}${host ? " · host controls stay above" : ""}`
          : "Shared display · players use their own phones or PCs"}
      </div>
      {g.paused && (
        <div className="notice pause-notice" role="status">
          <Pause size={20} />
          <div>
            <strong>{g.pauseReason}</strong>
            <p>The timer and choices are paused. Your move is saved.</p>
          </div>
        </div>
      )}
      {(help || g.phase === "instructions") && (
        <section className="quick-rules">
          <p className="eyebrow">THAT’S THE WHOLE GAME</p>
          <h1>{meta.tagline}</h1>
          <ol>
            {meta.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p>
            {g.charades
              ? "Big Got it and Pass buttons work on every device. No motion permissions or app needed."
              : g.cards
                ? "Your five cards are private. Only the played cards are revealed."
                : g.survival
                  ? "Everyone stays in, even at zero charge. Scores bank when both stages finish; the charge bonus is awarded when the host finishes round six."
                  : g.bluff
                    ? "Other players never see who wrote a bluff until the reveal. Matching bluffs share the credit. Missing answers abstain."
                    : "No budgets. No predictions. Just tap one project."}
          </p>
          {g.phase === "instructions" &&
            (host ? (
              <button
                className="button primary large full"
                disabled={busy}
                onClick={advance}
              >
                <Play size={20} />{" "}
                {g.charades ? "Start first turn" : "Start first round"}
              </button>
            ) : (
              <Waiting>
                The host will tap <strong>Start first round</strong>. Your
                controls appear next.
              </Waiting>
            ))}
        </section>
      )}
      {g.phase === "final" ? (
        <section className="party-final">
          <Trophy className="big-trophy" size={62} />
          <p className="eyebrow">ONE MORE GAME?</p>
          <h1>Good game, everyone.</h1>
          <Scores room={room} />
          {host ? (
            <button
              className="button primary large full"
              disabled={busy}
              onClick={advance}
            >
              <RotateCcw size={20} /> Choose another game
            </button>
          ) : (
            <Waiting>Your host can choose another game.</Waiting>
          )}
        </section>
      ) : (
        g.phase !== "instructions" && (
          <>
            {(g.survival || g.bluff) && (
              <KnowledgeGame
                room={room}
                locked={locked}
                gameAction={gameAction}
              />
            )}
            {g.cards && (
              <section className="cards-board">
                <div className="turn-instruction">
                  <span>
                    {g.phase === "reveal"
                      ? "THE RESULT"
                      : g.cards.judgeId === room.playerId
                        ? "YOU ARE THE JUDGE"
                        : `${names(g.cards.judgeId).toUpperCase()} IS JUDGING`}
                  </span>
                  <h1>
                    {g.phase === "reveal"
                      ? g.cards.winnerId
                        ? `${names(g.cards.winnerId)} wins 1 point!`
                        : "Next round, fresh cards."
                      : g.phase === "allocate"
                        ? room.private?.cards?.isJudge
                          ? "Wait for the cards. You’ll pick your favourite."
                          : playing
                            ? "Tap one card to fill the blank."
                            : "Everyone plays one card on their own screen."
                        : room.private?.cards?.isJudge
                          ? "Tap the funniest answer to choose the winner."
                          : `${names(g.cards.judgeId)} is picking a favourite.`}
                  </h1>
                </div>
                <div className="sentence-card">
                  <span>FILL THE BLANK</span>
                  <p>{g.cards.prompt}</p>
                </div>
                {g.phase === "allocate" &&
                  (playing && room.private?.cards ? (
                    room.private.cards.isJudge ? (
                      <Waiting>
                        You don’t play a card when you’re judging. Waiting for{" "}
                        {g.eligible - g.submitted} more.
                      </Waiting>
                    ) : room.private.submitted ? (
                      <Waiting>
                        Your card is played. Waiting for the others.
                      </Waiting>
                    ) : (
                      <div className="hand-area">
                        <h2>
                          Your hand <span>Tap one to play</span>
                        </h2>
                        <div className="hand-cards">
                          {room.private.cards.hand.map((card) => (
                            <button
                              type="button"
                              className="answer-card"
                              key={card.id}
                              disabled={locked}
                              onClick={() =>
                                gameAction("game:submit", { cardId: card.id })
                              }
                            >
                              <span>{card.text}</span>
                              <small>Play this card</small>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  ) : (
                    <Waiting>
                      {g.submitted} of {g.eligible} cards played. The answers
                      stay hidden until judging.
                    </Waiting>
                  ))}
                {(g.phase === "vote" || g.phase === "reveal") && (
                  <div className="played-cards">
                    {g.cards.options.map((card) =>
                      room.private?.cards?.isJudge && g.phase === "vote" ? (
                        <button
                          type="button"
                          className="answer-card judge-choice"
                          key={card.id}
                          disabled={locked}
                          onClick={() =>
                            gameAction("game:vote", { cardId: card.id })
                          }
                        >
                          <span>{card.text}</span>
                          <small>
                            <Trophy size={16} /> Pick this winner
                          </small>
                        </button>
                      ) : (
                        <article
                          className={`answer-card ${card.authorId === g.cards!.winnerId ? "winning-card" : ""}`}
                          key={card.id}
                        >
                          <span>{card.text}</span>
                          <small>
                            {g.phase === "reveal"
                              ? `${names(card.authorId!)}${card.authorId === g.cards!.winnerId ? " · +1 point" : ""}`
                              : "Anonymous answer"}
                          </small>
                        </article>
                      ),
                    )}
                  </div>
                )}
                {g.cards.message && (
                  <p className="party-message">{g.cards.message}</p>
                )}
              </section>
            )}
            {g.crowd && (
              <section className="crowd-board">
                <div className="turn-instruction">
                  <span>
                    {g.phase === "reveal"
                      ? "THE ROOM HAS CHOSEN"
                      : "ONE TAP IS YOUR WHOLE MOVE"}
                  </span>
                  <h1>{g.scenario.brief}</h1>
                  <p>
                    {g.phase === "reveal"
                      ? "Voters for the winning project get 1 point."
                      : room.private?.submitted
                        ? "Your choice is saved."
                        : "Tap the project you think the room will love."}
                  </p>
                </div>
                {g.phase === "allocate" && room.private?.submitted ? (
                  <Waiting>
                    <strong>
                      {g.scenario.projects[room.private.crowd!.choice!].name}
                    </strong>{" "}
                    is locked in. Waiting for the others.
                  </Waiting>
                ) : (
                  <div className="simple-projects">
                    {g.scenario.projects.map((p, i) =>
                      playing && g.phase === "allocate" ? (
                        <button
                          className={`simple-project project-${["coral", "violet", "lime"][i]}`}
                          key={p.name}
                          disabled={locked}
                          onClick={() =>
                            gameAction("game:submit", { project: i })
                          }
                        >
                          <span className="project-badge">
                            {["A", "B", "C"][i]}
                          </span>
                          <h2>{p.name}</h2>
                          <p>{p.description}</p>
                          <strong>Pick this one</strong>
                        </button>
                      ) : (
                        <article
                          className={`simple-project project-${["coral", "violet", "lime"][i]} ${g.crowd!.winners.includes(i) ? "project-winner" : ""}`}
                          key={p.name}
                        >
                          <span className="project-badge">
                            {["A", "B", "C"][i]}
                          </span>
                          <h2>{p.name}</h2>
                          <p>{p.description}</p>
                          {g.phase === "reveal" ? (
                            <strong>
                              {g.crowd!.totals[i]} votes{" "}
                              {g.crowd!.winners.includes(i) ? "· Winner!" : ""}
                            </strong>
                          ) : (
                            <strong>Choose on your own phone</strong>
                          )}
                        </article>
                      ),
                    )}
                  </div>
                )}
                {g.phase === "allocate" && (
                  <p className="party-message">
                    {g.submitted} of {g.eligible} choices in
                  </p>
                )}
              </section>
            )}
            {g.charades && (
              <section className="clues-board">
                <div className="turn-instruction">
                  <span>
                    {room.private?.charades?.isGuesser
                      ? "YOUR TURN TO GUESS"
                      : `${g.charades.guesserName.toUpperCase()} IS GUESSING`}
                  </span>
                  <h1>
                    {g.phase === "reveal"
                      ? `${g.charades.correct} guessed!`
                      : g.phase === "allocate"
                        ? `${g.charades.guesserName}, hold your phone facing your friends.`
                        : playing
                          ? room.private?.charades?.isGuesser
                            ? "Don’t peek. Listen to your friends!"
                            : "Describe this word without saying it."
                          : "Give clues from your own phone."}
                  </h1>
                  <p>
                    {g.phase === "allocate"
                      ? "The timer starts only when the guesser taps I’m ready."
                      : g.phase === "vote"
                        ? "Any player can tap Got it or Pass. A word is counted only once."
                        : `${g.charades.passed} passed · correct guesses earn 1 point each`}
                  </p>
                </div>
                {g.phase === "allocate" &&
                  (room.private?.charades?.isGuesser ? (
                    <button
                      className="button primary large full ready-button"
                      disabled={locked}
                      onClick={() =>
                        gameAction("game:submit", { action: "ready" })
                      }
                    >
                      <Play size={24} /> I’m ready — show the word
                    </button>
                  ) : (
                    <Waiting>
                      Waiting for {g.charades.guesserName} to tap{" "}
                      <strong>I’m ready</strong>.
                    </Waiting>
                  ))}
                {g.phase === "vote" &&
                  (playing && room.private?.charades ? (
                    <>
                      <div
                        className={`clue-word ${room.private.charades.isGuesser ? "forehead-word" : ""}`}
                      >
                        <span>
                          {room.private.charades.isGuesser
                            ? "SHOW THIS SCREEN TO YOUR FRIENDS"
                            : "GIVE CLUES FOR"}
                        </span>
                        <strong>{room.private.charades.word}</strong>
                        <small>
                          <Volume2 size={17} /> Speak your clues out loud
                        </small>
                      </div>
                      <div className="clue-actions">
                        <button
                          type="button"
                          className="button clue-pass"
                          disabled={locked}
                          onClick={() =>
                            gameAction("game:submit", {
                              action: "pass",
                              wordId: room.private!.charades!.wordId,
                            })
                          }
                        >
                          <X size={24} /> Pass
                        </button>
                        <button
                          type="button"
                          className="button primary clue-correct"
                          disabled={locked}
                          onClick={() =>
                            gameAction("game:submit", {
                              action: "correct",
                              wordId: room.private!.charades!.wordId,
                            })
                          }
                        >
                          <Check size={26} /> Got it!
                        </button>
                      </div>
                      <p className="party-message">
                        {g.charades.correct} correct · {g.charades.passed}{" "}
                        passed
                      </p>
                    </>
                  ) : (
                    <div className="shared-clues">
                      <Users size={50} />
                      <strong>{g.charades.correct} correct</strong>
                      <p>
                        The word is on player screens, so the shared display
                        won’t spoil it.
                      </p>
                    </div>
                  ))}
                {g.phase === "reveal" && (
                  <div className="clue-history">
                    {g.charades.history.length ? (
                      g.charades.history.map((h, i) => (
                        <div key={i}>
                          <span>{h.word}</span>
                          {h.correct ? (
                            <strong>
                              <Check size={18} /> Got it
                            </strong>
                          ) : (
                            <span>
                              <X size={18} /> Passed
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p>
                        No words completed this turn. There’s always the next
                        one.
                      </p>
                    )}
                  </div>
                )}
                {host && g.phase === "vote" && (
                  <button
                    className="button subtle full"
                    disabled={busy}
                    onClick={advance}
                  >
                    Finish this turn early
                  </button>
                )}
              </section>
            )}
            {g.phase === "reveal" && (
              <section className="party-round-result">
                <Scores room={room} />
                {host ? (
                  <button
                    className="button primary large full"
                    disabled={busy}
                    onClick={advance}
                  >
                    <Play size={20} />{" "}
                    {g.round >= g.rounds ? "See final scores" : "Next round"}
                  </button>
                ) : (
                  <Waiting>The host will start the next round.</Waiting>
                )}
              </section>
            )}
          </>
        )
      )}
    </main>
  );
}
function Scores({ room }: { room: RoomView }) {
  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  return (
    <div className="simple-scores" aria-label="Scores">
      {sorted.map((p, i) => (
        <div className={p.id === room.playerId ? "your-score" : ""} key={p.id}>
          <span>{i + 1}</span>
          <strong>
            {p.name}
            {p.id === room.playerId ? " (you)" : ""}
          </strong>
          <b>
            {p.score}
            <small> points</small>
          </b>
        </div>
      ))}
    </div>
  );
}
