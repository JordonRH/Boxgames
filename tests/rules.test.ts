import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  createGame,
  nextRound,
  rankMatches,
  reveal,
  scoreRound,
} from "../server/games/parcel.js";
import { scenarios } from "../server/games/content.js";
import { networkKey } from "../server/index.js";
import { Limiter, RoomManager } from "../server/rooms/manager.js";
import { Server } from "socket.io";

test("original deck has enough distinct complete scenarios and no repeats in one game", () => {
  assert.equal(scenarios.length, 30);
  assert.equal(new Set(scenarios.map((s) => s.id)).size, 30);
  for (const s of scenarios) {
    assert.equal(s.projects.length, 3);
    assert.ok(s.projects.every((p) => p.name && p.description));
  }
  const game = createGame(
    ["A", "B", "C"].map((id) => ({ id, name: id })),
    randomUUID,
    () => 0.4,
  );
  assert.equal(new Set(game.deck.map((s) => s.id)).size, 6);
  assert.deepEqual([...game.entries.values()].map((p) => p.rank).sort(), [
    "largest",
    "middle",
    "smallest",
  ]);
});
test("rank ties occupy all their positions for every total combination", () => {
  for (let a = 0; a <= 6; a++)
    for (let b = 0; b <= 6; b++)
      for (let c = 0; c <= 6; c++)
        for (let project = 0; project < 3; project++) {
          const totals: [number, number, number] = [a, b, c],
            n = totals[project],
            greater = totals.filter((x) => x > n).length,
            equals = totals.filter((x) => x === n).length;
          for (const [index, rank] of (
            ["largest", "middle", "smallest"] as const
          ).entries())
            assert.equal(
              rankMatches(totals, project, rank),
              index >= greater && index < greater + equals,
            );
        }
});
test("spotlight ties award at most two points; abstentions receive no forecast", () => {
  const game = createGame(
    ["A", "B", "C"].map((id) => ({ id, name: id })),
    randomUUID,
    () => 0.4,
  );
  for (const p of game.entries.values()) {
    p.allocation = [2, 2, 2];
    p.forecast = 0;
    p.vote = null;
  }
  let r = scoreRound(game);
  assert.ok(
    r.rows.every((p) => p.forecastPoints === 3 && p.spotlightPoints === 0),
  );
  [...game.entries.values()].forEach((p, i) => (p.vote = i));
  r = scoreRound(game);
  assert.equal(r.spotlight.length, 3);
  assert.ok(r.rows.every((p) => p.points === 5));
  const p = [...game.entries.values()][0];
  p.allocation = null;
  p.forecast = null;
  r = scoreRound(game);
  assert.equal(r.rows.find((row) => row.id === p.id)?.points, 0);
});
test("reveal is idempotent; next round clears submissions and rotates rank", () => {
  const game = createGame(
    ["A", "B", "C"].map((id) => ({ id, name: id })),
    randomUUID,
    () => 0.4,
  );
  game.phase = "vote";
  for (const p of game.entries.values()) {
    p.allocation = [2, 2, 2];
    p.forecast = 0;
    p.vote = 0;
  }
  reveal(game);
  const scores = [...game.scores.values()];
  reveal(game);
  assert.deepEqual([...game.scores.values()], scores);
  const old = [...game.entries.values()].map((p) => p.rank);
  nextRound(game);
  assert.equal(game.round, 2);
  assert.equal(game.result, null);
  assert.ok(
    [...game.entries.values()].every(
      (p, i) => p.rank !== old[i] && p.allocation === null && p.vote === null,
    ),
  );
});
test("rate buckets expire and IPv6 address forms share a network identity", () => {
  const l = new Limiter();
  assert.ok(l.take("test", 1, 100, 0));
  assert.equal(l.take("test", 1, 100, 1), false);
  assert.ok(l.take("test", 1, 100, 100));
  assert.equal(networkKey("::ffff:192.168.1.2"), "192.168.1.2");
  assert.equal(
    networkKey("2001:db8::1"),
    networkKey("2001:0db8:0:0:1111:2222:3333:4444"),
  );
});
test("codes never overwrite active rooms; codes and limit state are reclaimed", () => {
  let now = 1000;
  const manager = new RoomManager(
    new Server(),
    {
      origin: "http://localhost",
      maxRooms: 100,
      maxConnections: 1000,
      roomsPerNetwork: 5,
      connectionsPerNetwork: 100,
    },
    () => now,
  );
  const generated = new Set<string>();
  for (let i = 0; i < 5000; i++) {
    const code = manager.code();
    assert.match(code, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
    assert.equal(generated.has(code), false);
    generated.add(code);
    manager.codes.set(code, randomUUID());
  }
  manager.quarantine.set("ABC234", 1100);
  now = 1200;
  manager.tick();
  assert.equal(manager.quarantine.size, 0);
  manager.stop();
});
