import { test } from "node:test";
import assert from "node:assert/strict";
import { HEROES } from "../src/data/heroes/index.js";
import { STAGES } from "../src/data/stages/index.js";
import { STARTER_HERO_IDS } from "../src/data/starterRoster.js";
import { STARTER_SAVE_KEY, grantStarterHeroes } from "../src/core/story/starterProgress.js";
import { createBattle } from "../src/core/battle/battleStore.js";

test("the fixed starter roster contains exactly 2 SR + 3 R with no SSR or UR", () => {
  assert.equal(STARTER_HERO_IDS.length, 5);
  assert.equal(new Set(STARTER_HERO_IDS).size, 5);
  assert.deepEqual(STARTER_HERO_IDS.map(id => HEROES[id].rarity).sort(), ["R","R","R","SR","SR"]);
  assert.deepEqual(new Set(STARTER_HERO_IDS.map(id => HEROES[id].role)), new Set(["TANK","MAGE","WARRIOR","SUPPORT"]));
  assert.equal(STARTER_HERO_IDS.includes("HERO_001_ARIA"), false);
  assert.equal(STARTER_HERO_IDS.includes("HERO_002_FENRIR"), false);
});
test("actual Stage 1-1 and combat state use the same five starter hero IDs", () => {
  const stage = STAGES["1-1"];
  assert.deepEqual(stage.team, STARTER_HERO_IDS);
  const battle = createBattle(stage);
  assert.deepEqual(battle.heroes.map(hero=>hero.id), STARTER_HERO_IDS);
  assert.ok(battle.heroes.every(hero=>hero.hp>0 && hero.energy===0));
  assert.ok(battle.heroes.every(hero=>hero.ultimate && hero.attackVfx));
});
test("free summon stores unique heroes idempotently and preserves other owned IDs", () => {
  const data = new Map();
  const storage = {getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v)};
  const first = grantStarterHeroes(storage, 1000);
  const second = grantStarterHeroes(storage, 2000);
  assert.deepEqual(first.heroIds, STARTER_HERO_IDS);
  assert.deepEqual(second.heroIds, STARTER_HERO_IDS);
  assert.equal(second.grantedAt, 1000);
  assert.equal(JSON.parse(data.get(STARTER_SAVE_KEY)).heroIds.length, 5);
});
