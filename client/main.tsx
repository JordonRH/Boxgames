import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import QRCode from "qrcode";
import {
  Box,
  Monitor,
  Smartphone,
  Users,
  Sparkles,
  Plus,
  Minus,
  Check,
  X,
  Copy,
  Lock,
  Unlock,
  Play,
  Pause,
  LogOut,
  RotateCcw,
  Trophy,
  WifiOff,
  VolumeX,
  ScanLine,
  CircleHelp,
  Clock3,
  ChevronDown,
  PartyPopper,
  Orbit,
  Layers,
  Radio,
  Settings2,
  CheckCheck,
} from "lucide-react";
import type {
  Ack,
  RoomView,
  Session,
  Triple,
  GameView,
} from "../shared/types.js";
import "./style.css";
import "./party.css";
import { PartyGame, type PartyProps } from "./party-games.js";
import { RoomOptions, SessionScores } from "./room-options.js";
import { games as catalogue } from "../shared/games.js";

const socket = io({ autoConnect: false });
const saved = () => {
  try {
    return JSON.parse(
      sessionStorage.getItem("boxgame.session") ?? "null",
    ) as Session | null;
  } catch {
    return null;
  }
};
function persist(session: Session | null) {
  if (session)
    sessionStorage.setItem("boxgame.session", JSON.stringify(session));
  else sessionStorage.removeItem("boxgame.session");
}
const uid = () => {
  if (typeof globalThis.crypto?.randomUUID === "function")
    return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const h = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
function emit<T = unknown>(event: string, data: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!socket.connected) {
      reject(new Error("You are offline. Reconnecting…"));
      return;
    }
    socket.timeout(6000).emit(event, data, (err: Error | null, ack: Ack<T>) => {
      if (err) {
        reject(
          new Error(
            "No confirmation yet. Reconnect to check your latest state.",
          ),
        );
        return;
      }
      if (ack.ok) resolve(ack.data);
      else reject(Object.assign(new Error(ack.message), { code: ack.error }));
    });
  });
}
const symbols = [Orbit, Sparkles, Layers];
const colorNames = ["coral", "violet", "lime"];
const phaseNames = {
  instructions: "The idea",
  allocate: "Make your move",
  vote: "Pick a spotlight",
  reveal: "The verdict",
  final: "That’s a wrap",
};
function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand ${small ? "brand-small" : ""}`}>
      <span className="brand-icon">
        <Box strokeWidth={2.5} />
      </span>
      boxgame<span className="brand-period">.</span>
    </span>
  );
}
function Button({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`button ${className}`} {...props}>
      {children}
    </button>
  );
}
function App() {
  const dialogRef = useRef<HTMLElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [session, setSession] = useState<Session | null>(saved),
    sessionRef = useRef(session),
    [room, setRoom] = useState<RoomView | null>(null),
    [connected, setConnected] = useState(socket.connected),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [modal, setModal] = useState<"close" | "end" | "leave" | null>(null);
  const openModal = (value: "close" | "end" | "leave") => {
    previousFocus.current = document.activeElement as HTMLElement;
    setModal(value);
  };
  useEffect(() => {
    if (!modal) {
      previousFocus.current?.focus();
      return;
    }
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModal(null);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const nodes = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex="0"]',
        ),
      );
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [modal]);
  const [route, setRoute] = useState(location.pathname),
    [joinCode, setJoinCode] = useState(
      new URLSearchParams(location.search).get("code") ?? "",
    ),
    [name, setName] = useState("");
  const navigate = (p: string) => {
    history.pushState({}, "", p);
    setRoute(location.pathname);
    if (location.search)
      setJoinCode(new URLSearchParams(location.search).get("code") ?? "");
    setError("");
  };
  useEffect(() => {
    const pop = () => {
      setRoute(location.pathname);
      setJoinCode(new URLSearchParams(location.search).get("code") ?? "");
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  const clearSession = () => {
    persist(null);
    sessionRef.current = null;
    setSession(null);
    setRoom(null);
  };
  useEffect(() => {
    const connect = async () => {
      setConnected(true);
      setReady(false);
      setError("");
      const current = sessionRef.current;
      if (current) {
        try {
          const next = await emit<Session>("room:resume", {
            roomId: current.roomId,
            token: current.token,
          });
          persist(next);
          sessionRef.current = next;
          setSession(next);
        } catch (e) {
          clearSession();
          setError((e as Error).message);
        }
      }
      setReady(true);
    };
    const disconnect = () => {
      setConnected(false);
      setReady(false);
    };
    const connectionError = () => {
      setError("Couldn’t connect to the game server. Retrying…");
    };
    const state = (view: RoomView) => {
      setRoom((prev) =>
        prev?.id === view.id && prev.revision > view.revision ? prev : view,
      );
      setError("");
      const current = sessionRef.current;
      if (current && current.role !== view.role) {
        const next = { ...current, role: view.role };
        persist(next);
        sessionRef.current = next;
        setSession(next);
      }
    };
    const closed = ({ message }: { message: string }) => {
      clearSession();
      setReady(true);
      setError(message);
    };
    socket
      .on("connect", connect)
      .on("connect_error", connectionError)
      .on("disconnect", disconnect)
      .on("room:state", state)
      .on("room:closed", closed);
    socket.connect();
    return () => {
      socket
        .off("connect", connect)
        .off("connect_error", connectionError)
        .off("disconnect", disconnect)
        .off("room:state", state)
        .off("room:closed", closed);
      socket.disconnect();
    };
  }, []);
  const action = async (event: string, data: Record<string, unknown> = {}) => {
    setBusy(true);
    setError("");
    try {
      await emit(event, data);
    } catch (e) {
      if ((e as Error & { code?: string }).code !== "stale_word")
        setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const create = async () => {
    setBusy(true);
    setError("");
    try {
      const next = await emit<Session>("room:create", {});
      persist(next);
      sessionRef.current = next;
      setSession(next);
      navigate("/host");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const next = await emit<Session>("room:join", {
        code: joinCode.trim().toUpperCase(),
        name,
      });
      persist(next);
      sessionRef.current = next;
      setSession(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const gameAction = (event: string, extra: Record<string, unknown> = {}) =>
    action(event, {
      commandId: uid(),
      gameId: room?.game?.id,
      phaseId: room?.game?.phaseId,
      ...extra,
    });
  const confirm = async () => {
    const current = modal;
    setModal(null);
    if (current === "end") await gameAction("game:end");
    else await action(current === "close" ? "room:close" : "room:leave");
  };
  if (route === "/privacy" && !room)
    return (
      <div className="shell">
        <header className="topbar">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            <Brand />
          </a>
        </header>
        <main className="prose">
          <p className="eyebrow">THE SMALL PRINT, IN PLAIN ENGLISH</p>
          <h1>
            Your night.
            <br />
            Your business.
          </h1>
          <p>
            Boxgame does not use accounts, analytics, advertising, tracking
            cookies, external fonts, or third-party game content.
          </p>
          <h2>Only here for the game</h2>
          <p>
            Your display name, connection status, game choices, and scores live
            in server memory. Submissions are discarded after round review.
            Names and scores disappear when the room closes, expires, or the
            server restarts. Short-lived network identifiers are used for abuse
            limits and expire within ten minutes after their window.
          </p>
          <h2>Your browser’s room pass</h2>
          <p>
            A random room credential stays in this tab’s session storage to
            restore your seat after a refresh or connection loss. It is cleared
            when you leave or the room ends. Closing this tab can lose your
            seat. No credential is included in a join link.
          </p>
          <h2>What others can see</h2>
          <p>
            Your name and connection status appear in the room. Choices are
            private until the round reveals them. Revealed results include
            everyone’s allocations, forecasts, votes and scores.
          </p>
          <h2>The connection to this server</h2>
          <p>
            The hosting network and any public access provider may process IP
            addresses and connection metadata under their own settings.
            Boxgame’s application logs exclude player names, answers, room
            codes, credentials, and request headers.
          </p>
          <Button onClick={() => navigate("/")}>Back to Boxgame</Button>
        </main>
      </div>
    );
  return (
    <div className={`shell ${room ? "in-room" : ""}`}>
      <header className="topbar">
        <a
          href="/"
          aria-label="Boxgame home"
          onClick={(e) => {
            e.preventDefault();
            if (!room) navigate("/");
          }}
        >
          <Brand />
        </a>
        {room ? (
          <div className="topbar-right">
            <span className="room-tag">
              ROOM <strong>{room.code}</strong>
            </span>
            <button
              className="icon-button"
              onClick={() =>
                openModal(room.role === "host" ? "close" : "leave")
              }
              aria-label={room.role === "host" ? "Close room" : "Leave room"}
            >
              <LogOut size={19} />
            </button>
          </div>
        ) : (
          <div className="topbar-right">
            <span className="nav-note">
              <span className="status-dot" />
              Good nights start here
            </span>
            <a
              className="nav-link"
              href="/join"
              onClick={(e) => {
                e.preventDefault();
                navigate("/join");
              }}
            >
              Join a room
            </a>
          </div>
        )}
      </header>
      {error && (
        <div className="notice error" role="alert">
          <CircleHelp size={18} />
          <span>{error}</span>
          <button
            className="icon-button"
            aria-label="Dismiss message"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {!connected && (
        <div className="notice connection-notice" role="status">
          <WifiOff size={18} />
          <span>
            Connecting to Boxgame…{" "}
            {session ? "Your seat is saved. Keep this tab open." : ""}
          </span>
        </div>
      )}
      {connected && !ready && session ? (
        <main className="center-screen">
          <div className="waiting-orbit">
            <Box />
          </div>
          <h1>Finding your seat.</h1>
          <p>Restoring your room and latest move…</p>
        </main>
      ) : room ? (
        <>
          <Room
            room={room}
            busy={busy || !connected || !ready}
            action={action}
            gameAction={gameAction}
            end={() => openModal("end")}
          />
          <Expiry room={room} />
        </>
      ) : route === "/join" ? (
        <main className="join-layout">
          <section className="join-story">
            <p className="eyebrow">
              <Radio size={16} /> YOU’RE INVITED
            </p>
            <h1>
              Pull up
              <br />a screen<span className="lime-text">.</span>
            </h1>
            <p>
              Phone, tablet, laptop. If it has a browser,
              <br className="desktop-only" /> it has a seat at the table.
            </p>
            <div className="join-decoration">
              <Box />
              <Sparkles />
              <Orbit />
            </div>
          </section>
          <section className="join-card">
            <span className="pill">
              <Users size={15} /> No account. Just a name.
            </span>
            <h2>Join your people.</h2>
            <form onSubmit={join}>
              <label htmlFor="room-code">Room code</label>
              <input
                id="room-code"
                className="code-input"
                placeholder="ABC234"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={6}
                value={joinCode}
                onChange={(e) =>
                  setJoinCode(
                    e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""),
                  )
                }
                required
              />
              <label htmlFor="player-name">What should we call you?</label>
              <input
                id="player-name"
                placeholder="Your display name"
                autoComplete="off"
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Button
                className="primary full"
                disabled={
                  busy || !ready || joinCode.length !== 6 || !name.trim()
                }
              >
                <ScanLine size={19} />
                {busy ? "Finding your room…" : "Let me in"}
              </Button>
              <p className="form-note">
                Your host will approve your request. Keep this tab open to save
                your seat.
              </p>
            </form>
          </section>
        </main>
      ) : (
        <Home
          create={create}
          busy={busy || !ready}
          navigate={navigate}
          code={joinCode}
          setCode={setJoinCode}
        />
      )}
      {!room && (
        <footer>
          <span>
            Made for real people, in the same room. Or a few rooms apart.
          </span>
          <a
            href="/privacy"
            onClick={(e) => {
              e.preventDefault();
              navigate("/privacy");
            }}
          >
            Privacy, simply put
          </a>
        </footer>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow">A QUICK CHECK</p>
            <h2 id="dialog-title">
              {modal === "end"
                ? "Call it a game?"
                : modal === "close"
                  ? "Close this room?"
                  : "Leave the room?"}
            </h2>
            <p>
              {modal === "end"
                ? "Completed rounds keep their scores. The current round will not count."
                : modal === "close"
                  ? "Everyone will be disconnected and this room’s data will be deleted."
                  : "Your seat will be released. You can request a new one in the lobby."}
            </p>
            <div className="button-row">
              <Button
                className="subtle"
                onClick={() => setModal(null)}
                autoFocus
              >
                Keep playing
              </Button>
              <Button className="danger" onClick={confirm}>
                {modal === "end"
                  ? "End game"
                  : modal === "close"
                    ? "Close room"
                    : "Leave room"}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
function Home({
  create,
  busy,
  navigate,
  code,
  setCode,
}: {
  create: () => void;
  busy: boolean;
  navigate: (p: string) => void;
  code: string;
  setCode: (s: string) => void;
}) {
  return (
    <>
      <main className="home">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="mini-star">✳</span> LESS SETUP. MORE GOOD TIMES.
            </p>
            <h1>
              Good company.
              <br />
              Questionable
              <br />
              <span className="hero-highlight">decisions.</span>
            </h1>
            <p className="hero-description">
              {catalogue.length} original party games. Everyone’s phone or PC.
              <br />A room full of original games and very strong opinions.
            </p>
            <div className="hero-actions">
              <Button
                className="primary large"
                onClick={create}
                disabled={busy}
              >
                <Monitor size={21} />
                {busy ? "Getting ready…" : "Host a game"}
              </Button>
              <span className="cta-note">
                No downloads.
                <br />
                No accounts. You’re in.
              </span>
            </div>
            <div className="device-note">
              <Smartphone size={16} />
              <span>Phones, tablets & computers welcome</span>
              <span className="divider" />
              <VolumeX size={16} />
              <span>Sound optional</span>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label={`${catalogue.length} original party games: trivia, bluffing, cards, word guessing, and quick votes`}
          >
            <div className="art-grid" />
            <div className="art-caption">
              <span className="tiny-dot" /> ON THE TABLE TONIGHT
            </div>
            <div className="game-preview">
              <div className="preview-top">
                <span className="pill dark-pill">
                  <Box size={14} /> PICK A GAME
                </span>
                <span className="preview-players">3–8 players</span>
              </div>
              <h2>
                Blank
                <br />
                Slate<span>✳</span>
              </h2>
              <p>Play a card. Get a laugh.</p>
              <div className="crate-stage">
                <div className="crate crate-one">
                  <Box size={62} />
                </div>
                <div className="crate crate-two">
                  <Box size={62} />
                </div>
                <div className="crate crate-three">
                  <Box size={62} />
                </div>
                <span className="stage-spark spark-one">✦</span>
                <span className="stage-spark spark-two">✦</span>
                <div className="orbit-line" />
              </div>
              <div className="preview-bottom">
                <span>
                  {catalogue.length} games. One room.
                  <br />
                  <strong>Which one are we playing?</strong>
                </span>
                <span className="round-sticker">
                  <Sparkles size={19} />
                </span>
              </div>
            </div>
            <div className="floating-note">
              <span className="note-icon">
                <CheckCheck size={20} />
              </span>
              <span>
                Everyone’s in.
                <br />
                <strong>Let’s make some decisions.</strong>
              </span>
            </div>
            <span className="art-label">YOUR PHONE IS YOUR CONTROLLER</span>
          </div>
        </section>
        <section className="home-game-list" aria-label="Games available">
          {catalogue.map((game) => (
            <article key={game.id} className={`home-game option-${game.color}`}>
              <span>
                {game.minPlayers}–8 PLAYERS · {game.minutes}
              </span>
              <h2>{game.title}</h2>
              <p>{game.description}</p>
            </article>
          ))}
        </section>
        <section className="join-strip">
          <div>
            <span className="strip-icon">
              <ScanLine size={26} />
            </span>
            <div>
              <h2>Already got a room?</h2>
              <p>Enter the code on the big screen.</p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/join?code=${encodeURIComponent(code)}`);
            }}
          >
            <label className="sr-only" htmlFor="quick-code">
              Room code
            </label>
            <input
              id="quick-code"
              placeholder="ROOM CODE"
              autoComplete="off"
              maxLength={6}
              autoCapitalize="characters"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""))
              }
            />
            <Button className="light" disabled={code.length !== 6}>
              Join room
            </Button>
          </form>
        </section>
        <section className="how">
          <div className="section-intro">
            <p className="eyebrow">THE WHOLE PLAN</p>
            <h2>
              Less “how does this work?”
              <br />
              More “one more round.”
            </h2>
          </div>
          <div className="how-item">
            <Monitor />
            <h3>Claim the big screen.</h3>
            <p>Host on a laptop, desktop, or a browser connected to your TV.</p>
          </div>
          <div className="how-item">
            <ScanLine />
            <h3>Bring your own screen.</h3>
            <p>Scan the QR or type the code. Pick a name and you’re ready.</p>
          </div>
          <div className="how-item">
            <PartyPopper />
            <h3>Make a night of it.</h3>
            <p>
              Trivia, bluffs, cards, clues and quick votes. Choose a game and
              get straight into it.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

