import { test } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import { JSDOM } from "jsdom";
import { ArcadeGame } from "../server/games/arcade.js";
import { ArcadePanel } from "../client/arcade-games.js";
import { games } from "../shared/games.js";
import type { RoomView } from "../shared/types.js";
const people = [
  { id: "a", name: "Alex" },
  { id: "b", name: "Blair" },
  { id: "c", name: "Casey" },
];
function room(game: ArcadeGame): RoomView {
  return {
    id: "test",
    code: "ABC234",
    role: "player",
    playerId: "a",
    locked: false,
    hostConnected: true,
    players: people.map((p) => ({
      ...p,
      connected: true,
      score: game.score(p.id),
    })),
    pending: [],
    games,
    selectedGame: game.key,
    game: {
      ...game.publicView(),
      deadline: null,
      remainingMs: null,
      paused: false,
      pauseReason: null,
    },
    private: game.privateView("a"),
    joinUrl: "http://boxgame.test/join?code=ABC234",
    now: Date.now(),
    expiresAt: Date.now() + 100000,
    revision: 1,
    duration: 45,
  };
}
test("new phone controls submit numeric, text, map, rapid, drawing and sound answers; pause disables input", async () => {
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
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify(["M0,0L100,0L100,100Z"]), {
      headers: { "content-type": "application/json" },
    });
  const { createRoot } = await import("react-dom/client"),
    root = createRoot(document.getElementById("root")!);
  const calls: { event: string; data?: Record<string, unknown> }[] = [];
  const action = async (event: string, data?: Record<string, unknown>) => {
    calls.push({ event, data });
  };
  const render = async (game: ArcadeGame, locked = false) => {
    await act(async () =>
      root.render(
        React.createElement(ArcadePanel, {
          room: room(game),
          locked,
          gameAction: action,
        }),
      ),
    );
  };
  const tap = async (selector: string) => {
    const button = document.querySelector<HTMLButtonElement>(selector);
    assert.ok(button, selector);
    assert.equal(button.disabled, false, selector);
    await act(async () => button.click());
  };
  const type = async (value: string) => {
    const input = document.querySelector<HTMLInputElement>("#arcade-answer")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        dom.window.HTMLInputElement.prototype,
        "value",
      )!.set!.call(input, value);
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
  };
  try {
    for (const [key, value, expected] of [
      ["time-tangle", "1980", { year: 1980 }],
      ["mic-check", "David Bowie", { text: "David Bowie" }],
      ["rare-find", "Mars", { text: "Mars" }],
    ] as const) {
      const game = new ArcadeGame(people, key);
      game.advance();
      await render(game);
      await type(value);
      await tap("form .primary");
      assert.deepEqual(calls.at(-1), { event: "game:submit", data: expected });
      await render(game, true);
      assert.equal(
        document.querySelector<HTMLButtonElement>("form .primary")!.disabled,
        true,
      );
    }
    const map = new ArcadeGame(people, "world-wander");
    map.advance();
    await render(map);
    const svg = document.querySelector<SVGSVGElement>(".geo-map > svg")!;
    svg.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
      right: 1000,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    await act(async () =>
      svg.dispatchEvent(
        new dom.window.MouseEvent("click", {
          bubbles: true,
          clientX: 500,
          clientY: 250,
        }),
      ),
    );
    await tap(".arcade-board>.button");
    assert.deepEqual(calls.at(-1), {
      event: "game:submit",
      data: { lat: 0, lon: 0 },
    });
    const rapid = new ArcadeGame(people, "creature-check");
    rapid.advance();
    await render(rapid);
    assert.equal(
      document.querySelector<HTMLButtonElement>(".arcade-board>.button")!
        .disabled,
      true,
    );
    for (let i = 1; i <= 6; i++)
      await tap(`fieldset:nth-child(${i}) button:first-of-type`);
    await tap(".arcade-board>.button");
    assert.deepEqual(calls.at(-1)!.data, {
      checks: [true, true, true, true, true, true],
    });
    const draw = new ArcadeGame(people, "odd-canvas");
    draw.advance();
    await render(draw);
    const pad = document.querySelector<SVGSVGElement>(".drawing-pad")!;
    pad.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 255,
      height: 255,
      right: 255,
      bottom: 255,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    await act(async () => {
      const e = new dom.window.MouseEvent("pointerdown", {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      });
      Object.defineProperty(e, "pointerId", { value: 1 });
      pad.dispatchEvent(e);
      pad.dispatchEvent(
        new dom.window.MouseEvent("pointerup", { bubbles: true }),
      );
    });
    await tap(".sketch-controller>.primary");
    assert.equal(calls.at(-1)!.event, "game:submit");
    assert.ok(Array.isArray(calls.at(-1)!.data!.strokes));
    const sound = new ArcadeGame(people, "echo-box");
    sound.advance();
    await render(sound);
    assert.ok(document.body.textContent!.includes("Watch without sound"));
    await tap(".sound-choices button");
    await tap(".arcade-board>.primary");
    assert.ok(calls.at(-1)!.data!.choiceId);
  } finally {
    await act(async () => root.unmount());
    globalThis.fetch = realFetch;
    dom.window.close();
  }
});
