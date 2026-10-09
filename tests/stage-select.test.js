import { test } from "node:test";
import assert from "node:assert/strict";
import { getRealmStages } from "../src/data/stages/stageSelect.js";
import {
  PROGRESS_KEY,
  createDefaultProgress,
  loadProgress,
  stageProgress,
  applyStageVictory,
  recordStageVictory,
} from "../src/core/progression/gameSaveService.js";

function fakeStorage() {
  const state = new Map();
  return {
    getItem: (key) => state.get(key) ?? null,
    setItem: (key, value) => state.set(key, value),
    corrupt: (raw) => state.set(PROGRESS_KEY, raw),
  };
}

test("Verdant map declares 10 unique nodes but only implemented battle can launch", () => {
  const stages = getRealmStages("VERDANT_REALM");
  assert.equal(stages.length, 10);
  assert.equal(new Set(stages.map((stage) => stage.id)).size, 10);
  assert.equal(stages[0].id, "1-1");
  assert.equal(stages[0].playable, true);
  assert.equal(stages[9].id, "1-10");
  assert.equal(stages[9].tier, "BOSS");
  assert.ok(stages.slice(1).every((stage) => !stage.playable));
  assert.deepEqual(getRealmStages("UNKNOWN_REALM"), []);
});

test("initial save unlocks 1-1 only; invalid local save falls back safely", () => {
  const storage = fakeStorage();
  assert.equal(stageProgress(loadProgress(storage), "1-1").unlocked, true);
  assert.equal(stageProgress(loadProgress(storage), "1-2").unlocked, false);
  storage.corrupt("{broken");
  assert.deepEqual(loadProgress(storage), createDefaultProgress());
  storage.corrupt(JSON.stringify({ saveVersion: 99, stages: { "1-1": { stars: 3 } } }));
  assert.deepEqual(loadProgress(storage), createDefaultProgress());
});

test("victory persists best stars and unlocks next stage; repeat cannot erase records", () => {
  const storage = fakeStorage();
  const first = recordStageVictory("1-1", { turns: 12, heroesStanding: 2 }, storage);
  assert.equal(stageProgress(first, "1-1").stars, 2);
  assert.equal(stageProgress(first, "1-1").bestTurns, 12);
  assert.equal(stageProgress(first, "1-2").unlocked, true);
  const second = recordStageVictory("1-1", { turns: 20, heroesStanding: 1 }, storage);
  assert.equal(stageProgress(second, "1-1").stars, 2);
  assert.equal(stageProgress(second, "1-1").bestTurns, 12);
  const third = recordStageVictory("1-1", { turns: 8, heroesStanding: 5 }, storage);
  assert.equal(stageProgress(third, "1-1").stars, 3);
  assert.equal(stageProgress(third, "1-1").bestTurns, 8);
  assert.equal(stageProgress(loadProgress(storage), "1-1").stars, 3);
});

test("unimplemented stage cannot mint progression; loaded stars are clamped", () => {
  const initial = createDefaultProgress();
  assert.equal(applyStageVictory(initial, "1-2"), initial);
  assert.equal(stageProgress(initial, "1-2").unlocked, false);
  const storage = fakeStorage();
  storage.corrupt(JSON.stringify({
    saveVersion: 1,
    stages: { "1-1": { unlocked: false, cleared: true, stars: 999, bestTurns: -4 } },
  }));
  const loaded = loadProgress(storage);
  assert.equal(loaded.stages["1-1"].unlocked, true);
  assert.equal(loaded.stages["1-1"].stars, 3);
  assert.equal(loaded.stages["1-1"].bestTurns, null);
});
