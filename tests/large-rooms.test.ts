import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { io, type Socket } from "socket.io-client";
import { createApp } from "../server/index.js";
import { CardsGame } from "../server/games/cards.js";
import { CharadesGame } from "../server/games/charades.js";
import type { Ack, RoomView, Session } from "../shared/types.js";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until(check: () => boolean) {
  for (let n = 0; n < 500; n++) {
    if (check()) return;
    await wait(10);
  }
  throw new Error("Large room state timed out");
}
const people = Array.from({ length: 50 }, (_, i) => ({
  id: `p${i}`,
  name: `Friend ${i + 1}`,
}));
test("fifty-player cards has private distinct hands, one refresh, six rounds and finite scores", () => {
  const game = new CardsGame(people);
  assert.equal(game.publicView().rounds, 6);
  assert.match(game.publicView().notice!, /Large group/);
  let judged = 0;
  game.advance();
  for (let round = 1; round <= 6; round++) {
    const judge = game.publicView().cards!.judgeId;
    for (const p of people) {
      const hand = game.privateView(p.id)!.cards!.hand;
      assert.equal(hand.length, 5);
      assert.equal(new Set(hand.map((c) => c.text)).size, 5);
      if (p.id === judge) continue;
      if (round === 1) {
        game.submit(p.id, "submit", { action: "refresh" });
        const fresh = game.privateView(p.id)!.cards!.hand;
        assert.ok(fresh.every((c) => !hand.some((old) => old.text === c.text)));
        assert.throws(() => game.submit(p.id, "submit", { action: "refresh" }));
      }
      game.submit(p.id, "submit", {
        cardId: game.privateView(p.id)!.cards!.hand[0].id,
      });
    }
    assert.equal(game.complete(false), true);
    const options = game.publicView().cards!.options;
    assert.equal(options.length, 49);
    assert.ok(options.every((c) => !("authorId" in c)));
    assert.equal(new Set(options.map((c) => c.id)).size, 49);
    game.submit(judge, "vote", { cardId: options[0].id });
    assert.equal(game.complete(false), true);
    judged++;
    game.advance();
  }
  assert.equal(judged, 6);
  assert.equal(game.final, true);
  assert.equal(
    people.reduce((sum, p) => sum + game.score(p.id), 0),
    6,
  );
  const clue = new CharadesGame(people);
  assert.equal(clue.publicView().rounds, 12);
  assert.equal(clue.publicView().charades!.teams!.length, 2);
  assert.match(clue.publicView().notice!, /Large group/);
});

