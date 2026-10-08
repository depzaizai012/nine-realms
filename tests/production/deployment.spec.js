import { test, expect } from "@playwright/test";
test.afterAll(async () => {
  await fetch("http://127.0.0.1:4178/__test_shutdown", { method: "POST" });
});
test("built game loads with all production assets and direct SPA refresh on mobile viewports", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("response", (r) => {
    if (r.status() >= 400)
      errors.push(`${r.status()} ${new URL(r.url()).pathname}`);
  });
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 360, height: 800 },
    { width: 412, height: 915 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/battle/1-1");
    await expect(page.locator(".hero-card")).toHaveCount(5);
    await expect(page.locator(".gem")).toHaveCount(42);
    await expect(page.locator(".enemy")).toHaveCount(2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight > innerHeight,
      ),
    ).toBe(false);
    expect(await page.evaluate(() => typeof window.__battle)).toBe("undefined");
    expect(await page.evaluate(() => typeof window.__gameRouter)).toBe(
      "undefined",
    );
    await page.locator(".help").tap();
    await expect(page.locator(".element-panel")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".battle-overlay-dialog")).not.toBeVisible();
    await page.locator(".speed").tap();
    await expect(page.locator(".speed")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.locator(".pause").tap();
    await page.locator(".replay").tap();
    await expect(page.locator(".speed")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await page.reload();
    await expect(page.locator(".gem")).toHaveCount(42);
  }
  await page.locator(".pause").tap();
  await page.locator(".back-town").tap();
  await expect(page.locator(".town-screen")).toBeVisible();
  await page.locator(".town-screen button").tap();
  await expect(page.locator(".hero-card")).toHaveCount(5);
  expect(errors).toEqual([]);
});
test("production routing serves real files, preserves MIME types and rejects missing/case-wrong assets", async ({
  request,
}) => {
  const index = await request.get("/");
  expect(index.status()).toBe(200);
  expect(index.headers()["content-type"]).toContain("text/html");
  const deep = await request.get("/town");
  expect(deep.status()).toBe(200);
  const asset = await request.get("/assets/ui/BTN_BATTLE_HELP.png");
  expect(asset.status()).toBe(200);
  expect(asset.headers()["content-type"]).toContain("image/png");
  expect((await request.get("/assets/ui/btn_battle_help.png")).status()).toBe(
    404,
  );
  expect((await request.get("/assets/nonexistent.png")).status()).toBe(404);
  expect((await request.get("/nonexistent.js")).status()).toBe(404);
});
