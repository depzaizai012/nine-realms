import { test } from "node:test";
import assert from "node:assert/strict";
import { BOARD_CONFIG as C } from "../src/data/boardConfig.js";
import { ELEMENTS } from "../src/data/elements/index.js";
import {
  resolveStep,
  validMoves,
  isValidSwap,
} from "../src/core/match3/engine.js";
import { lineCells } from "../src/core/vfx/boardVfxController.js";
import {
  MANIFEST,
  getHeroUltimateAsset,
  getGemSpecialRotation,
} from "../src/data/assets/manifest.js";
import { createBattle } from "../src/core/battle/battleStore.js";
import { createBattleController } from "../src/core/battle/battleController.js";
import { createAutoBattleAdapter } from "../src/core/battle/autoBattleAdapter.js";
import { swapped } from "../src/core/match3/boardUtils.js";
import { STAGES } from "../src/data/stages/index.js";
const clean = () =>
  Array.from({ length: C.rows * C.cols }, (_, i) => ({
    id: i,
    element:
      ELEMENTS[(Math.floor(i / C.cols) * 2 + (i % C.cols)) % ELEMENTS.length],
    specialType: null,
    hazardType: null,
  }));

test("dragged Bomb activates at destination with clamped 3x3, each special ID once", () => {
  const board = clean();
  board[15].specialType = "BOMB";
  const step = resolveStep(swapped(board, 15, 16), { swap: [16, 15] });
  assert.equal(step.activations[0].index, 16);
  assert.deepEqual(
    step.clear.sort((a, b) => a - b),
    [8, 9, 10, 15, 16, 17, 22, 23, 24],
  );
});

