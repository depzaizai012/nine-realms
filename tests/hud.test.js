import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getHeroVitals,
  getHeroStatuses,
  getStatusSlots,
} from "../src/components/hero/heroHudState.js";
test("HP thresholds: 100/60 green, 59/30 yellow, 29/1 red, zero dead", () => {
  for (const [hp, tone] of [
    [100, "GREEN"],
    [60, "GREEN"],
    [59, "YELLOW"],
    [30, "YELLOW"],
    [29, "RED"],
    [1, "RED"],
    [0, "RED"],
  ]) {
    const state = getHeroVitals({ hp, stats: { hp: 100 }, energy: 100 });
    assert.equal(state.hpTone, tone);
    assert.equal(state.alive, hp > 0);
    assert.equal(state.ready, hp > 0);
  }
});
test("Mana readiness reads skill cost and alive override, not literal 100", () => {
  const hero = {
    hp: 760,
    stats: { hp: 760 },
    mana: 59,
    maxMana: 120,
    ultimate: { manaCost: 60 },
  };
  assert.equal(getHeroVitals(hero).ready, false);
  hero.mana = 60;
  assert.equal(getHeroVitals(hero).ready, true);
  assert.equal(getHeroVitals(hero).manaRatio, 0.5);
  hero.hp = 0;
  assert.equal(getHeroVitals(hero).ready, false);
  const canonical = { hp: 760, stats: { hp: 760 }, energy: 99 };
  assert.equal(getHeroVitals(canonical).ready, false);
  canonical.energy = 100;
  assert.equal(getHeroVitals(canonical).ready, true);
});
test("Status slots 0/1/4/6, data priorities, stacks and turns", () => {
  for (const n of [0, 1, 4, 6]) {
    const statuses = Array.from({ length: n }, (_, i) => ({
      id: `s${i}`,
      type: "BUFF",
      priority: i,
      stacks: 3,
      durationTurns: 2,
    }));
    const sorted = getHeroStatuses({ statuses }),
      slots = getStatusSlots(sorted);
    assert.equal(slots.visible.length, n <= 4 ? n : 3);
    assert.equal(slots.overflowCount, n === 6 ? 3 : 0);
    if (n) {
      assert.equal(sorted[0].priority, n - 1);
      assert.equal(sorted[0].stacks, 3);
      assert.equal(sorted[0].durationTurns, 2);
    }
  }
});
test("Status adapters read shield/modifiers without changing any combat state", () => {
  const hero = {
    shield: 240,
    modifiers: { buff: 0.2, debuff: 0.1 },
    statuses: [
      { id: "stun", type: "CONTROL" },
      { id: "poison", type: "DOT" },
      { id: "regen", type: "HOT" },
      { id: "inactive", type: "DEBUFF", active: false },
      { id: "expired", type: "BUFF", durationTurns: 0 },
    ],
  };
  const before = JSON.stringify(hero),
    statuses = getHeroStatuses(hero);
  assert.equal(JSON.stringify(hero), before);
  assert.equal(statuses.length, 6);
  assert.equal(statuses[0].type, "CONTROL");
  assert.equal(statuses[1].type, "DOT");
  assert.ok(statuses.some((s) => s.type === "SHIELD" && s.amount === 240));
  assert.ok(statuses.some((s) => s.type === "BUFF"));
});
