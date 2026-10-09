import { test, expect } from "@playwright/test";

test("stage map opens on new sessions and keeps locked stages non-playable", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  for (const size of [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/");
    await expect(page.locator(".stage-select-screen")).toBeVisible();
    await expect(page.locator(".stage-node")).toHaveCount(10);
    await expect(page.locator(".stage-details-title")).toHaveText("Whispers in the Canopy");
    await expect(page.locator(".stage-play-button")).toBeEnabled();
    await page.locator('[data-stage-id="1-2"]').click();
    await expect(page.locator(".stage-details-badge")).toHaveText("LOCKED");
    await expect(page.locator(".stage-play-button")).toBeDisabled();
    await page.locator('[data-stage-id="1-10"]').click();
    await expect(page.locator(".stage-details-kicker")).toContainText("BOSS");
    await expect(page.locator(".stage-play-button")).toBeDisabled();
    const box = await page.locator(".stage-play-button").boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(size.width);
    await page.locator('[data-stage-id="1-1"]').click();
    await expect(page.locator(".stage-play-button")).toHaveText("BEGIN BATTLE");
  }
  await page.locator(".stage-play-button").click();
  await expect(page.locator(".gem")).toHaveCount(42);
  await expect(page.locator(".hero-card")).toHaveCount(5);
  await page.locator(".pause").click();
  await page.locator(".back-town").click();
  await expect(page.locator(".town-screen")).toBeVisible();
  await page.locator(".stage-select-link").click();
  await expect(page.locator(".stage-node")).toHaveCount(10);
  expect(errors).toEqual([]);
});

test("winning stage 1-1 records stars, survives refresh, and never launches 1-2 before implementation", async ({ page }) => {
  await page.goto("/");
  await page.locator(".stage-play-button").click();
  await page.evaluate(() => {
    const { state, view } = window.__battle;
    state.turn = 15;
    view.result(true, state);
  });
  await expect(page.locator(".result-dialog")).toBeVisible();
  await page.locator(".stage-map-button").click();
  await expect(page.locator(".stage-select-screen")).toBeVisible();
  await expect(page.locator(".stage-progress-meta")).toContainText("1/10 cleared");
  await expect(page.locator('[data-stage-id="1-1"]')).toHaveClass(/cleared/);
  await page.locator('[data-stage-id="1-2"]').click();
  await expect(page.locator(".stage-details-badge")).toHaveText("COMING SOON");
  await expect(page.locator(".stage-play-button")).toBeDisabled();
  await page.reload();
  await expect(page.locator(".stage-progress-meta")).toContainText("1/10 cleared");
  await expect(page.locator('[data-stage-id="1-1"]')).toHaveClass(/cleared/);
  await expect(page.locator('[data-stage-id="1-2"]')).toHaveClass(/coming-soon/);
});
