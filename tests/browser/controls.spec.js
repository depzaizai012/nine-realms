import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
async function open(page) {
  await page.goto("/?screen=battle");
  await expect(page.locator(".hero-card")).toHaveCount(5);
  await page.evaluate(() => window.__battle.view.dismissMessage());
}
test("production controls and both panels fit three mobile viewports; no click-through; Escape/outside close", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(r.url());
  });
  for (const size of [
    { width: 390, height: 844 },
    { width: 360, height: 800 },
    { width: 412, height: 915 },
  ]) {
    await page.setViewportSize(size);
    await open(page);
    await expect(page.locator(".enemy-hud")).toBeHidden();
    await expect(page.locator(".enemy-local-hud")).toHaveCount(2);
    const before = await page.locator(".speed").boundingBox();
    await page.locator(".speed").click();
    await expect(page.locator(".speed")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      await page.evaluate(() => window.__battle.state.battleSpeedMultiplier),
    ).toBe(2);
    expect(await page.locator(".speed").boundingBox()).toEqual(before);
    expect(
      await page.locator(".speed-active").evaluate((e) => e.src),
    ).toContain("BTN_BATTLE_SPEED_X2_ACTIVE.png");
    await page.locator(".help").click();
    await expect(page.locator(".battle-overlay-dialog")).toBeVisible();
    await expect(page.locator(".element-icons img")).toHaveCount(6);
    await page.locator(".element-panel h2").click();
    await expect(page.locator(".battle-overlay-dialog")).toBeVisible();
    expect(
      await page.evaluate(() => window.__battle.controller.move(0, 1)),
    ).toBe(false);
    const r = await page.locator(".element-panel").boundingBox();
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.x + r.width).toBeLessThanOrEqual(size.width);
    await page.screenshot({
      path: `tests/artifacts/controls-help-${size.width}.png`,
    });
    await page.mouse.click(4, size.height - 4);
    await expect(page.locator(".battle-overlay-dialog")).not.toBeVisible();
    expect(await page.evaluate(() => window.__battle.state.turn)).toBe(0);
    await page.locator(".pause").click();
    await expect(page.locator(".pause-panel button")).toHaveCount(2);
    await page.locator(".pause-panel h2").click();
    await page.waitForTimeout(220);
    await expect(page.locator(".battle-overlay-dialog")).toBeVisible();
    const pauseRect = await page.locator(".pause-panel").boundingBox();
    expect(pauseRect.x + pauseRect.width / 2).toBeCloseTo(size.width / 2, 0);
    expect(
      await page.evaluate(() => window.__battle.controls.toggleBattleSpeed()),
    ).toBe(2);
    await page.screenshot({
      path: `tests/artifacts/controls-pause-${size.width}.png`,
    });
    await page.keyboard.press("Escape");
    await expect(page.locator(".battle-overlay-dialog")).not.toBeVisible();
    expect(
      await page.evaluate(() => window.__battle.state.battleSpeedMultiplier),
    ).toBe(2);
  }
  expect(errors).toEqual([]);
});
test("pause/help during a cascade keeps one turn/queue; overlays exclusive; replay and town dispose all timers", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await open(page);
  await page.evaluate(async () => {
    const { validMoves } = await import("/src/core/match3/engine.js");
    const { state, controller } = window.__battle;
    controller.move(...validMoves(state.board)[0]);
  });
  await page.waitForFunction(() => window.__battle.state.turn === 1);
  await page.locator(".help").click();
  const hp = await page.evaluate(() =>
    window.__battle.state.heroes.map((h) => h.hp),
  );
  await page.waitForTimeout(350);
  expect(
    await page.evaluate(() => window.__battle.state.heroes.map((h) => h.hp)),
  ).toEqual(hp);
  await page.evaluate(() => window.__battle.overlays.openPauseMenu());
  await expect(page.locator(".pause-panel")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.__battle.state.phase === "idle");
  expect(await page.evaluate(() => window.__battle.state.turn)).toBe(1);
  await page.locator(".pause").click();
  await page.evaluate(() => {
    window.__oldBattle = window.__battle;
    window.__oldBoardIds = window.__battle.state.board.map((g) => g.id);
  });
  await page.locator(".replay").click();
  await expect(page.locator(".gem")).toHaveCount(42);
  const replay = await page.evaluate(() => ({
    wave: window.__battle.state.wave,
    turn: window.__battle.state.turn,
    speed: window.__battle.state.battleSpeedMultiplier,
    hp: window.__battle.state.heroes.every(
      (h) => h.hp === h.stats.hp && h.energy === 0,
    ),
    oldDisposed: window.__oldBattle.state.disposed,
    timers: window.__oldBattle.vfx.clock.pendingTimers,
  }));
  expect(replay).toEqual({
    wave: 0,
    turn: 0,
    speed: 1,
    hp: true,
    oldDisposed: true,
    timers: 0,
  });
  await page.locator(".pause").click();
  await page.locator(".back-town").click();
  await expect(page.locator(".town-screen")).toBeVisible();
  expect(await page.evaluate(() => window.__gameRouter.screen)).toBe("TOWN");
  await page.locator(".town-screen button").click();
  await expect(page.locator(".gem")).toHaveCount(42);
  expect(errors).toEqual([]);
});
test("x2 halves seeded four-cascade visual duration and preserves gameplay results, RNG and sequential phases", async ({
  page,
}) => {
  test.setTimeout(120000);
  const runs = [];
  for (const rate of [1, 2]) {
    await open(page);
    const result = await page.evaluate(async (rate) => {
      const { state, view, vfx } = window.__battle;
      const { createBoard, validMoves } =
        await import("/src/core/match3/engine.js");
      const { createBattleController } =
        await import("/src/core/battle/battleController.js");
      let seed = 279;
      const rng = () =>
        (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
      state.board = createBoard(rng);
      state.enemies.forEach((e) => (e.hp = e.maxHp = 100000));
      view.board.render(state.board);
      vfx.clock.setSpeed(rate);
      const trace = [],
        attack = vfx.attack;
      vfx.attack = async (...args) => {
        const item = { source: args[0].source, start: performance.now() };
        trace.push(item);
        await attack(...args);
        item.end = performance.now();
      };
      const controller = createBattleController(state, view, vfx, { rng });
      const start = performance.now();
      await controller.move(...validMoves(state.board)[0]);
      return {
        duration: performance.now() - start,
        turn: state.turn,
        hp: state.heroes.map((h) => h.hp),
        energy: state.heroes.map((h) => h.energy),
        enemies: state.enemies.map((e) => e.hp),
        elements: state.board.map((g) => [
          g.element,
          g.specialType,
          g.hazardType,
        ]),
        trace,
      };
    }, rate);
    runs.push(result);
  }
  const [a, b] = runs;
  await writeFile(
    "tests/artifacts/controls-speed-comparison.json",
    JSON.stringify(
      {
        oneX: a.duration,
        twoX: b.duration,
        ratio: b.duration / a.duration,
        gameplayIdentical: [
          "turn",
          "hp",
          "energy",
          "enemies",
          "elements",
        ].every((key) => JSON.stringify(a[key]) === JSON.stringify(b[key])),
      },
      null,
      2,
    ),
  );
  expect(b.duration / a.duration).toBeGreaterThan(0.4);
  expect(b.duration / a.duration).toBeLessThan(0.65);
  for (const key of ["turn", "hp", "energy", "enemies", "elements"])
    expect(b[key]).toEqual(a[key]);
  for (const run of runs)
    for (let i = 1; i < run.trace.length; i++)
      expect(run.trace[i].start).toBeGreaterThanOrEqual(run.trace[i - 1].end);
  expect(a.trace.map((t) => t.source)).toEqual(b.trace.map((t) => t.source));
});
test("mid-action speed switches safely; replay cancels in-flight work; boss-only HUD uses runtime fixture", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(async () => {
    const { validMoves } = await import("/src/core/match3/engine.js");
    window.__battle.controller.move(
      ...validMoves(window.__battle.state.board)[0],
    );
  });
  await page.locator(".speed").click();
  await expect(page.locator(".speed")).toHaveAttribute("aria-pressed", "true");
  await page.locator(".speed").click();
  await page.locator(".pause").click();
  await page.evaluate(() => {
    window.__oldBattle = window.__battle;
    window.__oldBoardIds = window.__battle.state.board.map((g) => g.id);
  });
  await page.locator(".replay").click();
  await page.waitForTimeout(150);
  expect(
    await page.evaluate(() => window.__oldBattle.state.board.map((g) => g.id)),
  ).toEqual(await page.evaluate(() => window.__oldBoardIds));
  expect(
    await page.evaluate(() => window.__oldBattle.vfx.clock.pendingTimers),
  ).toBe(0);
  expect(await page.evaluate(() => window.__battle.state.turn)).toBe(0);
  await page.evaluate(() => {
    const { state, view, controller } = window.__battle;
    state.enemies[0].isBoss = true;
    view.enemies.spawn(state.enemies);
    controller.render();
  });
  await expect(page.locator(".enemy-hud")).toBeVisible();
  await expect(page.locator(".enemy-local-hud")).toHaveCount(1);
});
