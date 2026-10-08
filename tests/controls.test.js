import { test } from "node:test";
import assert from "node:assert/strict";
import { createBattle, spawnWave } from "../src/core/battle/battleStore.js";
import { STAGES } from "../src/data/stages/index.js";
import {
  ELEMENTAL_MATCHUPS,
  getElementMultiplier,
} from "../src/data/elementalMatchups.js";
import { heroAttack } from "../src/core/battle/engine.js";
test("one speed field with compatibility alias persists between waves and resets for new battle", () => {
  const state = createBattle(STAGES["1-1"]);
  assert.equal(state.battleSpeedMultiplier, 1);
  state.speed = 2;
  assert.equal(state.battleSpeedMultiplier, 2);
  state.wave = 1;
  spawnWave(state);
  assert.equal(state.battleSpeedMultiplier, 2);
  assert.equal(createBattle(STAGES["1-1"]).battleSpeedMultiplier, 1);
});
test("current elemental rules are neutral, shared by panel/combat, no fabricated advantage or damage bonus", () => {
  assert.equal(ELEMENTAL_MATCHUPS.enabled, false);
  assert.equal(ELEMENTAL_MATCHUPS.advantages.length, 0);
  for (const from of ELEMENTAL_MATCHUPS.elements)
    for (const to of ELEMENTAL_MATCHUPS.elements)
      assert.equal(getElementMultiplier(from, to), 1);
  for (const speed of [1, 2]) {
    const state = createBattle(STAGES["1-1"]);
    state.battleSpeedMultiplier = speed;
    assert.equal(heroAttack(state, { element: "FIRE", count: 3 }).amount, 185);
    assert.equal(state.heroes[1].energy, 20);
  }
});
