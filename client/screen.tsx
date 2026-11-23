import React, { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import QRCode from "qrcode";
import { Cast, Copy, Maximize, Monitor, RefreshCw, X } from "lucide-react";
import type { Ack, RoomView, Session } from "../shared/types.js";
import { games } from "../shared/games.js";
import { GameClock } from "./party-games.js";
interface Pairing {
  code: string;
  url: string;
  expires: number;
}
async function fullScreen() {
  if (!document.documentElement.requestFullscreen)
    throw new Error("Fullscreen is unavailable.");
  if (!document.fullscreenElement && document.documentElement.requestFullscreen)
    await document.documentElement.requestFullscreen();
}
export function ScreenControls({
  room,
  busy,
  request,
}: {
  room: RoomView;
  busy: boolean;
  request: (event: string, data?: Record<string, unknown>) => Promise<unknown>;
}) {
  const [pair, setPair] = useState<Pairing | null>(null),
    [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now());
  const presentationRef = useRef<unknown>(null);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const generate = async () => {
    try {
      const p = await request("host:screen", {});
      if (p) {
        setPair(p as Pairing);
        setMessage("");
        return p as Pairing;
      }
    } catch {
      setMessage("Couldn’t create a screen code. Try again.");
    }
    return null;
  };
  const open = () => {
    if (pair && pair.expires > now)
      window.open(pair.url, "_blank", "noopener,noreferrer");
  };
  const cast = async () => {
    if (!pair || pair.expires <= now) return;
    const Presentation = (
      window as unknown as {
        PresentationRequest?: new (urls: string[]) => {
          start: () => Promise<unknown>;
        };
      }
    ).PresentationRequest;
    if (!Presentation) {
      setMessage(
        "This browser has no screen picker. Open the shared-screen tab and use Chrome’s Cast tab command, or enter this code in your TV browser.",
      );
      return;
    }
    try {
      const request = new Presentation([pair.url]);
      presentationRef.current = request;
      await request.start();
      setMessage(
        "Screen picker opened. The receiving screen connects using this one-time code.",
      );
    } catch {
      setMessage(
        "No compatible screen selected. Open /screen in the TV browser and enter the code, or cast only the shared-screen tab.",
      );
    }
  };
  return (
    <section className="screen-tools" aria-label="Shared screen setup">
      <div>
        <Monitor size={22} />
        <h2>Put the game on a bigger screen</h2>
        <span>{room.displayCount ?? 0} connected</span>
      </div>
      <p>
        Your host controls and private answers stay on this device. The TV shows
        only the shared game.
      </p>
      {!pair || pair.expires <= now ? (
        <button className="button primary" disabled={busy} onClick={generate}>
          <Cast size={18} />
          Connect a screen
        </button>
      ) : (
        <>
          <p>
            On the TV or PC, open{" "}
            <strong>{new URL(pair.url).origin}/screen</strong> and enter:
          </p>
          <strong className="screen-pair-code">{pair.code}</strong>
          <small>
            One use · expires in{" "}
            {Math.max(0, Math.ceil((pair.expires - now) / 1000))} seconds. This
            is different from the player room code.
          </small>
          <div className="screen-tool-actions">
            <button className="button primary" onClick={open}>
              Open shared-screen tab
            </button>
            <button className="button subtle" onClick={cast}>
              <Cast size={18} />
              Cast / choose screen
            </button>
            <button
              className="button subtle"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(pair.url);
                  setMessage("One-time screen link copied.");
                } catch {
                  setMessage("Copy the screen address and code above.");
                }
              }}
            >
              <Copy size={18} />
              Copy screen link
            </button>
          </div>
          <p>
            Cast only the shared-screen tab. In a TV browser, tap Enter
            fullscreen once; browser permissions may require that tap.
          </p>
        </>
      )}
      {!!room.displayCount && (
        <button
          className="button subtle small"
          disabled={busy}
          onClick={async () => {
            await request("host:screen:revoke", {});
            setPair(null);
          }}
        >
          Disconnect shared screens
        </button>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
function call<T>(socket: Socket, event: string, data: unknown): Promise<T> {
  return new Promise((resolve, reject) =>
    socket
      .timeout(6000)
      .emit(event, data, (err: Error | null, ack: Ack<T>) =>
        err
          ? reject(new Error("The screen connection timed out."))
          : ack.ok
            ? resolve(ack.data)
            : reject(new Error(ack.message)),
      ),
  );
}
export function ScreenApp() {
  const [room, setRoom] = useState<RoomView | null>(null),
    [code, setCode] = useState(() => location.hash.slice(1).toUpperCase()),
    [error, setError] = useState(""),
    [connected, setConnected] = useState(false),
    [busy, setBusy] = useState(false),
    [full, setFull] = useState(false);
  const socket = useRef<Socket | null>(null);
  useEffect(() => {
    const s = io({ autoConnect: false });
    socket.current = s;
    const restore = async () => {
      setConnected(true);
      try {
        const saved = JSON.parse(
          sessionStorage.getItem("boxgame.display") ?? "null",
        ) as Session | null;
        if (location.hash) {
          sessionStorage.removeItem("boxgame.display");
          const next = await call<Session>(s, "display:join", {
            code: location.hash.slice(1).toUpperCase(),
          });
          sessionStorage.setItem("boxgame.display", JSON.stringify(next));
          history.replaceState({}, "", "/screen");
        } else if (saved?.role === "display") {
          await call(s, "room:resume", {
            roomId: saved.roomId,
            token: saved.token,
          });
        }
      } catch (e) {
        sessionStorage.removeItem("boxgame.display");
        setError((e as Error).message);
      }
    };
    s.on("connect", restore)
      .on("disconnect", () => setConnected(false))
      .on("connect_error", () => setError("Connecting to the game server…"))
      .on("room:state", (r: RoomView) => {
        if (r.role === "display") {
          setRoom(r);
          setError("");
        }
      })
      .on("room:closed", ({ message }: { message: string }) => {
        sessionStorage.removeItem("boxgame.display");
        setRoom(null);
        setError(message);
      });
    s.connect();
    const changed = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", changed);
    return () => {
      s.disconnect();
      document.removeEventListener("fullscreenchange", changed);
    };
  }, []);
  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    void fullScreen().catch(() => {});
    try {
      const next = await call<Session>(socket.current!, "display:join", {
        code,
      });
      sessionStorage.setItem("boxgame.display", JSON.stringify(next));
      history.replaceState({}, "", "/screen");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="tv-shell">
      <header className="tv-toolbar">
        <a href="/">
          boxgame<span>.</span>
        </a>
        <div>
          <span>{connected ? "Shared screen" : "Reconnecting…"}</span>
          <button
            className="button subtle small"
            onClick={() =>
              void (full ? document.exitFullscreen() : fullScreen()).catch(() =>
                setError("Use your browser’s fullscreen control if available."),
              )
            }
          >
            <Maximize size={18} />
            {full ? "Exit fullscreen" : "Enter fullscreen"}
          </button>
          {room && (
            <button
              className="button subtle small"
              onClick={async () => {
                try {
                  await call(socket.current!, "room:leave", {});
                  sessionStorage.removeItem("boxgame.display");
                  setRoom(null);
                } catch {
                  setError(
                    "Reconnect before disconnecting this screen, or revoke it from the host.",
                  );
                }
              }}
              aria-label="Disconnect this screen"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {room ? (
        <ScreenStage room={room} />
      ) : (
        <main className="screen-connect">
          <Monitor size={64} />
          <p className="eyebrow">THE BIG SCREEN</p>
          <h1>
            Let the room
            <br />
            see the game.
          </h1>
          <p>
            On the host device, tap Connect a screen. Enter its one-time screen
            code here.
          </p>
          <form onSubmit={join}>
            <label htmlFor="screen-code">Screen pairing code</label>
            <input
              id="screen-code"
              value={code}
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""))
              }
            />
            <button
              className="button primary large"
              disabled={!connected || busy || code.length !== 6}
            >
              {busy ? <RefreshCw size={20} /> : <Monitor size={20} />}Connect &
              fullscreen
            </button>
          </form>
          <p>Players join at /join. This screen is display-only.</p>
        </main>
      )}
    </div>
  );
}
export function ScreenStage({ room }: { room: RoomView }) {
  const [qr, setQr] = useState("");
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(room.joinUrl, { width: 240, margin: 2 }).then((data) => {
      if (active) setQr(data);
    });
    return () => {
      active = false;
    };
  }, [room.joinUrl]);
  const [page, setPage] = useState(0);
  const pageCount = Math.max(
    1,
    Math.ceil(
      (room.game?.cards?.options.length ??
        room.game?.bluff?.options.length ??
        0) / 6,
    ),
  );
  useEffect(() => {
    setPage(0);
    if (pageCount <= 1) return;
    const timer = setInterval(() => setPage((p) => (p + 1) % pageCount), 8000);
    return () => clearInterval(timer);
  }, [room.game?.phaseId, pageCount]);
  const g = room.game,
    meta = games.find((m) => m.id === (g?.gameKey ?? room.selectedGame)),
    name = (id: string) =>
      room.players.find((p) => p.id === id)?.name ?? "Player";
  const scores = (
    <div className="tv-scores">
      {[...room.players]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((p) => (
          <span key={p.id}>
            <strong>{p.name}</strong>
            <b>{p.score}</b>
          </span>
        ))}
    </div>
  );
  return (
    <main className="tv-stage">
      <div className="tv-room-bar">
        <span>
          JOIN AT <strong>{new URL(room.joinUrl).host}/join</strong>
        </span>
        <strong className="tv-room-code">{room.code}</strong>
        {g && <GameClock game={g} serverNow={room.now} />}
      </div>
      {!g ? (
        <div className="tv-lobby">
          <section>
            <p className="eyebrow">GOOD COMPANY. GREAT GAME NIGHT.</p>
            <h1>{meta?.title ?? "Make room for everyone."}</h1>
            <p>{meta?.tagline}</p>
            <div className="tv-roster">
              {room.players.length ? (
                room.players.slice(0, 24).map((p) => (
                  <span key={p.id}>
                    {p.name}
                    {!p.connected ? " · offline" : ""}
                  </span>
                ))
              ) : (
                <p>Players appear here when the host lets them in.</p>
              )}
            </div>
            {room.players.length > 24 && (
              <p>+ {room.players.length - 24} more players in the room</p>
            )}
            <p>
              Pick your name on your own phone or PC. The host starts when
              everyone’s here.
            </p>
          </section>
          <aside>
            {qr && (
              <img
                src={qr}
                width={240}
                height={240}
                alt="Scan to join as a player"
              />
            )}
            <strong>{room.code}</strong>
            <p>Scan. Join. Play.</p>
          </aside>
        </div>
      ) : (
        <>
          <div className="tv-game-heading">
            <p className="eyebrow">
              {meta?.title} · {g.charades ? "Turn" : "Round"} {g.round} /{" "}
              {g.rounds}
            </p>
            {g.paused && <p className="notice">{g.pauseReason}</p>}
            {g.notice && <p className="notice">{g.notice}</p>}
          </div>
          {g.phase === "instructions" ? (
            <section className="tv-instructions">
              <h1>{meta?.tagline}</h1>
              <ol>
                {meta?.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p>Use your own controller. The host starts the first round.</p>
            </section>
          ) : g.phase === "final" ? (
            <section className="tv-final">
              <h1>{g.charades?.outcome ?? "That’s a game night."}</h1>
              {room.players.length > 10 && (
                <p>Top 10 · everyone’s score is on their controller</p>
              )}
              {scores}
              <p>The host can play again or choose another game.</p>
            </section>
          ) : (
            <section className="tv-game-content">
              {g.survival && (
                <>
                  <h1>
                    {g.phase === "reveal"
                      ? "Answers & points"
                      : g.survival.question}
                  </h1>
                  {g.survival.answers ? (
                    <div className="tv-answer-reveal">
                      <p>{g.survival.answers.quizQuestion}</p>
                      <h2>{g.survival.answers.quiz}</h2>
                      <p>{g.survival.answers.repairQuestion}</p>
                      <h2>{g.survival.answers.repair}</h2>
                      <p>{g.survival.answers.explanation}</p>
                    </div>
                  ) : (
                    <div className="tv-options">
                      {g.survival.options.map((o, i) => (
                        <article key={o.id}>
                          <b>{String.fromCharCode(65 + i)}</b>
                          {o.text}
                        </article>
                      ))}
                    </div>
                  )}
                </>
              )}
              {g.cards && (
                <>
                  <h1>{g.cards.prompt}</h1>
                  {g.phase === "allocate" ? (
                    <p>
                      Players choose a private card. {name(g.cards.judgeId)}{" "}
                      judges this round.
                    </p>
                  ) : (
                    <div className="tv-options">
                      {g.cards.options
                        .slice(page * 6, page * 6 + 6)
                        .map((o) => (
                          <article key={o.id}>
                            {o.text}
                            {o.authorId && (
                              <small>
                                {name(o.authorId)}
                                {o.authorId === g.cards!.winnerId
                                  ? " · winner"
                                  : ""}
                              </small>
                            )}
                          </article>
                        ))}
                    </div>
                  )}
                  {pageCount > 1 && (
                    <p>
                      Plays {page * 6 + 1}–
                      {Math.min((page + 1) * 6, g.cards.options.length)} of{" "}
                      {g.cards.options.length} · cycles every 8 seconds. Judge
                      sees every play on their controller.
                    </p>
                  )}
                </>
              )}
              {g.crowd && (
                <>
                  <h1>{g.scenario.brief}</h1>
                  <div className="tv-projects">
                    {g.scenario.projects.map((p, i) => (
                      <article key={p.name}>
                        <b>{String.fromCharCode(65 + i)}</b>
                        <h2>{p.name}</h2>
                        <p>{p.description}</p>
                        {g.phase === "reveal" && (
                          <strong>
                            {g.crowd!.totals[i]} votes{" "}
                            {g.crowd!.winners.includes(i) ? "· winner" : ""}
                          </strong>
                        )}
                      </article>
                    ))}
                  </div>
                </>
              )}
              {g.bluff && (
                <>
                  <h1>{g.bluff.term}</h1>
                  {g.phase === "reveal" ? (
                    <div className="tv-answer-reveal">
                      <h2>{g.bluff.truth}</h2>
                      <div className="tv-options">
                        {g.bluff.options
                          .slice(page * 6, page * 6 + 6)
                          .map((o) => (
                            <article key={o.id}>
                              {o.text}
                              <small>
                                {o.truth
                                  ? "True meaning"
                                  : o.authors.length
                                    ? `Bluff by ${o.authors.map(name).join(" & ")}`
                                    : "House bluff"}{" "}
                                · {o.voters.length} votes
                              </small>
                            </article>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p>
                      {g.phase === "allocate"
                        ? "Write a convincing fake meaning on your controller."
                        : "Find the real meaning on your own screen. Your two choices stay private."}
                    </p>
                  )}
                </>
              )}
              {g.charades && (
                <>
                  <h1>
                    {g.phase === "reveal"
                      ? `${g.charades.correct} guessed!`
                      : `${g.charades.guesserName} is guessing`}
                  </h1>
                  <p>
                    {g.phase === "vote"
                      ? `Category: ${g.charades.category}. Clue-givers use their own screens; the word stays hidden here.`
                      : "The guesser taps I’m ready on their controller."}
                  </p>
                  {g.charades.teams && (
                    <div className="tv-scores">
                      {g.charades.teams.map((t) => (
                        <span key={t.name}>
                          {t.name}
                          <b>{t.score}</b>
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
              {g.phase !== "reveal" && !g.charades && (
                <p className="tv-progress">
                  {g.submitted} / {g.eligible} submitted
                </p>
              )}
              {g.phase === "reveal" && (
                <>
                  {room.players.length > 10 && (
                    <p>Top 10 · everyone’s score is on their controller</p>
                  )}
                  {scores}
                </>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
