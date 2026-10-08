import { test, expect } from "@playwright/test";

test("enemy crossfade preserves root and ring, pauses idle then resumes", async ({
  page,
}) => {
  await page.goto("/");
  const initial = await page.evaluate(() => {
    const enemies = [...document.querySelectorAll(".enemy")];
    window.__rects = enemies.map((el) => ({
      root: el.getBoundingClientRect().toJSON(),
      ring: el.querySelector(".target-ring").getBoundingClientRect().toJSON(),
    }));
    window.__battle.state.selected = "w0-1";
    window.__battle.controller.render();
    return enemies.map((el) => ({
      duration: getComputedStyle(el.querySelector(".enemy-idle-wrapper"))
        .animationDuration,
      phase: getComputedStyle(el.querySelector(".enemy-idle-wrapper"))
        .animationDelay,
    }));
  });
  expect(initial[0].duration).toBe("6.5s");
  expect(initial[0].phase).not.toBe(initial[1].phase);
  await page.evaluate(() => {
    const { state, vfx } = window.__battle;
    window.__battle.view.dismissMessage();
    state.speed = 1;
    window.__enemyDone = false;
    vfx
      .attack({
        source: state.enemies[0].uid,
        target: state.heroes[0].id,
        kind: "damage",
        amount: 55,
        element: "WOOD",
        vfx: "SLIME_SPLASH",
      })
      .then(() => (window.__enemyDone = true));
  });
  await page.waitForTimeout(190);
  const attack = await page.evaluate(() => {
    const el = document.querySelector(".enemy");
    return {
      root: el.getBoundingClientRect().toJSON(),
      ring: el.querySelector(".target-ring").getBoundingClientRect().toJSON(),
      original: window.__rects[0],
      idle: getComputedStyle(el.querySelector(".sprite-idle")).opacity,
      attack: getComputedStyle(el.querySelector(".sprite-attack")).opacity,
      motion: getComputedStyle(el.querySelector(".enemy-idle-wrapper"))
        .animationPlayState,
    };
  });
  expect(attack.root).toEqual(attack.original.root);
  expect(attack.ring).toEqual(attack.original.ring);
  expect(Number(attack.idle)).toBeCloseTo(0, 4);
  expect(Number(attack.attack)).toBeCloseTo(1, 4);
  expect(attack.motion).toBe("paused");
  await page.screenshot({ path: "tests/artifacts/combat-enemy-attack.png" });
  await page.waitForFunction(() => window.__enemyDone);
  await expect(page.locator(".enemy-attacking")).toHaveCount(0);
  expect(
    await page
      .locator(".enemy-idle-wrapper")
      .first()
      .evaluate((el) => getComputedStyle(el).animationPlayState),
  ).toBe("running");
  await page.screenshot({ path: "tests/artifacts/combat-enemy-idle.png" });
});

test("Prism connects every target before explosion and cleans VFX; hazard/line animate", async ({
  page,
}) => {
  await page.goto("/");
  const counts = await page.evaluate(async () => {
    const { state, view, vfx } = window.__battle;
    view.dismissMessage();
    const { resolveStep } = await import("/src/core/match3/engine.js");
    state.board = Array.from({ length: 42 }, (_, i) => ({
      id: i + 1000,
      element: ["FIRE", "WOOD", "WATER"][(i + Math.floor(i / 7)) % 3],
      specialType: null,
      hazardType: null,
    }));
    state.board[16].specialType = "PRISM";
    state.board[16].element = "WATER";
    state.board[15].element = "FIRE";
    state.board[0].hazardType = "FROZEN";
    state.board[1].specialType = "LINE_HORIZONTAL";
    state.board[2].specialType = "LINE_VERTICAL";
    view.board.render(state.board);
    const original = Element.prototype.animate;
    window.__explosions = [];
    Element.prototype.animate = function (frames, options) {
      if (this.matches(".gem") && frames.at(-1).opacity === 0)
        window.__explosions.push({
          time: performance.now(),
          index: Number(this.dataset.cell),
        });
      return original.call(this, frames, options);
    };
    const step = resolveStep(state.board, { swap: [16, 15] });
    window.__prismDone = false;
    vfx.clear(step).then(() => (window.__prismDone = true));
    return {
      targets: state.board.filter((g) => g.element === "FIRE").length,
      animations: [
        document.querySelector(".hazard:not([hidden])"),
        document.querySelector('[data-cell="1"] .special'),
        document.querySelector('[data-cell="2"] .special'),
      ].map((el) => getComputedStyle(el).animationName),
    };
  });
  expect(counts.animations.every((name) => name !== "none")).toBe(true);
  await page.waitForFunction(
    () => document.querySelectorAll(".prism-ray").length > 0,
  );
  expect(await page.locator(".prism-ray").count()).toBe(counts.targets);
  expect(await page.evaluate(() => window.__explosions.length)).toBe(0);
  await page.waitForTimeout(120);
  await page.screenshot({ path: "tests/artifacts/combat-prism-lightning.png" });
  await page.waitForFunction(() => window.__prismDone);
  await expect(page.locator(".board-vfx-layer > *")).toHaveCount(0);
});
