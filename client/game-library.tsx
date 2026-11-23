import React, { useEffect, useState } from "react";
import {
  Clock3,
  Globe2,
  MapPin,
  Bug,
  Paintbrush,
  Gem,
  Mic2,
  AudioLines,
  ArrowUpRight,
  Monitor,
  Smartphone,
  Users,
  Zap,
  MessageCircle,
  Layers,
  Hand,
  Sparkles,
  ArrowLeft,
  Play,
  Check,
  SkipForward,
} from "lucide-react";
import { games } from "../shared/games.js";
type Mode = "screen" | "phone" | "pass";
const icons = [Zap, MessageCircle, Layers, Hand, Sparkles];
const gameIcons: Record<string, typeof Zap> = {
  "time-tangle": Clock3,
  "world-wander": Globe2,
  "road-trip": MapPin,
  "creature-check": Bug,
  "odd-canvas": Paintbrush,
  "rare-find": Gem,
  "mic-check": Mic2,
  "echo-box": AudioLines,
};
const challenges = [
  "Name three things you would pack for a trip to the moon.",
  "Name three terrible names for a restaurant.",
  "Name three things a robot would complain about.",
  "Name three things that should never be inflatable.",
  "Name three excuses for arriving at a wedding in a canoe.",
  "Name three jobs a dragon would be good at.",
  "Name three things you would hate to find in your shoe.",
  "Name three things a pirate might keep in the fridge.",
  "Name three inventions that would make Mondays better.",
  "Name three terrible prizes for winning a race.",
  "Name three places you should never practise the trumpet.",
  "Name three things a ghost might be afraid of.",
  "Name three things that would make an awful birthday cake.",
  "Name three hobbies for a bored superhero.",
  "Name three things an alien would misunderstand about a supermarket.",
  "Name three bad places to hide a giraffe.",
  "Name three things a talking toaster would say.",
  "Name three rules for a school run by cats.",
  "Name three things you should never bring to a job interview.",
  "Name three terrible hotel room surprises.",
  "Name three things you could sell at a shop for giants.",
  "Name three reasons a wizard would need a refund.",
  "Name three things a detective would find in a penguin’s suitcase.",
  "Name three useless superpowers.",
];
export function GameLibrary({
  create,
  busy,
  navigate,
  code,
  setCode,
}: {
  create: (game?: string, phone?: boolean) => void;
  busy: boolean;
  navigate: (path: string) => void;
  code: string;
  setCode: (value: string) => void;
}) {
  const [moreGames, setMoreGames] = useState(false);
  const [mode, setMode] = useState<Mode>("screen"),
    [local, setLocal] = useState(false);
  if (local) return <PocketCircuit back={() => setLocal(false)} />;
  return (
    <main className="game-library">
      <section className="library-hero">
        <div>
          <p className="eyebrow">YOUR PEOPLE. YOUR GAME NIGHT.</p>
          <h1>
            A little competitive.
            <br />
            <span>A lot of fun.</span>
          </h1>
          <p>Pick a game. Grab your people. Get straight to the good part.</p>
          <div className="library-facts">
            <span>
              <Users size={16} />
              Bring the whole group
            </span>
            <span>No accounts</span>
            <span>Phones & PCs welcome</span>
          </div>
        </div>
        <form
          className="quick-join"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/join?code=${code}`);
          }}
        >
          <span className="eyebrow">GOT AN INVITE?</span>
          <h2>Jump into a room.</h2>
          <label htmlFor="quick-code">Room code</label>
          <div>
            <input
              id="quick-code"
              placeholder="ABC234"
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={6}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""))
              }
            />
            <button aria-label="Join room" disabled={code.length !== 6}>
              <ArrowUpRight />
            </button>
          </div>
          <small>Or scan the QR code on the host’s screen.</small>
        </form>
      </section>
      <div className="library-heading">
        <div>
          <p className="eyebrow">MAKE YOURSELF AT HOME</p>
          <h2>How are we playing?</h2>
        </div>
        <a href="/screen">
          <Monitor size={18} />
          Connect this screen
        </a>
      </div>
      <div
        className="setup-tabs"
        role="tablist"
        aria-label="Game setup"
        onKeyDown={(e) => {
          const order: Mode[] = ["screen", "phone", "pass"],
            index = order.indexOf(mode);
          const next =
            e.key === "ArrowRight"
              ? order[(index + 1) % 3]
              : e.key === "ArrowLeft"
                ? order[(index + 2) % 3]
                : e.key === "Home"
                  ? order[0]
                  : e.key === "End"
                    ? order[2]
                    : null;
          if (next) {
            e.preventDefault();
            setMode(next);
            document.getElementById(`tab-${next}`)?.focus();
          }
        }}
      >
        {(
          [
            {
              id: "screen",
              icon: Monitor,
              title: "Shared screen",
              note: "TV or PC + controllers",
            },
            {
              id: "phone",
              icon: Smartphone,
              title: "Host on phone",
              note: "Everyone uses their own device",
            },
            {
              id: "pass",
              icon: Hand,
              title: "Pass one phone",
              note: "One device. Everyone together.",
            },
          ] as const
        ).map((m) => (
          <button
            role="tab"
            aria-selected={mode === m.id}
            tabIndex={mode === m.id ? 0 : -1}
            aria-controls="game-panel"
            id={`tab-${m.id}`}
            key={m.id}
            onClick={() => setMode(m.id)}
          >
            <m.icon />
            <span>
              <strong>{m.title}</strong>
              <small>{m.note}</small>
            </span>
            <b>{mode === m.id ? "●" : "○"}</b>
          </button>
        ))}
      </div>
      <section id="game-panel" role="tabpanel" aria-labelledby={`tab-${mode}`}>
        <p className="setup-description">
          {mode === "screen"
            ? "The big screen shows the action. Players answer privately on a phone or another PC. Pair a TV browser from the lobby."
            : mode === "phone"
              ? "Create the room on your phone and join as a player automatically. Friends connect on their own phones or PCs. A big screen is optional."
              : "No room code or Wi-Fi needed once this page is loaded. Pass one phone around and play out loud."}
        </p>
        <div className="library-grid">
          {mode === "pass" ? (
            <article className="library-card pocket-card">
              <div className="game-art art-5">
                <Hand />
                <span>
                  THINK
                  <br />
                  FAST.
                </span>
              </div>
              <div className="game-card-copy">
                <div className="game-meta">
                  3–12 people · 4–8 min · One phone
                </div>
                <h2>Pocket Circuit</h2>
                <p>
                  Three answers. Twenty seconds. A very questionable
                  imagination.
                </p>
                <details>
                  <summary>How to play</summary>
                  <p>
                    Take turns naming three answers to a ridiculous challenge.
                    The group decides if they count. Complete it for 2 points;
                    pass for 0. Two turns each, highest score wins.
                  </p>
                </details>
                <button
                  className="button primary"
                  onClick={() => setLocal(true)}
                >
                  Play on this phone
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </article>
          ) : (
            games
              .filter((g) => !g.hidden && (g.featured || moreGames))
              .map((g, i) => {
                const Icon = gameIcons[g.id] ?? icons[i % icons.length];
                return (
                  <article
                    className={`library-card card-${g.color}`}
                    key={g.id}
                  >
                    <div className={`game-art art-${i % 5}`} aria-hidden="true">
                      <Icon />
                      <span>{g.title.toUpperCase()}</span>
                      <i>0{i + 1}</i>
                    </div>
                    <div className="game-card-copy">
                      <div className="game-meta">
                        {g.minPlayers}+ players · {g.minutes}
                      </div>
                      <h2>{g.title}</h2>
                      <p>{g.tagline}</p>
                      <details>
                        <summary>How to play</summary>
                        <ol>
                          {g.steps.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ol>
                      </details>
                      <button
                        className="button primary"
                        disabled={busy}
                        onClick={() => create(g.id, mode === "phone")}
                      >
                        Host this game
                        <ArrowUpRight size={18} />
                      </button>
                    </div>
                  </article>
                );
              })
          )}
        </div>
      </section>
      {mode !== "pass" && (
        <button
          className="button subtle full"
          style={{ marginTop: 24 }}
          onClick={() => setMoreGames((v) => !v)}
        >
          {moreGames
            ? "Show the new collection"
            : "More games · the original five"}
        </button>
      )}
      <p className="library-bottom">
        Your room, your pace. Change games from the lobby without making
        everyone rejoin.
      </p>
    </main>
  );
}
export function PocketCircuit({ back }: { back: () => void }) {
  const [count, setCount] = useState(4),
    [turn, setTurn] = useState(0),
    [scores, setScores] = useState<number[]>([]),
    [phase, setPhase] = useState<"setup" | "handoff" | "play" | "result">(
      "setup",
    ),
    [seconds, setSeconds] = useState(20),
    [paused, setPaused] = useState(false),
    [deadline, setDeadline] = useState(0),
    [deck, setDeck] = useState<string[]>([]);
  useEffect(() => {
    if (phase !== "play" || paused || seconds === 0) return;
    const t = setTimeout(
      () => setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))),
      200,
    );
    return () => clearTimeout(t);
  }, [phase, paused, seconds, deadline]);
  const finish = (points: number) => {
    setScores((s) =>
      s.map((score, i) => (i === turn % count ? score + points : score)),
    );
    setTurn((t) => t + 1);
    setPhase(turn + 1 >= count * 2 ? "result" : "handoff");
    setSeconds(20);
    setPaused(false);
  };
  return (
    <main className="pocket-game">
      <button className="button subtle" onClick={back}>
        <ArrowLeft size={18} />
        Game library
      </button>
      <p className="eyebrow">PASS ONE PHONE</p>
      <h1>Pocket Circuit</h1>
      {phase === "setup" ? (
        <>
          <p>
            Name three answers before 20 seconds run out. Your friends decide if
            they count. Two turns each; 2 points for a completed challenge, 0
            for a pass. Ties share the win.
          </p>
          <label htmlFor="pocket-count">How many people?</label>
          <select
            id="pocket-count"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          >
            {Array.from({ length: 10 }, (_, i) => i + 3).map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <button
            className="button primary large"
            onClick={() => {
              setScores(Array(count).fill(0));
              setTurn(0);
              const next = [...challenges];
              for (let i = next.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [next[i], next[j]] = [next[j], next[i]];
              }
              setDeck(next);
              setPhase("handoff");
            }}
          >
            Let’s play
            <Play size={20} />
          </button>
        </>
      ) : phase === "result" ? (
        <>
          <h2>
            {scores
              .map((s, i) =>
                s === Math.max(...scores) ? `Player ${i + 1}` : null,
              )
              .filter(Boolean)
              .join(" & ")}{" "}
            wins!
          </h2>
          <div className="pocket-scores">
            {scores.map((s, i) => (
              <p key={i}>
                Player {i + 1}
                <strong>{s} points</strong>
              </p>
            ))}
          </div>
          <button className="button primary" onClick={() => setPhase("setup")}>
            Play again
          </button>
        </>
      ) : phase === "handoff" ? (
        <>
          <p>
            Turn {turn + 1} of {count * 2}
          </p>
          <h2>Pass to Player {(turn % count) + 1}.</h2>
          <p>
            When you’re holding the phone, reveal your challenge. Your time
            starts immediately.
          </p>
          <button
            className="button primary large"
            onClick={() => {
              setPhase("play");
              setSeconds(20);
              setDeadline(Date.now() + 20000);
            }}
          >
            I’m ready
            <Play size={20} />
          </button>
        </>
      ) : (
        <>
          <p>Player {(turn % count) + 1} · Name three…</p>
          <h2 className="pocket-challenge">{deck[turn % deck.length]}</h2>
          <strong className="pocket-timer" role="timer">
            {seconds}s
          </strong>
          {seconds === 0 ? (
            <p role="status">
              Time! The group decides: did they get all three?
            </p>
          ) : (
            <button
              className="button subtle"
              onClick={() => {
                if (paused) setDeadline(Date.now() + seconds * 1000);
                setPaused((p) => !p);
              }}
            >
              {paused ? "Resume" : "Pause"}
            </button>
          )}
          <div className="button-row">
            <button
              className="button primary large"
              disabled={paused}
              onClick={() => finish(2)}
            >
              <Check />
              Got all three · +2
            </button>
            <button className="button subtle large" onClick={() => finish(0)}>
              <SkipForward />
              Pass · 0
            </button>
          </div>
        </>
      )}
    </main>
  );
}
