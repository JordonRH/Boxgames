import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Play,
  RotateCcw,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { RoomView } from "../shared/types.js";
import type { InkStroke, ArcadeView } from "../shared/arcade.js";
type Point = { lat: number; lon: number };
const colors = ["#182510", "#e16f56", "#7760ad", "#258c99", "#ffffff"];
export function Ink({ strokes }: { strokes: InkStroke[] }) {
  return (
    <svg viewBox="0 0 255 255" aria-label="Sketch">
      <rect width="255" height="255" fill="#f2f3e8" />
      {strokes.map((s, i) =>
        s.points.length === 1 ? (
          <circle
            key={i}
            cx={s.points[0][0]}
            cy={s.points[0][1]}
            r="2"
            fill={colors[s.color]}
          />
        ) : (
          <polyline
            key={i}
            points={s.points.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke={colors[s.color]}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ),
      )}
    </svg>
  );
}
export function SketchPad({
  locked,
  onSubmit,
}: {
  locked: boolean;
  onSubmit: (strokes: InkStroke[]) => void;
}) {
  const [strokes, setStrokes] = useState<InkStroke[]>([]),
    [color, setColor] = useState(0);
  const active = useRef<number | null>(null);
  const count = strokes.reduce((n, s) => n + s.points.length, 0);
  const point = (e: React.PointerEvent<SVGSVGElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [
      Math.max(
        0,
        Math.min(255, Math.round(((e.clientX - r.left) / r.width) * 255)),
      ),
      Math.max(
        0,
        Math.min(255, Math.round(((e.clientY - r.top) / r.height) * 255)),
      ),
    ];
  };
  return (
    <div className="sketch-controller">
      <div className="ink-tools">
        {colors.map((c, i) => (
          <button
            key={c}
            aria-label={`Ink colour ${["ink", "coral", "violet", "blue", "white"][i]}`}
            aria-pressed={i === color}
            style={{ background: c }}
            disabled={locked}
            onClick={() => setColor(i)}
          />
        ))}
        <button
          className="button subtle small"
          aria-label="Undo last stroke"
          disabled={locked || !strokes.length}
          onClick={() => setStrokes((s) => s.slice(0, -1))}
        >
          <Undo2 size={18} />
        </button>
        <button
          className="button subtle small"
          disabled={locked || !strokes.length}
          onClick={() => setStrokes([])}
        >
          Clear
        </button>
      </div>
      <svg
        className="drawing-pad"
        viewBox="0 0 255 255"
        role="img"
        aria-label="Drawing pad. Draw with your finger, mouse or stylus."
        onPointerDown={(e) => {
          if (
            locked ||
            active.current !== null ||
            e.isPrimary === false ||
            count >= 400 ||
            strokes.length >= 30
          )
            return;
          e.preventDefault();
          active.current = e.pointerId;
          const p = point(e);
          e.currentTarget.setPointerCapture?.(e.pointerId);
          setStrokes((s) => [...s, { color, points: [p] }]);
        }}
        onPointerMove={(e) => {
          if (locked || active.current !== e.pointerId) return;
          const p = point(e);
          setStrokes((s) => {
            if (s.reduce((n, line) => n + line.points.length, 0) >= 400)
              return s;
            const last = s.at(-1);
            if (!last) return s;
            const prev = last.points.at(-1)!;
            if (Math.hypot(p[0] - prev[0], p[1] - prev[1]) < 2) return s;
            return [
              ...s.slice(0, -1),
              { ...last, points: [...last.points, p] },
            ];
          });
        }}
        onPointerUp={() => {
          active.current = null;
        }}
        onPointerCancel={() => {
          active.current = null;
        }}
      >
        <rect width="255" height="255" fill="#f2f3e8" />
        {strokes.map((s, i) =>
          s.points.length === 1 ? (
            <circle
              key={i}
              cx={s.points[0][0]}
              cy={s.points[0][1]}
              r="2"
              fill={colors[s.color]}
            />
          ) : (
            <polyline
              key={i}
              points={s.points.map((p) => p.join(",")).join(" ")}
              fill="none"
              stroke={colors[s.color]}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ),
        )}
      </svg>
      <small>
        {count}/400 ink points · up to 30 strokes. Unsent sketches stay on this
        device.
      </small>
      <button
        className="button primary large full"
        disabled={locked || count === 0}
        onClick={() => onSubmit(strokes)}
      >
        <Check size={20} />
        Submit my sketch
      </button>
    </div>
  );
}
export function GeoMap({
  australia = false,
  value,
  onChange,
  target,
  disabled = false,
}: {
  australia?: boolean;
  value?: Point | null;
  onChange?: (p: Point) => void;
  target?: Point;
  disabled?: boolean;
}) {
  const [paths, setPaths] = useState<string[]>([]),
    [error, setError] = useState(false),
    [zoom, setZoom] = useState(1),
    [center, setCenter] = useState<Point>(
      australia ? { lat: -27, lon: 132.5 } : { lat: 0, lon: 0 },
    );
  useEffect(() => {
    let alive = true;
    fetch("/maps/land.json")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((p) => {
        if (alive) setPaths(p);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  const bounds = australia
      ? { minLat: -45, maxLat: -9, minLon: 110, maxLon: 155 }
      : { minLat: -85, maxLat: 85, minLon: -180, maxLon: 180 },
    w = (bounds.maxLon - bounds.minLon) / zoom,
    h = (bounds.maxLat - bounds.minLat) / zoom;
  const clamp = (p: Point): Point => ({
    lat: Math.max(bounds.minLat, Math.min(bounds.maxLat, p.lat)),
    lon: Math.max(bounds.minLon, Math.min(bounds.maxLon, p.lon)),
  });
  const c = clamp(center),
    left = Math.max(bounds.minLon, Math.min(bounds.maxLon - w, c.lon - w / 2)),
    top = Math.min(bounds.maxLat, Math.max(bounds.minLat + h, c.lat + h / 2));
  const x = (lon: number) => ((lon + 180) * 1000) / 360,
    y = (lat: number) => ((90 - lat) * 500) / 180;
  const marker = (p: Point, color: string) => (
    <g>
      <circle
        cx={x(p.lon)}
        cy={y(p.lat)}
        r={5 / zoom}
        fill={color}
        stroke="#111610"
        strokeWidth={1 / zoom}
      />
      <circle cx={x(p.lon)} cy={y(p.lat)} r={1.3 / zoom} fill="#111610" />
    </g>
  );
  const pan = (lat: number, lon: number) =>
    setCenter(
      clamp({ lat: c.lat + (lat * h) / 4, lon: c.lon + (lon * w) / 4 }),
    );
  return (
    <div className={`geo-map ${australia ? "map-australia" : ""}`}>
      <div className="map-controls">
        <button
          className="button subtle small"
          aria-label="Zoom in"
          onClick={() => {
            if (value) setCenter(value);
            setZoom((z) => Math.min(8, z * 2));
          }}
          disabled={zoom === 8}
        >
          <ZoomIn size={18} />
        </button>
        <button
          className="button subtle small"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(1, z / 2))}
          disabled={zoom === 1}
        >
          <ZoomOut size={18} />
        </button>
        <button
          className="button subtle small"
          aria-label="Pan north"
          onClick={() => pan(1, 0)}
        >
          <ArrowUp size={18} />
        </button>
        <button
          className="button subtle small"
          aria-label="Pan west"
          onClick={() => pan(0, -1)}
        >
          <ArrowLeft size={18} />
        </button>
        <button
          className="button subtle small"
          aria-label="Pan east"
          onClick={() => pan(0, 1)}
        >
          <ArrowRight size={18} />
        </button>
        <button
          className="button subtle small"
          aria-label="Pan south"
          onClick={() => pan(-1, 0)}
        >
          <ArrowDown size={18} />
        </button>
      </div>
      {!paths.length && (
        <p role="status">
          {error
            ? "Map could not load. Reload, or use the coordinate controls below."
            : "Loading map…"}
        </p>
      )}
      <svg
        role="img"
        aria-label="Unlabelled map. Tap to place your pin; arrow keys move it. Coordinate controls are available below."
        tabIndex={onChange && !disabled ? 0 : undefined}
        style={{ aspectRatio: `${w}/${h}` }}
        viewBox={`${x(left)} ${y(top)} ${(w * 1000) / 360} ${(h * 500) / 180}`}
        onClick={(e) => {
          if (!onChange || disabled) return;
          const r = e.currentTarget.getBoundingClientRect();
          onChange(
            clamp({
              lat: top - ((e.clientY - r.top) / r.height) * h,
              lon: left + ((e.clientX - r.left) / r.width) * w,
            }),
          );
        }}
        onKeyDown={(e) => {
          if (!onChange || disabled) return;
          const delta =
            e.key === "ArrowUp"
              ? [1, 0]
              : e.key === "ArrowDown"
                ? [-1, 0]
                : e.key === "ArrowLeft"
                  ? [0, -1]
                  : e.key === "ArrowRight"
                    ? [0, 1]
                    : null;
          if (delta) {
            e.preventDefault();
            const p = value ?? c;
            onChange(
              clamp({
                lat: p.lat + delta[0] / zoom,
                lon: p.lon + delta[1] / zoom,
              }),
            );
          }
        }}
      >
        <rect x="0" y="0" width="1000" height="500" fill="#172e36" />
        {Array.from({ length: 13 }, (_, i) => (
          <path
            key={`lon${i}`}
            d={`M${(i * 1000) / 12},0V500`}
            stroke="#42636d"
            strokeWidth={0.4 / zoom}
          />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <path
            key={`lat${i}`}
            d={`M0,${(i * 500) / 6}H1000`}
            stroke="#42636d"
            strokeWidth={0.4 / zoom}
          />
        ))}
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="#7a9462"
            stroke="#d3e0be"
            strokeWidth={0.45 / zoom}
          />
        ))}
        {value && marker(value, "#ffac91")}
        {target && marker(target, "#d5fa54")}
      </svg>
      <small>
        Made with Natural Earth · {zoom}× zoom
        {target ? " · lime pin = correct location" : ""}
      </small>
      {onChange && (
        <div className="coordinate-controls">
          <label>
            Latitude
            <input
              aria-label="Latitude"
              type="number"
              min={bounds.minLat}
              max={bounds.maxLat}
              step="0.1"
              disabled={disabled}
              value={value ? Number(value.lat.toFixed(2)) : ""}
              onChange={(e) => {
                if (e.target.value !== "")
                  onChange(
                    clamp({
                      lat: Number(e.target.value),
                      lon: value?.lon ?? c.lon,
                    }),
                  );
              }}
            />
          </label>
          <label>
            Longitude
            <input
              aria-label="Longitude"
              type="number"
              min={bounds.minLon}
              max={bounds.maxLon}
              step="0.1"
              disabled={disabled}
              value={value ? Number(value.lon.toFixed(2)) : ""}
              onChange={(e) => {
                if (e.target.value !== "")
                  onChange(
                    clamp({
                      lat: value?.lat ?? c.lat,
                      lon: Number(e.target.value),
                    }),
                  );
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
export function TonePlayer({
  notes,
  disabled = false,
}: {
  notes: number[];
  disabled?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null),
    [message, setMessage] = useState("");
  const generation = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]),
    audio = useRef<AudioContext | null>(null);
  const stop = () => {
    generation.current++;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    void audio.current?.close().catch(() => {});
    audio.current = null;
  };
  useEffect(() => {
    if (disabled) {
      stop();
      setActive(null);
    }
    return stop;
  }, [disabled, notes.join(",")]);
  const play = async (sound: boolean) => {
    stop();
    setMessage("");
    const version = generation.current;
    let context: AudioContext | null = null;
    if (sound) {
      try {
        const Context =
          window.AudioContext ?? (window as any).webkitAudioContext;
        context = new Context();
        audio.current = context;
        await context!.resume();
      } catch {
        setMessage(
          "Audio is unavailable. Watch the highlighted pitches instead.",
        );
      }
    }
    if (version !== generation.current) return;
    notes.forEach((n, i) => {
      timers.current.push(setTimeout(() => setActive(i), i * 600));
      if (context) {
        const oscillator = context.createOscillator(),
          gain = context.createGain(),
          at = context.currentTime + i * 0.6;
        oscillator.type = "sine";
        oscillator.frequency.value = [261.63, 329.63, 392, 493.88, 587.33][n];
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(0.12, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.4);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(at);
        oscillator.stop(at + 0.45);
      }
    });
    timers.current.push(
      setTimeout(() => {
        setActive(null);
        void context?.close().catch(() => {});
        audio.current = null;
      }, notes.length * 600),
    );
  };
  return (
    <section className="tone-player">
      <div className="pitch-bars" aria-label="Four-note pitch pattern">
        {notes.map((n, i) => (
          <div key={i} className={active === i ? "pitch-active" : ""}>
            <span
              style={{ height: active === i ? `${28 + n * 15}%` : "15%" }}
            />
            <small>
              {active === i
                ? ["low", "low-mid", "middle", "high-mid", "high"][n]
                : "•"}
            </small>
          </div>
        ))}
      </div>
      <div className="button-row">
        <button
          className="button primary"
          disabled={disabled}
          onClick={() => void play(true)}
        >
          <Play size={18} />
          Play pattern
        </button>
        <button
          className="button subtle"
          disabled={disabled}
          onClick={() => void play(false)}
        >
          Watch without sound
        </button>
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
function Gallery({
  room,
  locked,
  gameAction,
  display = false,
}: {
  room: RoomView;
  locked: boolean;
  gameAction?: (event: string, data: Record<string, unknown>) => void;
  display?: boolean;
}) {
  const a = room.game!.arcade!,
    gallery = a.gallery ?? [],
    [page, setPage] = useState(0),
    pages = Math.max(1, Math.ceil(gallery.length / 6));
  useEffect(() => {
    setPage(0);
    if (!display || pages === 1) return;
    const timer = setInterval(() => setPage((p) => (p + 1) % pages), 8000);
    return () => clearInterval(timer);
  }, [display, pages, room.game!.phaseId]);
  const choices = new Set(room.private?.arcade?.choices ?? []),
    voting = room.game!.phase === "vote",
    submitted = room.private?.arcade?.submitted;
  const items = display ? gallery.slice(page * 6, page * 6 + 6) : gallery;
  return (
    <>
      <div className="sketch-gallery">
        {items.map((g) => (
          <article key={g.id}>
            <img
              src={`/api/art/${room.code}/${g.id}.svg`}
              width="255"
              height="255"
              alt="Player-created sketch"
              loading="lazy"
            />
            {voting && !display && choices.has(g.id) && (
              <button
                className="button primary full"
                disabled={locked || submitted}
                onClick={() => gameAction?.("game:vote", { choiceId: g.id })}
              >
                Vote for this sketch
              </button>
            )}
            {voting && !display && !choices.has(g.id) && (
              <p>Your sketch · no self-votes</p>
            )}
            {g.authorId && (
              <p>
                <strong>
                  {room.players.find((p) => p.id === g.authorId)?.name ??
                    "Removed player"}
                </strong>{" "}
                · {g.votes} votes
              </p>
            )}
          </article>
        ))}
      </div>
      {display && pages > 1 && (
        <p>
          Gallery page {page + 1} / {pages} · changes every 8 seconds. Vote from
          your own device.
        </p>
      )}
    </>
  );
}
export function ArcadeStage({ room }: { room: RoomView }) {
  const a = room.game!.arcade!,
    reveal = a.reveal;
  return (
    <section className="arcade-stage">
      <h1>{a.prompt}</h1>
      {a.clue && <p className="artist-clue">{a.clue}</p>}
      {(a.kind === "world" || a.kind === "australia") && (
        <GeoMap
          australia={a.kind === "australia"}
          target={
            reveal?.lat === undefined
              ? undefined
              : { lat: reveal.lat, lon: reveal.lon! }
          }
        />
      )}
      {a.kind === "sound" && (
        <TonePlayer notes={a.notes!} disabled={room.game!.paused} />
      )}{" "}
      {a.kind === "rapid" && !reveal && (
        <div className="creature-wall">
          {a.claims?.map((c) => (
            <span key={c.id}>{c.text}</span>
          ))}
        </div>
      )}
      {a.kind === "drawing" && (
        <>
          <p>
            {a.category} ·{" "}
            {room.game!.phase === "allocate"
              ? "Draw on your own controller. The gallery opens when everyone is ready or time runs out."
              : "Vote on your own controller."}
          </p>
          {room.game!.phase !== "allocate" && (
            <Gallery room={room} locked display />
          )}
        </>
      )}
      {reveal && (
        <>
          <h2 className="arcade-answer">{reveal.answer}</h2>
          {reveal.source && (
            <a
              className="answer-source"
              href={reveal.source}
              target="_blank"
              rel="noreferrer"
            >
              Answer source ↗
            </a>
          )}
          {reveal.checks && (
            <div className="creature-wall">
              {reveal.checks.map((c) => (
                <span key={c.text}>
                  {c.text}
                  <b>{c.real ? "Real" : "Invented"}</b>
                </span>
              ))}
            </div>
          )}
          <div className="arcade-results">
            {[...reveal.rows]
              .sort((a, b) => b.points - a.points)
              .slice(0, 10)
              .map((row) => (
                <p key={row.id}>
                  <strong>
                    {room.players.find((p) => p.id === row.id)?.name ??
                      "Removed player"}
                  </strong>
                  <span>{row.answer}</span>
                  <b>+{row.points}</b>
                </p>
              ))}
          </div>
          {reveal.rows.length > 10 && (
            <p>
              Top ten this round. Everyone has their own result on their
              controller.
            </p>
          )}
        </>
      )}
    </section>
  );
}
export function ArcadePanel({
  room,
  locked,
  gameAction,
}: {
  room: RoomView;
  locked: boolean;
  gameAction: (event: string, data?: Record<string, unknown>) => Promise<void>;
}) {
  const g = room.game!,
    a = g.arcade!,
    p = room.private?.arcade,
    playing = !!room.playerId,
    own = a.reveal?.rows.find((r) => r.id === room.playerId);
  return (
    <section className="arcade-board">
      {playing && g.phase === "reveal" && own && (
        <div className="your-arcade-result">
          <span>Your answer: {own.answer}</span>
          <strong>+{own.points} points</strong>
        </div>
      )}
      {!playing || g.phase === "reveal" ? (
        <>
          <ArcadeStage room={room} />
          {playing && a.kind === "drawing" && g.phase === "reveal" && (
            <p>
              The gallery above shows the first page on shared displays. Your
              complete round gallery:
            </p>
          )}
          {playing && a.kind === "drawing" && g.phase === "reveal" && (
            <Gallery room={room} locked />
          )}
        </>
      ) : (
        <>
          <h1>{a.prompt}</h1>
          {a.clue && <p className="artist-clue">{a.clue}</p>}
          {a.kind === "drawing" && g.phase === "vote" ? (
            <>
              <p>
                Pick one favourite. Votes and artists are revealed together.
              </p>
              <Gallery room={room} locked={locked} gameAction={gameAction} />
              {p?.submitted && (
                <p role="status">Vote locked. Waiting for the room.</p>
              )}
            </>
          ) : p?.submitted ? (
            <div className="arcade-submitted" role="status">
              <Check size={32} />
              <h2>
                {a.kind === "artist" && g.phase === "vote"
                  ? "Your first guess was correct!"
                  : "Locked in."}
              </h2>
              <p>
                Waiting for the room.{" "}
                {p.answer ? `Your answer: ${p.answer}` : ""}
              </p>
            </div>
          ) : (
            <ArcadeInput
              key={`${g.id}:${g.phaseId}`}
              room={room}
              locked={locked}
              gameAction={gameAction}
            />
          )}
        </>
      )}
    </section>
  );
}
function ArcadeInput({
  room,
  locked,
  gameAction,
}: {
  room: RoomView;
  locked: boolean;
  gameAction: (event: string, data?: Record<string, unknown>) => Promise<void>;
}) {
  const g = room.game!,
    a = g.arcade!,
    [value, setValue] = useState(room.private?.arcade?.answer ?? ""),
    [pin, setPin] = useState<Point | null>(null),
    [checks, setChecks] = useState<(boolean | null)[]>(Array(6).fill(null)),
    [choice, setChoice] = useState("");
  const send = (data: Record<string, unknown>) =>
    gameAction(g.phase === "vote" ? "game:vote" : "game:submit", data);
  if (a.kind === "drawing")
    return (
      <SketchPad
        locked={locked}
        onSubmit={(strokes) => void send({ strokes })}
      />
    );
  if (a.kind === "world" || a.kind === "australia")
    return (
      <>
        <GeoMap
          australia={a.kind === "australia"}
          value={pin}
          onChange={setPin}
          disabled={locked}
        />
        <button
          className="button primary large full"
          disabled={locked || !pin}
          onClick={() => pin && void send(pin)}
        >
          <Check size={20} />
          Lock my pin
        </button>
      </>
    );
  if (a.kind === "rapid")
    return (
      <>
        <div className="rapid-choices">
          {a.claims!.map((c, i) => (
            <fieldset key={c.id} disabled={locked}>
              <legend>
                {i + 1}. {c.text}
              </legend>
              {[true, false].map((real) => (
                <button
                  type="button"
                  key={String(real)}
                  aria-pressed={checks[i] === real}
                  className={`button ${checks[i] === real ? "primary" : "subtle"}`}
                  onClick={() =>
                    setChecks((s) => s.map((v, n) => (n === i ? real : v)))
                  }
                >
                  {real ? "Real animal" : "Invented"}
                </button>
              ))}
            </fieldset>
          ))}
        </div>
        <button
          className="button primary large full"
          disabled={locked || checks.some((v) => v === null)}
          onClick={() => void send({ checks })}
        >
          Lock all six choices
          <Check size={20} />
        </button>
      </>
    );
  if (a.kind === "sound")
    return (
      <>
        <p>
          Listen or watch on the shared screen. You can replay the pattern here
          too.
        </p>
        <TonePlayer notes={a.notes!} disabled={locked} />
        <div className="sound-choices">
          {a.choices!.map((o) => (
            <button
              className={`button ${choice === o.id ? "primary" : "subtle"}`}
              disabled={locked}
              aria-pressed={choice === o.id}
              key={o.id}
              onClick={() => setChoice(o.id)}
            >
              {o.text}
            </button>
          ))}
        </div>
        <button
          className="button primary large full"
          disabled={locked || !choice}
          onClick={() => void send({ choiceId: choice })}
        >
          Lock my pattern
          <Check size={20} />
        </button>
      </>
    );
  const year = a.kind === "year";
  return (
    <form
      className="arcade-answer-form"
      onSubmit={(e) => {
        e.preventDefault();
        void send(year ? { year: Number(value) } : { text: value });
      }}
    >
      <label htmlFor="arcade-answer">
        {year
          ? "Which year?"
          : a.kind === "artist"
            ? "Artist or act name"
            : "Your answer"}
      </label>
      <input
        id="arcade-answer"
        type={year ? "number" : "text"}
        inputMode={year ? "numeric" : "text"}
        min={year ? 1000 : undefined}
        max={year ? 2100 : undefined}
        step={year ? 1 : undefined}
        maxLength={year ? 4 : 80}
        autoComplete="off"
        spellCheck={false}
        disabled={locked}
        placeholder={
          year
            ? "e.g. 1980"
            : a.kind === "artist"
              ? "Type a name"
              : "Think differently…"
        }
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        className="button primary large full"
        disabled={
          locked ||
          !value.trim() ||
          (year &&
            (!/^\d{4}$/.test(value) ||
              Number(value) < 1000 ||
              Number(value) > 2100))
        }
      >
        Lock my answer
        <Check size={20} />
      </button>
    </form>
  );
}
