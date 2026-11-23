import React from "react";
import type { RoomView } from "../shared/types.js";
import { defaultSettings } from "../shared/settings.js";
type Action = (event: string, data?: Record<string, unknown>) => Promise<void>;
export function RoomOptions({
  room,
  busy,
  action,
}: {
  room: RoomView;
  busy: boolean;
  action: Action;
}) {
  const settings = room.settings ?? defaultSettings();
  return (
    <section className="room-options">
      <h2>Make it your game</h2>
      {room.selectedGame === "odd-canvas" && (
        <label>
          Drawing category
          <select
            aria-label="Drawing category"
            value={settings.drawingCategory ?? "mixed"}
            disabled={busy}
            onChange={(e) =>
              action("host:settings", { drawingCategory: e.target.value })
            }
          >
            {[
              { id: "mixed", name: "A bit of everything" },
              { id: "movies", name: "Movies" },
              { id: "games", name: "Video games & board games" },
              { id: "sports", name: "Sport" },
              { id: "creatures", name: "Original creatures" },
              { id: "everyday", name: "Everyday chaos" },
            ].map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {room.selectedGame === "blackout-run" && (
        <label>
          Trivia difficulty
          <select
            aria-label="Trivia difficulty"
            value={settings.difficulty}
            disabled={busy}
            onChange={(e) =>
              action("host:settings", { difficulty: e.target.value })
            }
          >
            <option value="casual">Casual · easier questions</option>
            <option value="mixed">Mixed · medium then hard</option>
            <option value="hard">Hard · all six rounds</option>
          </select>
        </label>
      )}
      {room.selectedGame === "clue-crew" && (
        <>
          <label>
            Clue Crew mode
            <select
              aria-label="Clue Crew mode"
              value={room.players.length > 8 ? "teams" : settings.clueMode}
              disabled={busy}
              onChange={(e) =>
                action("host:settings", { clueMode: e.target.value })
              }
            >
              <option value="solo" disabled={room.players.length > 8}>
                Everyone helps · individual scores
              </option>
              <option value="teams">Two teams · 4+ players</option>
            </select>
          </label>
          {(settings.clueMode === "teams" || room.players.length > 8) && (
            <>
              <label>
                Team target
                <select
                  aria-label="Team target"
                  value={settings.teamTarget}
                  disabled={busy}
                  onChange={(e) =>
                    action("host:settings", {
                      teamTarget: Number(e.target.value),
                    })
                  }
                >
                  {[10, 15, 20].map((target) => (
                    <option key={target} value={target}>
                      {target} points
                    </option>
                  ))}
                </select>
              </label>
              <p>
                Groups above eight use teams to keep the game short. At least
                two players per team. Teams alternate; both get equal turns. Up
                to six turns each.
              </p>
              <div className="team-picker">
                {room.players.map((p, index) => (
                  <label key={p.id}>
                    {p.name}
                    {!p.connected ? " · offline" : ""}
                    <select
                      aria-label={`Team for ${p.name}`}
                      disabled={busy}
                      value={settings.teams[p.id] ?? index % 2}
                      onChange={(e) =>
                        action("host:settings", {
                          teams: {
                            [p.id]: Number(e.target.value),
                          },
                        })
                      }
                    >
                      <option value={0}>Team Lime</option>
                      <option value={1}>Team Coral</option>
                    </select>
                  </label>
                ))}
              </div>
            </>
          )}
        </>
      )}
      <label className="check-option">
        <input
          type="checkbox"
          checked={settings.carryScores}
          disabled={busy}
          onChange={(e) =>
            action("host:settings", { carryScores: e.target.checked })
          }
        />
        Keep a session scoreboard across games
      </label>
      <p>
        Game scores still start at zero. Session totals are just for this room;
        games have different scoring scales.
      </p>
      <SessionScores room={room} />
      {(room.contentUsed ?? 0) > 0 && (
        <div className="room-reset">
          <p>
            {room.contentUsed} content items dealt or reserved. Fresh games
            avoid them until you reset.
          </p>
          <button
            className="button subtle small"
            disabled={busy}
            onClick={() => action("host:reset-content")}
          >
            Reset used content · allow repeats
          </button>
        </div>
      )}
      {!!room.standings?.some((p) => p.games > 0) && (
        <button
          className="button subtle small"
          disabled={busy}
          onClick={() => action("host:reset-scores")}
        >
          Reset session scores
        </button>
      )}
    </section>
  );
}
export function SessionScores({ room }: { room: RoomView }) {
  if (!room.settings?.carryScores || !room.standings?.length) return null;
  return (
    <section className="session-scores" aria-label="Session scoreboard">
      <h3>Tonight’s running total</h3>
      {[...room.standings]
        .sort((a, b) => b.points - a.points)
        .map((p) => (
          <div key={p.id}>
            <strong>{p.name}</strong>
            <span>
              {p.points} pts · {p.games} games
            </span>
          </div>
        ))}
    </section>
  );
}