test("horizontal/vertical four and five plus all L orientations create at destination", () => {
  for (const [cells, type] of [
    [[14, 15, 16, 17], "LINE_HORIZONTAL"],
    [[2, 9, 16, 23], "LINE_VERTICAL"],
    [[14, 15, 16, 17, 18], "PRISM"],
    [[2, 9, 16, 23, 30], "PRISM"],
    [[14, 15, 16, 21, 28], "PRISM"],
    [[14, 15, 16, 23, 30], "PRISM"],
    [[14, 15, 16, 7, 0], "PRISM"],
    [[14, 15, 16, 9, 2], "PRISM"],
  ]) {
    const board = clean();
    board.forEach((g, i) => {
      g.element = i % 2 ? "WOOD" : "WATER";
    });
    for (const i of cells) board[i].element = "FIRE";
    const destination = cells[0];
    const step = resolveStep(board, { swap: [destination, destination + 7] });
    assert.ok(
      step.creations.some(
        ([i, g]) => i === destination && g.specialType === type,
      ),
    );
  }
});
test("canonical Line H at row 3 col 4 clears exactly its 7 row cells", () => {
  const board = clean(),
    index = 3 * C.cols + 4;
  for (const i of [index - 1, index, index + 1]) board[i].element = "LIGHT";
  board[index].specialType = "LINE_HORIZONTAL";
  const step = resolveStep(board);
  const expected = Array.from({ length: C.cols }, (_, c) => 3 * C.cols + c);
  assert.deepEqual(
    [...step.clear].sort((a, b) => a - b),
    expected,
  );
  assert.deepEqual(lineCells(index, "LINE_HORIZONTAL"), expected);
  assert.equal(getGemSpecialRotation("LINE_HORIZONTAL"), 0);
});
test("canonical Line V at row 2 col 5 clears exactly its 6 column cells", () => {
  const board = clean(),
    index = 2 * C.cols + 5;
  for (const i of [index - C.cols, index, index + C.cols])
    board[i].element = "EARTH";
  board[index].specialType = "LINE_VERTICAL";
  const expected = Array.from({ length: C.rows }, (_, r) => r * C.cols + 5),
    step = resolveStep(board);
  assert.deepEqual(
    [...step.clear].sort((a, b) => a - b),
    expected,
  );
  assert.deepEqual(lineCells(index, "LINE_VERTICAL"), expected);
  assert.equal(getGemSpecialRotation("LINE_VERTICAL"), 0);
});
test("vertical match-four creates LINE_VERTICAL and converging chains activate each special once", () => {
  const board = clean();
  for (const i of [1, 8, 15, 22]) board[i].element = "WATER";
  assert.equal(resolveStep(board).creations[0][1].specialType, "LINE_VERTICAL");
  const chain = clean();
  for (const i of [0, 1, 2]) chain[i].element = "WOOD";
  chain[1].specialType = "LINE_HORIZONTAL";
  chain[3].specialType = "BOMB";
  chain[10].specialType = "LINE_VERTICAL";
  const { activations } = resolveStep(chain);
  assert.equal(
    new Set(activations.map((a) => a.index)).size,
    activations.length,
  );
  assert.ok(
    ["LINE_HORIZONTAL", "LINE_VERTICAL", "BOMB"].every((type) =>
      activations.some((a) => a.type === type),
    ),
  );
});
test("ultimate production fallback order and Sylva missing full body", () => {
  const id = "HERO_002_FENRIR",
    keys = ["FULL_BODY", "ULTIMATE_CUTIN", "BATTLE_CUTIN", "AVATAR"].map(
      (t) => `${id}_${t}`,
    ),
    saved = keys.map((k) => MANIFEST[k]);
  try {
    for (const type of [
      "full_body",
      "ultimate_cutin",
      "battle_cutin",
      "avatar",
    ]) {
      const result = getHeroUltimateAsset(id, { warn: false });
      assert.equal(result.type, type);
      delete MANIFEST[result.key];
    }
    assert.ok(
      getHeroUltimateAsset(id, { warn: false }).url.startsWith("data:"),
    );
  } finally {
    keys.forEach((key, i) => (MANIFEST[key] = saved[i]));
  }
  assert.equal(
    getHeroUltimateAsset("HERO_004_SYLVA", { warn: false }).type,
    "full_body",
  );
});
test("AUTO stays off, exposes legal moves / ready ultimates / generic targets and shared human APIs", () => {
  const state = createBattle(STAGES["1-1"]);
  state.board[0].specialType = "BOMB";
  const calls = [],
    controller = {
      canInput: () => state.phase === "idle" && !state.paused,
      move: (...args) => calls.push(["move", ...args]),
      select: (id) => calls.push(["select", id]),
      useUltimate: (id) => calls.push(["ultimate", id]),
    };
  const auto = createAutoBattleAdapter(state, controller);
  assert.equal(auto.enabled, false);
  assert.equal(auto.setEnabled(true), false);
  assert.equal(auto.canRun(), false);
  const board = state.board.map((g) => g.id);
  assert.ok(
    auto.getLegalMoves().every((m) => isValidSwap(state.board, ...m.cells)),
  );
  assert.equal(auto.getLegalMoves().length, validMoves(state.board).length);
  assert.deepEqual(
    state.board.map((g) => g.id),
    board,
  );
  assert.equal(state.turn, 0);
  state.heroes[1].energy = 100;
  assert.deepEqual(auto.getReadyUltimates(), [state.heroes[1].id]);
  state.enemies[0].role = "SUPPORT";
  state.enemies[0].marked = true;
  assert.ok(auto.getTargets()[0].support && auto.getTargets()[0].marked);
  assert.equal(auto.move, controller.move);
  assert.equal(auto.select, controller.select);
  assert.equal(auto.useUltimate, controller.useUltimate);
});
test("ultimate locks input before its presentation and resolves real effects only at impact", async () => {
  const state = createBattle(STAGES["1-1"]),
    hero = state.heroes[0];
  hero.energy = 100;
  hero.hp = 300;
  const noop = async () => {},
    view = {
      actor() {},
      render() {},
      board: { render() {} },
      message() {},
      result() {},
      enemies: { spawn() {} },
    };
  let controller;
  const vfx = {
    ultimate: async (h, resolve) => {
      assert.equal(state.phase, "ultimate");
      assert.equal(controller.canInput(), false);
      assert.equal(await controller.move(0, 1), false);
      assert.equal(hero.energy, 100);
      assert.equal(hero.hp, 300);
      const feedback = await resolve();
      await feedback.finished;
    },
    ultimateImpact: async (events, render) => {
      assert.equal(hero.energy, 0);
      assert.equal(hero.hp, 560);
      assert.ok(events.some((e) => e.kind === "heal"));
      render();
      return { finished: Promise.resolve() };
    },
    death: noop,
    fall: noop,
  };
  controller = createBattleController(state, view, vfx);
  await controller.useUltimate(hero.id);
  assert.equal(state.phase, "idle");
  assert.equal(state.turn, 0);
});
