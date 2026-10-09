import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createBoard,
  findMatches,
  validMoves,
  isValidSwap,
  resolveStep,
  fallAndRefill,
  shuffle,
} from "../src/core/match3/engine.js";
import { swapped } from "../src/core/match3/boardUtils.js";
import { createBattle, spawnWave } from "../src/core/battle/battleStore.js";
import {
  heroAttack,
  enemyAttack,
  chooseHero,
  ultimate,
} from "../src/core/battle/engine.js";
import { createBattleController } from "../src/core/battle/battleController.js";
import { STAGES } from "../src/data/stages/index.js";
import { ELEMENTS } from "../src/data/elements/index.js";
// Legacy fixture isolates original hero-specific combat expectations from the
// new R/SR-only starter roster; production Stage 1-1 uses STARTER_HERO_IDS.
const legacyStage = {
  ...STAGES["1-1"],
  team: [
    "HERO_001_ARIA",
    "HERO_002_FENRIR",
    "HERO_003_ROWAN",
    "HERO_004_SYLVA",
    "HERO_005_PIP",
  ],
};
const clean = () =>
  Array.from({ length: 42 }, (_, i) => ({
    id: i,
    element: ELEMENTS[(Math.floor(i / 7) * 2 + (i % 7)) % 6],
    specialType: null,
    hazardType: null,
  }));
