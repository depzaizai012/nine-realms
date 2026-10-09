import { test, expect } from "@playwright/test";
test("Replay during a killing ultimate exit cancels the old queue without stale victory/dialog work", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/?screen=battle");
  await expect(page.locator(".hero-card")).toHaveCount(5);
  await page.evaluate(() => {
    const { state, view, controller } = window.__battle;
    state.wave = 2;
    state.enemies = state.enemies.slice(0, 1);
    state.enemies[0].hp = 1;
    state.heroes[1].energy = 100;
    state.speed = 4;
    view.enemies.spawn(state.enemies);
    controller.render();
    controller.useUltimate(state.heroes[1].id);
  });
  await page.waitForFunction(() => {
    const layer = document.querySelector(".ultimate-layer");
    return (
      layer &&
      layer.getAnimations().some((a) => a.effect.getTiming().duration === 360)
    );
  });
  await page.locator(".pause").click();
  await page.locator(".replay").click();
  await page.waitForTimeout(150);
  await expect(page.locator(".gem")).toHaveCount(42);
  await expect(page.locator(".result-dialog")).not.toBeVisible();
  expect(
    await page.evaluate(() => ({
      wave: window.__battle.state.wave,
      phase: window.__battle.state.phase,
    })),
  ).toEqual({ wave: 0, phase: "idle" });
  expect(errors).toEqual([]);
});
