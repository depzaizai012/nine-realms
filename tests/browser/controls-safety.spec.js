import { test, expect } from "@playwright/test";
test("Help pauses an enemy action and resumes exactly two actions; repeated overlay switches remain clean", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/");
  await expect(page.locator(".hero-card")).toHaveCount(5);
  await page.evaluate(async () => {
    const { state, vfx, controller } = window.__battle;
    state.speed = 4;
    state.enemies.forEach((e) => (e.hp = e.maxHp = 100000));
    window.__enemyActions = [];
    const attack = vfx.attack;
    vfx.attack = async (...args) => {
      if (args[0].source.startsWith("w")) window.__enemyActions.push(args[0]);
      return attack(...args);
    };
    const { validMoves } = await import("/src/core/match3/engine.js");
    controller.move(...validMoves(state.board)[0]);
  });
  await page.waitForFunction(() => window.__battle.state.phase === "enemy");
  await page.evaluate(() => window.__battle.vfx.clock.setSpeed(1));
  await page.locator(".help").click();
  const snapshot = await page.evaluate(() => ({
    hp: window.__battle.state.heroes.map((h) => h.hp),
    actions: window.__enemyActions.length,
  }));
  await page.waitForTimeout(350);
  expect(
    await page.evaluate(() => ({
      hp: window.__battle.state.heroes.map((h) => h.hp),
      actions: window.__enemyActions.length,
    })),
  ).toEqual(snapshot);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.__battle.state.phase === "idle");
  expect(await page.evaluate(() => window.__enemyActions.length)).toBe(2);
  expect(
    await page.evaluate(() =>
      window.__battle.state.heroes.reduce(
        (sum, h) => sum + h.stats.hp - h.hp,
        0,
      ),
    ),
  ).toBe(110);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(async () => {
    const { overlays } = window.__battle;
    for (let i = 0; i < 10; i++) {
      overlays.openElementHelp();
      const oldClose = overlays.closeBattleOverlay();
      overlays.openPauseMenu();
      await oldClose;
      await overlays.closeBattleOverlay();
    }
  });
  expect(
    await page.evaluate(() => ({
      mode: window.__battle.state.activeBattleOverlay,
      paused: window.__battle.state.paused,
    })),
  ).toEqual({ mode: null, paused: false });
  expect(errors).toEqual([]);
});
test("new control/panel assets fail independently with named warnings and CSS fallback", async ({
  page,
}) => {
  const warnings = [];
  page.on("console", (m) => {
    if (m.type() === "warning") warnings.push(m.text());
  });
  for (const key of ["BTN_BATTLE_SPEED_X2_ACTIVE", "BTN_BATTLE_PAUSE_MENU_BG"])
    await page.route(`**/assets/ui/${key}.png`, (route) =>
      route.fulfill({ status: 404, body: "missing" }),
    );
  await page.goto("/");
  await expect(page.locator(".gem")).toHaveCount(42);
  await page.locator(".speed").click();
  expect(
    await page.evaluate(() => window.__battle.state.battleSpeedMultiplier),
  ).toBe(2);
  expect(
    await page
      .locator(".speed .control-fallback")
      .evaluate((e) => getComputedStyle(e).opacity),
  ).toBe("1");
  await page.locator(".pause").click();
  await expect(page.locator(".pause-panel")).toHaveClass(/ui-panel-fallback/);
  await expect(page.locator(".pause-panel button")).toHaveCount(2);
  await page.keyboard.press("Escape");
  await expect(page.locator(".battle-overlay-dialog")).not.toBeVisible();
  expect(
    warnings.some((t) => t.includes("BTN_BATTLE_SPEED_X2_ACTIVE.png")),
  ).toBe(true);
  expect(warnings.some((t) => t.includes("BTN_BATTLE_PAUSE_MENU_BG.png"))).toBe(
    true,
  );
});