test("initial boards: 42 cells, no initial matches, playable", () => {
  for (let i = 0; i < 100; i++) {
    const b = createBoard();
    assert.equal(b.length, 42);
    assert.equal(findMatches(b).length, 0);
    assert.ok(validMoves(b).length);
  }
});
test("adjacent validation and locked overlay", () => {
  const b = clean();
  b[0].specialType = "BOMB";
  assert.ok(isValidSwap(b, 0, 1));
  assert.ok(!isValidSwap(b, 6, 7));
  b[0].hazardType = "LOCKED";
  assert.ok(!isValidSwap(b, 0, 1));
});
test("four creates horizontal line; five creates prism; T creates bomb", () => {
  for (const count of [4, 5]) {
    const b = clean();
    for (let i = 0; i < count; i++) b[i].element = "WOOD";
    assert.equal(
      resolveStep(b).creations[0][1].specialType,
      count === 4 ? "LINE_HORIZONTAL" : "PRISM",
    );
  }
  const b = clean();
  for (const i of [8, 9, 10, 2, 16]) b[i].element = "LIGHT";
  assert.equal(resolveStep(b).creations[0][1].specialType, "BOMB");
});
test("line horizontal clears row, vertical clears column and chains bomb", () => {
  for (const type of ["LINE_HORIZONTAL", "LINE_VERTICAL"]) {
    const b = clean();
    for (const i of [14, 15, 16]) b[i].element = "FIRE";
    b[15].specialType = type;
    b[type === "LINE_HORIZONTAL" ? 20 : 36].specialType = "BOMB";
    const step = resolveStep(b);
    const expected =
      type === "LINE_HORIZONTAL"
        ? [14, 15, 16, 17, 18, 19, 20]
        : [1, 8, 15, 22, 29, 36];
    for (const i of expected) assert.ok(step.clear.includes(i));
    assert.ok(step.activations.some((a) => a.type === "BOMB"));
  }
});
test("bomb adjacent activation, corner clamp, refill", () => {
  const b = clean();
  b[0].specialType = "BOMB";
  const s = resolveStep(b, { swap: [0, 1] });
  assert.deepEqual(
    s.clear.sort((a, b) => a - b),
    [0, 1, 7, 8],
  );
  const next = fallAndRefill(b, s);
  assert.equal(next.length, 42);
  assert.ok(next.every(Boolean));
});
test("prism color clear and prism pair whole board", () => {
  const b = clean();
  b[0].specialType = "PRISM";
  const target = b[1].element;
  const s = resolveStep(b, { swap: [0, 1] });
  b.forEach((g, i) => {
    if (g.element === target) assert.ok(s.clear.includes(i));
  });
  b[1].specialType = "PRISM";
  assert.equal(resolveStep(b, { swap: [0, 1] }).clear.length, 42);
});
test("shuffle has moves and no matches", () => {
  const b = shuffle(clean());
  assert.equal(b.length, 42);
  assert.ok(validMoves(b).length);
  assert.equal(findMatches(b).length, 0);
});
test("dead board automatically shuffles without turn, damage, or energy cost", async () => {
  const s = createBattle(legacyStage);
  s.board = clean();
  const hp = s.heroes.map((h) => h.hp),
    energy = s.heroes.map((h) => h.energy);
  assert.equal(validMoves(s.board).length, 0);
  const c = createBattleController(
    s,
    { board: { render() {} }, message() {} },
    { fall: async () => {} },
  );
  await c.ensureMoves();
  assert.ok(validMoves(s.board).length);
  assert.equal(s.turn, 0);
  assert.deepEqual(
    s.heroes.map((h) => h.hp),
    hp,
  );
  assert.deepEqual(
    s.heroes.map((h) => h.energy),
    energy,
  );
});
test("deterministic four cascades still produce ONE turn and ONE sequential enemy phase", async () => {
  let seed = 279;
  const rng = () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  const s = createBattle(legacyStage);
  s.board = createBoard(rng);
  s.enemies.forEach((e) => (e.hp = 100000));
  let clears = 0;
  const enemyActions = [],
    noop = async () => {};
  const vfx = {
    swap: noop,
    clear: async () => {
      clears++;
    },
    fall: noop,
    wait: noop,
    death: noop,
    hit: noop,
    attack: async (event) => {
      if (event.source.startsWith("w")) enemyActions.push(event);
      else {
        assert.equal(clears, 4, "all cascades finish before any hero action");
        assert.equal(findMatches(s.board).length, 0);
        assert.equal(s.phase, "hero");
      }
    },
  };
  const c = createBattleController(
    s,
    {
      render() {},
      board: { render() {} },
      message() {},
      result() {},
      enemies: { spawn() {} },
    },
    vfx,
    { rng },
  );
  await c.move(...validMoves(s.board)[0]);
  assert.equal(clears, 4);
  assert.equal(s.turn, 1);
  assert.equal(s.resolveResult.cascadesCount, 3);
  assert.equal(
    s.resolveResult.totalTilesCleared,
    Object.values(s.resolveResult.totalClearedByElement).reduce(
      (a, b) => a + b,
      0,
    ),
  );
  assert.equal(enemyActions.length, 2);
  assert.notEqual(enemyActions[0].target, enemyActions[1].target);
});
test("damage, energy, living target random selection, persistence", () => {
  const s = createBattle(legacyStage);
  const h = s.heroes[1],
    enemy = s.enemies[0];
  const event = heroAttack(s, { element: "FIRE", count: 3 });
  assert.equal(event.amount, 185);
  assert.equal(enemy.hp, 665);
  assert.equal(h.energy, 20);
  enemyAttack(s, enemy, h);
  assert.equal(h.hp, 925);
  for (const r of [0, 0.2, 0.5, 0.9])
    assert.notEqual(chooseHero(s, h.id, () => r).id, h.id);
  s.heroes[0].hp = 0;
  s.wave++;
  spawnWave(s);
  assert.equal(s.enemies.length, 3);
  assert.equal(h.hp, 925);
  assert.equal(h.energy, 20);
  assert.equal(s.heroes[0].hp, 0);
  s.wave++;
  spawnWave(s);
  assert.equal(s.enemies.length, 3);
  assert.ok(s.enemies[2].elite);
});
test("ultimate healing, revive, shield, damage gated by full energy", () => {
  const s = createBattle(legacyStage);
  const aria = s.heroes[0];
  aria.hp = 400;
  assert.equal(ultimate(s, aria).length, 0);
  aria.energy = 100;
  assert.ok(ultimate(s, aria).some((e) => e.kind === "heal"));
  assert.equal(aria.hp, 660);
  s.heroes[1].hp = 0;
  s.heroes[4].energy = 100;
  ultimate(s, s.heroes[4]);
  assert.equal(s.heroes[1].hp, 220);
  s.heroes[2].energy = 100;
  ultimate(s, s.heroes[2]);
  assert.ok(s.heroes[0].shield > 0);
});
test("invalid gesture consumes zero turns/actions; cascades give one enemy phase and sequential actions", async () => {
  const s = createBattle(legacyStage);
  s.enemies.forEach((e) => {
    e.hp = e.maxHp = 100000;
  });
  const log = [];
  let active = 0,
    max = 0;
  const noop = async () => {};
  const vfx = {
    swap: noop,
    clear: noop,
    fall: noop,
    wait: noop,
    death: noop,
    hit: noop,
    attack: async (event) => {
      active++;
      max = Math.max(max, active);
      log.push(event);
      await new Promise((r) => setTimeout(r, 1));
      active--;
    },
  };
  const view = {
    render() {},
    board: { render() {} },
    message() {},
    result() {},
    enemies: { spawn() {} },
  };
  const c = createBattleController(s, view, vfx);
  let invalid;
  for (let a = 0; a < 41; a++)
    if (a % 7 < 6 && !isValidSwap(s.board, a, a + 1)) {
      invalid = [a, a + 1];
      break;
    }
  assert.equal(await c.move(...invalid), false);
  assert.equal(s.turn, 0);
  assert.equal(log.length, 0);
  const move = validMoves(s.board)[0];
  await c.move(...move);
  assert.equal(s.turn, 1);
  assert.equal(log.filter((e) => e.source.startsWith("w")).length, 2);
  assert.equal(max, 1);
});