test("fifty real same-network controllers join one room, bulk-admit and play every online game", async () => {
  const app = createApp({ origin: "http://boxgame.test" });
  await new Promise<void>((r) => app.http.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${(app.http.address() as { port: number }).port}`,
    sockets: Socket[] = [],
    states = new Map<Socket, RoomView>();
  const connect = async () => {
    const s = io(url, {
      forceNew: true,
      reconnection: false,
      transports: ["websocket"],
      extraHeaders: { Origin: "http://boxgame.test" },
    });
    sockets.push(s);
    s.on("room:state", (v) => states.set(s, v));
    await new Promise<void>((resolve, reject) => {
      s.once("connect", resolve);
      s.once("connect_error", () =>
        reject(new Error("Large room connection refused")),
      );
    });
    return s;
  };
  const request = <T = unknown>(
    s: Socket,
    event: string,
    data: unknown = {},
  ): Promise<Ack<T>> =>
    new Promise((resolve, reject) =>
      s
        .timeout(10000)
        .emit(event, data, (e: Error | null, a: Ack<T>) =>
          e ? reject(new Error(`${event} timed out`)) : resolve(a),
        ),
    );
  const must = async <T = unknown>(
    s: Socket,
    event: string,
    data: unknown = {},
  ) => {
    const a = await request<T>(s, event, data);
    assert.ok(a.ok, `${event} must succeed${!a.ok ? `: ${a.error}` : ""}`);
    return a.data;
  };
  const cmd = (s: Socket) => ({
    commandId: randomUUID(),
    gameId: states.get(s)!.game!.id,
    phaseId: states.get(s)!.game!.phaseId,
  });
  try {
    const host = await connect(),
      session = await must<Session>(host, "room:create"),
      players: Socket[] = [];
    for (let i = 0; i < 50; i++) {
      const p = await connect();
      players.push(p);
      await must(p, "room:join", {
        code: session.code,
        name: `Guest ${i + 1}`,
      });
    }
    await until(() => states.get(host)?.pending.length === 50);
    assert.equal(states.get(host)!.playerLimit, null);
    assert.equal((await request(players[0], "host:admit:all")).ok, false);
    await must(host, "host:admit:all");
    await until(() => players.every((s) => states.get(s)?.role === "player"));
    assert.equal(states.get(host)!.players.length, 50);
    for (const gameKey of [
      "crowd-pick",
      "blackout-run",
      "false-front",
      "blank-slate",
      "clue-crew",
    ]) {
      await wait(1100);
      await must(host, "host:game", { gameKey });
      await must(host, "game:start", { commandId: randomUUID() });
      await must(host, "game:advance", cmd(host));
      await until(() =>
        players.every((s) => states.get(s)?.game?.phase === "allocate"),
      );
      if (gameKey === "clue-crew") {
        assert.equal(states.get(host)!.game!.rounds, 12);
        const guesser = players.find(
          (s) =>
            states.get(s)!.playerId ===
            states.get(s)!.game!.charades!.guesserId,
        )!;
        await must(guesser, "game:submit", {
          ...cmd(guesser),
          action: "ready",
        });
        await until(() => states.get(host)!.game!.phase === "vote");
        assert.equal(states.get(guesser)!.private!.charades!.word, null);
      } else {
        for (const [i, p] of players.entries()) {
          const state = states.get(p)!;
          if (gameKey === "blank-slate" && state.private!.cards!.isJudge)
            continue;
          await must(p, "game:submit", {
            ...cmd(p),
            ...(gameKey === "crowd-pick"
              ? { project: 0 }
              : gameKey === "blackout-run"
                ? { optionId: state.game!.survival!.options[0].id }
                : gameKey === "false-front"
                  ? { text: `A ceremonial sock basket number ${i}` }
                  : { cardId: state.private!.cards!.hand[0].id }),
          });
        }
        if (gameKey === "crowd-pick") {
          await until(() => states.get(host)!.game!.phase === "reveal");
          assert.equal(states.get(host)!.game!.crowd!.totals[0], 50);
        } else {
          await until(() =>
            players.every((s) => states.get(s)!.game!.phase === "vote"),
          );
          for (const p of players) {
            const state = states.get(p)!;
            if (gameKey === "blank-slate" && !state.private!.cards!.isJudge)
              continue;
            await must(p, "game:vote", {
              ...cmd(p),
              ...(gameKey === "blank-slate"
                ? { cardId: state.game!.cards!.options[0].id }
                : {
                    optionId: (gameKey === "false-front"
                      ? state.private!.bluff!.options
                      : state.game!.survival!.options)[0].id,
                  }),
            });
          }
          await until(() => states.get(host)!.game!.phase === "reveal");
        }
      }
      await wait(1100);
      await must(host, "game:end", cmd(host));
      await must(host, "game:advance", cmd(host));
      await until(() => players.every((s) => states.get(s)!.game === null));
    }
    await must(host, "room:close");
    await wait(1100);
    app.manager.config.maxPlayersPerRoom = 2;
    const limited = await must<Session>(host, "room:create");
    for (const [i, p] of players.slice(0, 2).entries())
      await must(p, "room:join", { code: limited.code, name: `Limited ${i}` });
    const full = await request(players[2], "room:join", {
      code: limited.code,
      name: "Overflow",
    });
    assert.equal(full.ok, false);
    if (!full.ok) assert.equal(full.error, "room_full");
    assert.equal(states.get(host)!.playerLimit, 2);
    await must(host, "host:admit:all");
    assert.equal(states.get(host)!.players.length, 2);
    assert.equal(
      (await request(host, "host:play", { name: "Host overflow" })).ok,
      false,
    );
    await must(host, "room:close");
  } finally {
    sockets.forEach((s) => s.disconnect());
    await app.stop();
  }
});