function Expiry({ room }: { room: RoomView }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);
  const left = room.expiresAt - now;
  return left < 300000 ? (
    <div className="notice warning" role="status">
      <Clock3 size={18} />
      This room expires in about {Math.max(1, Math.ceil(left / 60000))} minutes.
      Finish up or start a fresh room.
    </div>
  ) : null;
}
function Roster({
  room,
  action,
  busy,
}: {
  room: RoomView;
  action: (e: string, d: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  return (
    <div className="roster">
      {room.players.map((p, i) => (
        <div
          className={`player-tile ${!p.connected ? "is-offline" : ""}`}
          key={p.id}
        >
          <span className={`avatar avatar-${i % 4}`}>
            {p.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{p.name}</strong>
            <span>
              {p.connected ? "Ready to play" : "Disconnected · seat saved"}
            </span>
          </div>
          {room.role === "host" && p.name !== "Removed player" && (
            <button
              className="icon-button remove-player"
              aria-label={`Remove ${p.name}`}
              disabled={busy}
              onClick={() => action("host:remove", { id: p.id })}
            >
              <X size={16} />
            </button>
          )}
        </div>
      ))}
      {Array.from({ length: Math.max(0, 3 - room.players.length) }, (_, i) => (
        <div className="player-tile empty-seat" key={`empty-${i}`}>
          <span className="avatar">
            <Plus size={20} />
          </span>
          <span>Saving a seat…</span>
        </div>
      ))}
    </div>
  );
}
function Room({
  room,
  busy,
  action,
  gameAction,
  end,
}: {
  room: RoomView;
  busy: boolean;
  action: (e: string, d?: Record<string, unknown>) => Promise<void>;
  gameAction: (e: string, d?: Record<string, unknown>) => Promise<void>;
  end: () => void;
}) {
  const [hostName, setHostName] = useState("Me"),
    [showLobbyRules, setShowLobbyRules] = useState(false);
  const available = room.games?.length ? room.games : catalogue;
  const selected =
    available.find((g) => g.id === room.selectedGame) ?? available[0];
  const minimum =
    selected.id === "clue-crew" && room.settings?.clueMode === "teams"
      ? 4
      : selected.minPlayers;
  const [qr, setQr] = useState(""),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    QRCode.toDataURL(room.joinUrl, {
      width: 220,
      margin: 1,
      color: { dark: "#111313", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then(setQr);
  }, [room.joinUrl]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(room.joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  if (room.role === "pending")
    return (
      <main className="center-screen">
        <div className="waiting-orbit">
          <Users size={42} />
        </div>
        <p className="eyebrow">ROOM {room.code}</p>
        <h1>You’re at the door.</h1>
        <p>
          Your host is approving your request.
          <br />
          Keep this tab open. You’ll be in shortly.
        </p>
        <span className="pill">
          <Clock3 size={15} /> Requests last one minute
        </span>
      </main>
    );
  if (room.game)
    return <Game room={room} busy={busy} gameAction={gameAction} end={end} />;
  if (room.role === "player")
    return (
      <main className="player-lobby">
        <div className="success-badge">
          <Check size={26} />
        </div>
        <p className="eyebrow">
          YOU’RE IN,{" "}
          {room.players.find((p) => p.id === room.playerId)?.name.toUpperCase()}
        </p>
        <h1>
          Good company.
          <br />
          Great start.
        </h1>
        <p>
          The host is getting things ready.
          <br />
          Keep this tab open. Your controller will appear here.
        </p>
        {selected.id === "clue-crew" && room.settings?.clueMode === "teams" && (
          <p className="pill">
            {room.settings.teams[room.playerId!] === 1
              ? "Team Coral"
              : "Team Lime"}{" "}
            · target {room.settings.teamTarget} points
          </p>
        )}
        <SessionScores room={room} />
        <div className="player-lobby-game">
          <Box size={30} />
          <div>
            <span>UP NEXT</span>
            <h3>{selected.title}</h3>
            <p>{selected.tagline}</p>
          </div>
        </div>
        <button
          className="button subtle full"
          onClick={() => setShowLobbyRules(!showLobbyRules)}
        >
          {showLobbyRules ? "Hide rules" : "How do I play?"}
        </button>
        {showLobbyRules && (
          <ol className="lobby-rules">
            {selected.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
        <div className="section-label">
          <h2>Your people</h2>
          <span>{room.players.length}/8</span>
        </div>
        <Roster room={room} action={action} busy={busy} />
        {!room.hostConnected && (
          <div className="notice">
            <WifiOff size={18} />
            Waiting for your host to reconnect.
          </div>
        )}
      </main>
    );
  const connected = room.players.filter((p) => p.connected).length;
  return (
    <main className="lobby">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE NIGHT STARTS HERE</p>
          <h1>
            Bring your people<span className="lime-text">.</span>
          </h1>
          <p>Choose a game. Let your friends in. Tap Start.</p>
        </div>
        <Button
          className="subtle"
          disabled={busy}
          onClick={() => action("host:lock", { locked: !room.locked })}
        >
          {room.locked ? <Lock size={17} /> : <Unlock size={17} />}{" "}
          {room.locked ? "Unlock room" : "Lock room"}
        </Button>
      </div>
      <div className="lobby-grid">
        <section className="lobby-main">
          <div className="room-invite">
            <div>
              <p className="eyebrow">YOUR ROOM CODE</p>
              <div className="big-code">{room.code}</div>
              <p>
                Scan to join, or enter this code at
                <br />
                <strong>{new URL(room.joinUrl).host}/join</strong>
              </p>
              <Button className="subtle small" onClick={copy}>
                {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
                {copied ? "Link copied" : "Copy invite link"}
              </Button>
            </div>
            <div className="qr-wrap">
              {qr && (
                <img
                  src={qr}
                  alt={`Scan to join room ${room.code}`}
                  width={156}
                  height={156}
                />
              )}
              <span>POINT. SCAN. PLAY.</span>
            </div>
          </div>
          {/localhost|127\.0\.0\.1/.test(room.joinUrl) && (
            <div className="notice warning">
              This invite uses localhost. Configure PUBLIC_ORIGIN to the
              server’s LAN address or public hostname before inviting other
              devices.
            </div>
          )}
          {room.pending.length > 0 && (
            <section className="admissions" aria-label="Join requests">
              <div className="section-label">
                <h2>At the door</h2>
                <span className="count-badge">{room.pending.length}</span>
              </div>
              {room.pending.map((p) => (
                <div className="admission" key={p.id}>
                  <span>
                    <Users size={17} />
                    <strong>{p.name}</strong> wants a seat
                  </span>
                  <div>
                    <Button
                      className="subtle small"
                      disabled={busy}
                      onClick={() => action("host:deny", { id: p.id })}
                    >
                      Decline
                    </Button>
                    <Button
                      className="primary small"
                      disabled={busy}
                      onClick={() => action("host:admit", { id: p.id })}
                    >
                      <Check size={16} /> Let in
                    </Button>
                  </div>
                </div>
              ))}
            </section>
          )}
          <div className="section-label">
            <h2>The good company</h2>
            <span>{room.players.length}/8 players</span>
          </div>
          <Roster room={room} action={action} busy={busy} />
        </section>
        <aside className="lobby-aside game-picker-aside">
          <section className="host-play-card">
            {room.playerId ? (
              <>
                <span className="pill">
                  <Check size={15} /> YOU’RE PLAYING
                </span>
                <h2>
                  {room.players.find((p) => p.id === room.playerId)?.name},
                  you’re in.
                </h2>
                <p>
                  Game buttons and your private cards will appear on this
                  device.
                </p>
                <button
                  className="button subtle small"
                  disabled={busy}
                  onClick={() => action("host:remove", { id: room.playerId })}
                >
                  Use as shared screen instead
                </button>
              </>
            ) : (
              <>
                <h2>Playing on this phone?</h2>
                <p>
                  Join yourself to get game buttons here. This becomes your
                  private controller.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    action("host:play", { name: hostName });
                  }}
                >
                  <label className="sr-only" htmlFor="host-name">
                    Your player name
                  </label>
                  <input
                    id="host-name"
                    placeholder="Your name"
                    value={hostName}
                    maxLength={40}
                    onChange={(e) => setHostName(e.target.value)}
                  />
                  <button
                    className="button primary full"
                    disabled={busy || !hostName.trim()}
                  >
                    <Users size={18} /> Play on this device
                  </button>
                </form>
                <small>
                  Hosting on a TV? Leave this as the shared screen and join from
                  your own phone.
                </small>
              </>
            )}
          </section>
          <section className="game-picker">
            <h2>Choose your game</h2>
            <div className="game-options">
              {available.map((game) => (
                <button
                  type="button"
                  className={`game-option option-${game.color} ${game.id === selected.id ? "chosen" : ""}`}
                  aria-pressed={game.id === selected.id}
                  key={game.id}
                  disabled={busy}
                  onClick={() => action("host:game", { gameKey: game.id })}
                >
                  <div>
                    <strong>{game.title}</strong>
                    {game.id === selected.id && <Check size={20} />}
                  </div>
                  <p>{game.tagline}</p>
                  <small>
                    {game.minPlayers}–8 players · {game.minutes}
                  </small>
                </button>
              ))}
            </div>
            <p className="picked-description">{selected.description}</p>
          </section>
          <RoomOptions room={room} busy={busy} action={action} />
          <div className="timing">
            <label htmlFor="timing">
              <Settings2 size={16} /> Pace
            </label>
            <div className="select-wrap">
              <select
                id="timing"
                value={room.duration}
                disabled={busy}
                onChange={(e) =>
                  action("host:settings", { duration: Number(e.target.value) })
                }
              >
                <option value={45}>Quick rounds</option>
                <option value={90}>More thinking time</option>
                <option value={0}>No timer</option>
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
          <button
            className="button primary large full"
            disabled={busy || connected < minimum}
            onClick={() =>
              action("game:start", { commandId: uid(), gameKey: selected.id })
            }
          >
            <Play size={20} />
            {connected < minimum
              ? `${minimum - connected} more ${minimum - connected === 1 ? "player" : "players"} to go`
              : `Start ${selected.title}`}
          </button>
          <p className="form-note">
            {connected < minimum
              ? `Needs ${minimum} players. The host counts if you join yourself.`
              : "A quick how-to appears before the first round."}
          </p>
        </aside>
      </div>
    </main>
  );
}

function Game(props: PartyProps) {
  return props.room.game?.gameKey &&
    props.room.game.gameKey !== "parcel-parliament" ? (
    <PartyGame {...props} />
  ) : (
    <LegacyGame {...props} />
  );
}
function LegacyGame({
  room,
  busy,
  gameAction,
  end,
}: {
  room: RoomView;
  busy: boolean;
  gameAction: (e: string, d?: Record<string, unknown>) => Promise<void>;
  end: () => void;
}) {
  const game = room.game!,
    hostControls = room.role === "host",
    host = hostControls && !room.playerId,
    own = room.private;
  const [allocation, setAllocation] = useState<Triple>([0, 0, 0]),
    [forecast, setForecast] = useState<number | null>(null),
    [vote, setVote] = useState<number | null>(null),
    [help, setHelp] = useState(false);
  useEffect(() => {
    setAllocation(room.private?.allocation ?? [0, 0, 0]);
    setForecast(room.private?.forecast ?? null);
    setVote(room.private?.vote ?? null);
  }, [game.id, game.phase, game.round]);
  const left = 6 - allocation.reduce((a, b) => a + b, 0),
    submitted = own?.submitted;
  const change = (i: number, by: number) =>
    setAllocation(
      (a) =>
        a.map((v, j) =>
          j === i ? Math.max(0, Math.min(v + by, v + Math.max(left, 0))) : v,
        ) as Triple,
    );
  const active = ["allocate", "vote"].includes(game.phase);
  return (
    <main className={`game-layout ${host ? "host-game" : "phone-game"}`}>
      <div className="game-top">
        <div className="game-title">
          <span className="eyebrow">PARCEL PARLIAMENT</span>
          <div>
            <span className="round-pill">
              ROUND {game.round} / {game.rounds}
            </span>
            <span className="phase-label">{phaseNames[game.phase]}</span>
          </div>
        </div>
        <div className="game-tools">
          {active && <Timer game={game} serverNow={room.now} />}
          <button
            className="icon-button"
            aria-label="Show game rules"
            onClick={() => setHelp(!help)}
          >
            <CircleHelp size={21} />
          </button>
          {host && (
            <>
              <Button
                className="subtle small"
                disabled={busy || !active}
                onClick={() =>
                  gameAction(game.paused ? "game:resume" : "game:pause")
                }
              >
                {game.paused ? <Play size={16} /> : <Pause size={16} />}
                <span>{game.paused ? "Resume" : "Pause"}</span>
              </Button>
              <Button className="subtle small" disabled={busy} onClick={end}>
                End game
              </Button>
            </>
          )}
        </div>
      </div>
      <div aria-live="polite" className="sr-only">
        {phaseNames[game.phase]}. Round {game.round} of {game.rounds}.
        {submitted ? " Submitted." : ""}
      </div>
      {help && (
        <section className="rules-inline">
          <button
            className="icon-button"
            aria-label="Hide rules"
            onClick={() => setHelp(false)}
          >
            <X size={18} />
          </button>
          <Rules />
        </section>
      )}
      {game.paused && (
        <div className="notice pause-notice" role="status">
          <Pause size={20} />
          <div>
            <strong>{game.pauseReason}</strong>
            <span>
              Choices stay on your screen. The clock and submissions are paused.
            </span>
          </div>
        </div>
      )}
      {game.phase === "instructions" ? (
        <section className="instructions">
          <span className="pill">
            <Box size={16} /> SMALL BUDGET. BIG OPINIONS.
          </span>
          <h1>
            Six crates.
            <br />A town of possibilities.
          </h1>
          <p className="instructions-intro">
            You decide what gets built.
            <br />
            The trick? Figuring out what everyone else will do.
          </p>
          <Rules />
          {hostControls ? (
            <Button
              className="primary large"
              disabled={busy}
              onClick={() => gameAction("game:advance")}
            >
              <Play size={20} /> Start the first round
            </Button>
          ) : (
            <p className="waiting-line">
              <Radio size={17} /> Your host will start when everyone’s ready.
            </p>
          )}
        </section>
      ) : game.phase === "final" ? (
        <Final
          room={room}
          host={hostControls}
          busy={busy}
          advance={() => gameAction("game:advance")}
        />
      ) : game.phase === "reveal" ? (
        <Results
          room={room}
          host={hostControls}
          busy={busy}
          advance={() => gameAction("game:advance")}
        />
      ) : (
        <>
          <section className="scenario-heading">
            <p className="eyebrow">{game.scenario.title.toUpperCase()}</p>
            <h1>{game.scenario.brief}</h1>
            {host ? (
              <p>
                {game.phase === "allocate"
                  ? "Make your allocation and prediction on your own screen. Nothing is revealed yet."
                  : "Vote on your own screen. Which project deserves the spotlight?"}
              </p>
            ) : own ? (
              <p>
                {game.phase === "allocate"
                  ? "Six crates to split. A crowd to predict. Go with your gut."
                  : "Allocations are locked. Give one project a little extra love."}
              </p>
            ) : (
              <p>You have a seat for the next game. Watch this round unfold.</p>
            )}
          </section>
          {!host && own && game.phase === "allocate" && !submitted && (
            <div className="forecast-brief">
              <Sparkles size={22} />
              <div>
                <span>YOUR PRIVATE FORECAST</span>
                <strong>Which project will receive the {own.rank} pile?</strong>
                <p>
                  Predict the combined crates from everyone. A correct forecast
                  earns 3 points.
                </p>
              </div>
            </div>
          )}
          {!host && own && submitted ? (
            <section className="submitted-panel">
              <div className="success-badge">
                <CheckCheck size={30} />
              </div>
              <p className="eyebrow">LOCKED IN</p>
              <h2>
                {game.phase === "allocate"
                  ? "Crates committed."
                  : "Spotlight selected."}
              </h2>
              <p>
                {game.phase === "allocate"
                  ? "Your forecast is safe with us. The vote is up next."
                  : "Now we find out how well you know this crowd."}
              </p>
              <div className="your-choices">
                {game.scenario.projects.map((p, i) => (
                  <span key={p.name}>
                    <strong>
                      {game.phase === "allocate"
                        ? own.allocation?.[i]
                        : own.vote === i
                          ? "★"
                          : "–"}
                    </strong>
                    {p.name}
                  </span>
                ))}
              </div>
              <Progress game={game} />
            </section>
          ) : (
            <>
              {!host && own && game.phase === "allocate" && (
                <div className="allocation-label">
                  <h2>Fund your favourites</h2>
                  <span
                    className={`crate-counter ${left === 0 ? "complete" : ""}`}
                  >
                    <Box size={17} />
                    {left} crate{left !== 1 ? "s" : ""} left
                  </span>
                </div>
              )}
              <div className={`projects ${host ? "projects-host" : ""}`}>
                {game.scenario.projects.map((project, i) => {
                  const Icon = symbols[i];
                  return (
                    <article
                      className={`project project-${colorNames[i]} ${(game.phase === "allocate" ? forecast === i : vote === i) ? "is-selected" : ""}`}
                      key={project.name}
                    >
                      <div className="project-art">
                        <Icon strokeWidth={1.4} />
                        <span className="project-letter">
                          {["A", "B", "C"][i]}
                        </span>
                        <span className="art-small-star">✳</span>
                      </div>
                      <div className="project-content">
                        <h2>{project.name}</h2>
                        <p>{project.description}</p>
                        {!host &&
                          own &&
                          (game.phase === "allocate" ? (
                            <>
                              <div className="stepper">
                                <button
                                  aria-label={`Remove one crate from ${project.name}`}
                                  disabled={
                                    busy || game.paused || allocation[i] === 0
                                  }
                                  onClick={() => change(i, -1)}
                                >
                                  <Minus size={20} />
                                </button>
                                <output aria-label={`${project.name} crates`}>
                                  {allocation[i]} <Box size={18} />
                                </output>
                                <button
                                  aria-label={`Add one crate to ${project.name}`}
                                  disabled={busy || game.paused || left === 0}
                                  onClick={() => change(i, 1)}
                                >
                                  <Plus size={20} />
                                </button>
                              </div>
                              <button
                                className={`forecast-choice ${forecast === i ? "chosen" : ""}`}
                                disabled={busy || game.paused}
                                aria-pressed={forecast === i}
                                onClick={() => setForecast(i)}
                              >
                                {forecast === i ? (
                                  <Check size={17} />
                                ) : (
                                  <span className="radio-ring" />
                                )}{" "}
                                Predict {own.rank}
                              </button>
                            </>
                          ) : (
                            <button
                              className={`vote-choice ${vote === i ? "chosen" : ""}`}
                              disabled={busy || game.paused}
                              aria-pressed={vote === i}
                              onClick={() => setVote(i)}
                            >
                              {vote === i ? (
                                <Check size={18} />
                              ) : (
                                <Sparkles size={18} />
                              )}{" "}
                              {vote === i ? "My spotlight" : "Spotlight this"}
                            </button>
                          ))}
                      </div>
                    </article>
                  );
                })}
              </div>
              {!host && own && (
                <div className="submit-bar">
                  <span>
                    {game.phase === "allocate"
                      ? left > 0
                        ? `Place ${left} more crate${left !== 1 ? "s" : ""}.`
                        : forecast === null
                          ? "Choose your forecast."
                          : "Looking good. Make it official."
                      : vote === null
                        ? "Pick a project above."
                        : "A little spotlight goes a long way."}
                  </span>
                  <Button
                    className="primary full"
                    disabled={
                      busy ||
                      game.paused ||
                      (game.phase === "allocate"
                        ? left !== 0 || forecast === null
                        : vote === null)
                    }
                    onClick={() =>
                      gameAction(
                        game.phase === "allocate" ? "game:submit" : "game:vote",
                        game.phase === "allocate"
                          ? { allocation, forecast }
                          : { project: vote },
                      )
                    }
                  >
                    <Check size={20} />
                    {busy
                      ? "Sending…"
                      : game.phase === "allocate"
                        ? "Lock in my crates"
                        : "Lock in my spotlight"}
                  </Button>
                </div>
              )}
              {host && (
                <div className="host-progress">
                  <Progress game={game} />
                  <span>
                    <Smartphone size={17} /> Phones and PCs are the controllers.
                  </span>
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
function Timer({ game, serverNow }: { game: GameView; serverNow: number }) {
  const [now, setNow] = useState(Date.now()),
    offset = useRef(serverNow - Date.now());
  useEffect(() => {
    offset.current = serverNow - Date.now();
  }, [serverNow]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const remaining = game.paused
    ? game.remainingMs
    : game.deadline === null
      ? null
      : Math.max(0, game.deadline - (now + offset.current));
  return (
    <span
      className={`timer ${remaining !== null && remaining < 10000 ? "timer-urgent" : ""}`}
      aria-label={
        remaining === null
          ? "No time limit"
          : `${Math.ceil(remaining / 1000)} seconds remaining`
      }
    >
      <Clock3 size={18} />
      {remaining === null
        ? "No rush"
        : `${Math.floor(Math.ceil(remaining / 1000) / 60)}:${String(Math.ceil(remaining / 1000) % 60).padStart(2, "0")}`}
    </span>
  );
}
function Progress({ game }: { game: GameView }) {
  return (
    <div className="progress-box">
      <div className="progress-dots">
        {Array.from({ length: game.eligible }, (_, i) => (
          <span key={i} className={i < game.submitted ? "done" : ""}>
            {i < game.submitted ? <Check size={14} /> : null}
          </span>
        ))}
      </div>
      <p>
        <strong>
          {game.submitted} of {game.eligible}
        </strong>{" "}
        {game.phase === "allocate" ? "allocations" : "votes"} in
      </p>
    </div>
  );
}
function Rules() {
  return (
    <div className="rules">
      <div>
        <span className="rule-icon">
          <Box />
        </span>
        <h3>Split six crates.</h3>
        <p>
          Fund three peculiar projects however you like. Use all six. Zero is
          fine.
        </p>
      </div>
      <div>
        <span className="rule-icon">
          <Orbit />
        </span>
        <h3>Read the room.</h3>
        <p>
          Your private brief asks for the largest, middle, or smallest combined
          pile. Predict the right project for <strong>3 points</strong>.
        </p>
      </div>
      <div>
        <span className="rule-icon">
          <Sparkles />
        </span>
        <h3>Pick a spotlight.</h3>
        <p>
          Vote for one project. If you put at least two crates into a vote
          winner, earn <strong>2 points</strong>.
        </p>
      </div>
      <p className="rule-footnote">
        Six rounds. Most points wins. Tied projects share rank positions and
        spotlight wins. No vote means no spotlight bonus. No speed bonus, ever.
      </p>
    </div>
  );
}
function Results({
  room,
  host,
  busy,
  advance,
}: {
  room: RoomView;
  host: boolean;
  busy: boolean;
  advance: () => void;
}) {
  const g = room.game!,
    r = g.result!;
  const max = Math.max(...r.totals, 1);
  return (
    <section className="results">
      <div className="results-heading">
        <p className="eyebrow">THE CRATES HAVE SPOKEN</p>
        <h1>
          Here’s where it all went<span className="lime-text">.</span>
        </h1>
        <p>
          {g.scenario.title} · Round {g.round}
        </p>
      </div>
      <div className="results-projects">
        {g.scenario.projects.map((p, i) => {
          const Icon = symbols[i];
          return (
            <article
              className={`result-project project-${colorNames[i]}`}
              key={p.name}
            >
              <div className="result-project-top">
                <Icon size={28} />
                {r.spotlight.includes(i) && (
                  <span className="spotlight-badge">
                    <Sparkles size={13} /> SPOTLIGHT
                  </span>
                )}
              </div>
              <h2>{p.name}</h2>
              <div className="result-number">
                {r.totals[i]}
                <span>crates</span>
              </div>
              <div className="result-bar">
                <span style={{ width: `${(r.totals[i] / max) * 100}%` }} />
              </div>
              <p>
                {r.votes[i]} spotlight vote{r.votes[i] !== 1 ? "s" : ""}
              </p>
            </article>
          );
        })}
      </div>
      <div className="section-label">
        <h2>The round, person by person</h2>
        <span>Forecast + spotlight</span>
      </div>
      <div className="score-list">
        {r.rows
          .sort((a, b) => b.total - a.total)
          .map((p, i) => (
            <div
              className={`score-row ${p.id === room.playerId ? "your-score" : ""}`}
              key={p.id}
            >
              <span className={`avatar avatar-${i % 4}`}>
                {p.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="score-name">
                <strong>
                  {p.name}
                  {p.id === room.playerId ? " (you)" : ""}
                </strong>
                <span>
                  {p.allocation
                    ? `${p.allocation.join(" / ")} crates · ${p.rank}: ${g.scenario.projects[p.forecast!].name}`
                    : "No allocation submitted"}
                  <br />
                  {p.vote !== null
                    ? `Spotlight: ${g.scenario.projects[p.vote].name}`
                    : "No spotlight vote"}
                </span>
              </div>
              <div className="score-breakdown">
                <span className={p.forecastPoints ? "earned" : ""}>
                  {p.forecastPoints} forecast
                </span>
                <span className={p.spotlightPoints ? "earned" : ""}>
                  {p.spotlightPoints} spotlight
                </span>
              </div>
              <strong className="round-points">+{p.points}</strong>
              <div className="total-points">
                <strong>{p.total}</strong>
                <span>total</span>
              </div>
            </div>
          ))}
      </div>
      <div className="results-footer">
        {host ? (
          <Button className="primary large" disabled={busy} onClick={advance}>
            {g.round === g.rounds ? <Trophy size={20} /> : <Play size={20} />}{" "}
            {g.round === g.rounds ? "The final standings" : "Another round"}
          </Button>
        ) : (
          <p className="waiting-line">
            <Radio size={17} /> Waiting for the host. Time to defend your
            decisions.
          </p>
        )}
        <p>
          Largest, middle and smallest ties occupy all tied positions.
          <br />
          Spotlight bonus is awarded once per player, even with tied winners.
        </p>
      </div>
    </section>
  );
}
function Final({
  room,
  host,
  busy,
  advance,
}: {
  room: RoomView;
  host: boolean;
  busy: boolean;
  advance: () => void;
}) {
  const sorted = [...room.players].sort((a, b) => b.score - a.score),
    top = sorted[0]?.score ?? 0,
    winners = sorted.filter((p) => p.score === top);
  return (
    <section className="final">
      <div className="trophy-art">
        <Trophy size={70} />
        <Sparkles size={28} />
      </div>
      <p className="eyebrow">
        GOOD COMPANY. EXCELLENTLY QUESTIONABLE DECISIONS.
      </p>
      <h1>
        {winners.length === 1
          ? `${winners[0].name} takes the night.`
          : "A shared victory."}
      </h1>
      <p>
        {winners.length === 1
          ? "A little intuition. A few well-placed crates."
          : `${winners.map((p) => p.name).join(", ")} finish together.`}
        <br />
        The real question: one more game?
      </p>
      <div className="final-board">
        {sorted.map((p, i) => (
          <div
            className={`final-row ${p.score === top ? "winner" : ""}`}
            key={p.id}
          >
            <span className="position">
              {sorted.findIndex((x) => x.score === p.score) + 1}
            </span>
            <span className={`avatar avatar-${i % 4}`}>
              {p.name.slice(0, 1).toUpperCase()}
            </span>
            <strong>{p.name}</strong>
            {p.score === top && <Trophy size={19} />}
            <span className="final-score">
              {p.score}
              <small>pts</small>
            </span>
          </div>
        ))}
      </div>
      {host ? (
        <Button className="primary large" disabled={busy} onClick={advance}>
          <RotateCcw size={20} /> Back to the lobby
        </Button>
      ) : (
        <p className="waiting-line">
          <Radio size={17} /> Your host can set up another game.
        </p>
      )}
    </section>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
