import { test } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { GameLibrary, PocketCircuit } from "../client/game-library.js";
import { ScreenStage } from "../client/screen.js";
import { CharadesGame } from "../server/games/charades.js";
import { games } from "../shared/games.js";
import type { RoomView } from "../shared/types.js";

test("library setup modes select a game and phone hosting; local turns require a handoff", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "http://boxgame.test",
  });
  for (const [key, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
  }))
    Object.defineProperty(globalThis, key, { value, configurable: true });
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const { createRoot } = await import("react-dom/client"),
    root = createRoot(document.getElementById("root")!);
  const calls: unknown[] = [];
  const tap = async (selector: string) => {
    const b = document.querySelector<HTMLButtonElement>(selector);
    assert.ok(b);
    assert.equal(b.disabled, false);
    await act(async () => b.click());
  };
  try {
    await act(async () =>
      root.render(
        React.createElement(GameLibrary, {
          create: (...args) => calls.push(args),
          busy: false,
          navigate: () => {},
          code: "",
          setCode: () => {},
        }),
      ),
    );
    assert.equal(document.querySelectorAll(".library-card").length, 5);
    await tap(".library-card .primary");
    assert.deepEqual(calls.at(-1), ["blackout-run", false]);
    await tap("#tab-phone");
    await tap(".library-card .primary");
    assert.deepEqual(calls.at(-1), ["blackout-run", true]);
    await tap("#tab-pass");
    assert.equal(document.querySelectorAll(".library-card").length, 1);
    await tap(".library-card .primary");
    assert.match(document.body.textContent!, /How many people/);
    await tap(".pocket-game .primary");
    assert.match(document.body.textContent!, /Pass to Player 1/);
    assert.equal(document.querySelector(".pocket-challenge"), null);
    await tap(".pocket-game .primary");
    assert.ok(document.querySelector(".pocket-challenge"));
    assert.match(document.body.textContent!, /20s/);
    await tap(".pocket-game .button-row .primary");
    assert.match(document.body.textContent!, /Pass to Player 2/);
    assert.equal(document.querySelector(".pocket-challenge"), null);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("shared screen DOM ignores private state and never renders controller actions or the live clue word", () => {
  const engine = new CharadesGame([
    { id: "a", name: "Alex" },
    { id: "b", name: "Blair" },
  ]);
  engine.advance();
  const view = engine.publicView();
  const room: RoomView = {
    id: "test",
    code: "ABC234",
    role: "display",
    playerId: null,
    locked: false,
    hostConnected: true,
    players: [],
    pending: [],
    games,
    selectedGame: "clue-crew",
    game: {
      ...view,
      deadline: null,
      remainingMs: null,
      paused: false,
      pauseReason: null,
    },
    private: { charades: { word: "PRIVATE_WORD_MUST_NEVER_APPEAR" } } as any,
    joinUrl: "http://boxgame.test/join?code=ABC234",
    now: Date.now(),
    expiresAt: Date.now() + 10000,
    revision: 1,
    duration: 45,
  };
  const html = renderToStaticMarkup(React.createElement(ScreenStage, { room }));
  assert.ok(!html.includes("PRIVATE_WORD_MUST_NEVER_APPEAR"));
  assert.ok(!html.includes("<button"));
  assert.ok(html.includes("ABC234"));
});
