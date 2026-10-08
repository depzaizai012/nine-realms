import { test, expect } from "@playwright/test";
test("mobile touch swipe resolves one turn; pause stops in-flight resolution", async ({
  page,
}) => {
  await page.goto("/");
  const move = await page.evaluate(async () => {
    const { validMoves } = await import("/src/core/match3/engine.js");
    return validMoves(window.__battle.state.board)[0];
  });
  const a = await page.locator(".gem").nth(move[0]).boundingBox(),
    b = await page.locator(".gem").nth(move[1]).boundingBox();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: a.x + a.width / 2, y: a.y + a.height / 2 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForFunction(() => window.__battle.state.turn === 1);
  await page.locator(".pause").click();
  await expect(page.locator(".pause-dialog")).toBeVisible();
  const hp = await page.evaluate(() =>
    window.__battle.state.heroes.map((h) => h.hp),
  );
  await page.waitForTimeout(500);
  expect(
    await page.evaluate(() => window.__battle.state.heroes.map((h) => h.hp)),
  ).toEqual(hp);
  await page.locator(".resume").click();
  await page.evaluate(() => (window.__battle.state.speed = 5));
  await page.waitForFunction(() => window.__battle.state.phase === "idle");
  expect(await page.evaluate(() => window.__battle.state.turn)).toBe(1);
});
