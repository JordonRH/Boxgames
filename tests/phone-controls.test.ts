import { test } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import { JSDOM } from "jsdom";
import { CardsGame } from "../server/games/cards.js";
import { CharadesGame } from "../server/games/charades.js";
import { SurvivalGame } from "../server/games/survival.js";
import { BluffGame } from "../server/games/bluff.js";
import { CrowdGame } from "../server/games/crowd.js";
import type { GameEngine } from "../server/games/core.js";
import type { RoomView } from "../shared/types.js";
import { games } from "../shared/games.js";
import { PartyGame } from "../client/party-games.js";
const people = [
  { id: "a", name: "Alex" },
  { id: "b", name: "Blair" },
  { id: "c", name: "Casey" },
];
function view(engine: GameEngine, id: string | null, host = false): RoomView {
  return {
    id: "test-room",
    code: "ABC234",
    role: host ? "host" : "player",
    playerId: id,
    locked: false,
    hostConnected: true,
    players: people.map((p) => ({
      ...p,
      connected: true,
      score: engine.score(p.id),
    })),
    pending: [],
    games,
    selectedGame: engine.publicView().gameKey!,
    game: {
      ...engine.publicView(),
      deadline: null,
      remainingMs: null,
      paused: false,
      pauseReason: null,
    },
    private: engine.privateView(id ?? undefined),
    joinUrl: "http://boxgame.test/join?code=ABC234",
    now: Date.now(),
    expiresAt: Date.now() + 3600000,
    revision: 1,
    duration: 45,
  };
}
test("phone and host-player DOM controls are enabled and submit the chosen game action", async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: "http://boxgame.test",
  });
  Object.defineProperty(globalThis, "window", {
    value: dom.window,
    configurable: true,
  });
  Object.defineProperty(globalThis, "document", {
    value: dom.window.document,
    configurable: true,
  });
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
  });
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(document.getElementById("root")!);
  const calls: { event: string; data?: Record<string, unknown> }[] = [];
  const action = async (event: string, data?: Record<string, unknown>) => {
    calls.push({ event, data });
  };
  const render = async (room: RoomView) =>
    act(async () =>
      root.render(
        React.createElement(PartyGame, {
          room,
          busy: false,
          gameAction: action,
          end: () => {},
        }),
      ),
    );
  const tap = async (selector: string) => {
    const button = document.querySelector<HTMLButtonElement>(selector);
    assert.ok(button, `Control ${selector} must exist`);
    assert.equal(button.disabled, false, `${selector} must accept taps`);
    await act(async () => button.click());
  };
  try {
    const cards = new CardsGame(people);
    cards.advance();
    await render(view(cards, "b"));
    assert.equal(document.querySelectorAll(".hand-cards button").length, 5);
    await tap(".hand-cards button");
    assert.equal(calls.at(-1)!.event, "game:submit");
    assert.ok(
      cards
        .privateView("b")!
        .cards!.hand.some((c) => c.id === calls.at(-1)!.data?.cardId),
    );
    // A host who chose Play on this device must receive the same tappable hand.
    await render(view(cards, "b", true));
    await tap(".hand-cards button");
    assert.match(document.body.textContent!, /host controls stay above/);
    await render(view(cards, null, true));
    assert.equal(document.querySelectorAll(".hand-cards button").length, 0);
    assert.match(document.body.textContent!, /Shared display/);
    const crowd = new CrowdGame(people);
    crowd.advance();
    await render(view(crowd, "a", true));
    await tap("button.simple-project");
    assert.deepEqual(calls.at(-1), {
      event: "game:submit",
      data: { project: 0 },
    });
    const survival = new SurvivalGame(people);
    survival.advance();
    await render(view(survival, "a", true));
    await tap("button.knowledge-choice");
    assert.deepEqual(calls.at(-1), {
      event: "game:submit",
      data: { optionId: survival.publicView().survival.options[0].id },
    });
    survival.complete(true);
    await render(view(survival, "b"));
    await tap("button.knowledge-choice");
    assert.equal(calls.at(-1)!.event, "game:vote");
    await render({
      ...view(survival, "b"),
      game: {
        ...view(survival, "b").game!,
        paused: true,
        pauseReason: "Host paused",
      },
    });
    assert.equal(
      document.querySelector<HTMLButtonElement>("button.knowledge-choice")!
        .disabled,
      true,
    );
    const bluff = new BluffGame(people);
    bluff.advance();
    await render(view(bluff, "a"));
    const textarea = document.querySelector<HTMLTextAreaElement>("textarea")!;
    assert.equal(textarea.disabled, false);
    textarea.value = "A ceremonial sock basket";
    // Submit through the native form path, using this DOM's FormData implementation.
    const previousFormData = globalThis.FormData;
    globalThis.FormData = dom.window.FormData as any;
    try {
      await tap(".bluff-submit");
    } finally {
      globalThis.FormData = previousFormData;
    }
    assert.deepEqual(calls.at(-1), {
      event: "game:submit",
      data: { text: textarea.value },
    });
    bluff.complete(true);
    await render(view(bluff, "a"));
    assert.equal(
      document.querySelectorAll("button.knowledge-choice").length,
      2,
    );
    await tap("button.knowledge-choice");
    assert.equal(calls.at(-1)!.event, "game:vote");
    await render(view(bluff, null, true));
    assert.equal(
      document.querySelectorAll("button.knowledge-choice").length,
      0,
    );
    const clues = new CharadesGame(people);
    clues.advance();
    await render(view(clues, "a"));
    await tap(".ready-button");
    assert.deepEqual(calls.at(-1), {
      event: "game:submit",
      data: { action: "ready" },
    });
    clues.submit("a", "submit", { action: "ready" });
    clues.complete(false);
    await render(view(clues, "b"));
    await tap(".clue-correct");
    assert.equal(calls.at(-1)!.data?.action, "correct");
    assert.equal(
      calls.at(-1)!.data?.wordId,
      clues.privateView("b")!.charades!.wordId,
    );
    await tap(".clue-pass");
    assert.equal(calls.at(-1)!.data?.action, "pass");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});
