import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveBattleBackground } from "../src/data/battleBackgroundRules.js";
import {
  getEnemyAsset,
  getHeroUltimateAsset,
} from "../src/data/assets/manifest.js";
import {
  ENEMY_PRESENTATION,
  getSpritePlacement,
} from "../src/data/enemyPresentation.js";
test("background ranges 1–6 normal, 7–9 elite, 10 boss without adding stages", () => {
  for (let i = 1; i <= 10; i++) {
    const config = resolveBattleBackground({
      id: `1-${i}`,
      realm: "VERDANT_REALM",
    });
    assert.equal(config.tier, i === 10 ? "boss" : i >= 7 ? "elite" : "normal");
    assert.ok(config.assetKey.startsWith("BG_W01_"));
  }
});
test("replacement filenames resolve exactly and sprite placement aligns the alpha footprint", () => {
  assert.ok(
    getEnemyAsset("ENEMY_W01_001_FOREST_SLIME", "idle").includes(
      "BLIGHT_OOZE_IDLE.png",
    ),
  );
  assert.ok(
    getEnemyAsset("ENEMY_W01_003_LEAF_GOBLIN", "idle").includes(
      "IDLEENEMY_W01_003_BRIARBORN_MARAUDER_IDLE.png",
    ),
  );
  assert.ok(getSpritePlacement("ENEMY_W01_001_FOREST_SLIME_IDLE").scale > 0);
  assert.equal(
    getHeroUltimateAsset("HERO_004_SYLVA", { warn: false }).type,
    "full_body",
  );
  assert.ok(
    ENEMY_PRESENTATION.BOSS.scale > ENEMY_PRESENTATION.ELITE.scale &&
      ENEMY_PRESENTATION.ELITE.scale > ENEMY_PRESENTATION.NORMAL.scale,
  );
});
