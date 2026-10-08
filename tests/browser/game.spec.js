import { test, expect } from "@playwright/test";
test("mobile layouts, production art, target, drag, pause and hints", async ({
  page,
}) => {
  const failures = [];
  page.on("pageerror", (e) => failures.push(String(e)));
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
  });
  for (const size of [
    { width: 390, height: 844 },
    { width: 360, height: 800 },
    { width: 412, height: 915 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/");
    await expect(page.locator(".gem")).toHaveCount(42);
    await expect(page.locator(".hero-card")).toHaveCount(5);
    await expect(page.locator(".enemy")).toHaveCount(2);
    const layout = await page.evaluate(() => {
      const board = document.querySelector(".board").getBoundingClientRect(),
        cards = [...document.querySelectorAll(".hero-card")].map((e) =>
          e.getBoundingClientRect(),
        ),
        footer = document.querySelector("footer").getBoundingClientRect();
      return {
        cols: getComputedStyle(
          document.querySelector(".board"),
        ).gridTemplateColumns.split(" ").length,
        rows: getComputedStyle(
          document.querySelector(".board"),
        ).gridTemplateRows.split(" ").length,
        scroll: document.documentElement.scrollHeight > innerHeight,
        sameRow: cards.every((r) => r.y === cards[0].y),
        gap: board.top - cards[0].bottom,
        boardBottom: board.bottom,
        footerBottom: footer.bottom,
        images: [...document.images].every(
          (i) => i.hidden || i.naturalWidth > 0,
        ),
      };
    });
    expect(layout.cols).toBe(7);
    expect(layout.rows).toBe(6);
    expect(layout.scroll).toBe(false);
    expect(layout.sameRow).toBe(true);
    expect(layout.footerBottom).toBeLessThanOrEqual(size.height);
    expect(layout.images).toBe(true);
    await page.screenshot({ path: `tests/artifacts/battle-${size.width}.png` });
  }
  await page.locator(".enemy").nth(1).click();
  expect(await page.evaluate(() => window.__battle.state.selected)).toBe(
    "w0-1",
  );
  await expect(page.locator(".speed")).toHaveCount(0);
  await expect(page.locator(".auto-control")).toContainText("AUTO");
  await expect(page.locator(".auto-control")).toBeDisabled();
  expect(
    await page.evaluate(() => window.__battle.state.autoBattleEnabled),
  ).toBe(false);
  await page.locator(".pause").click();
  await expect(page.locator(".pause-dialog")).toBeVisible();
  await page.locator(".resume").click();
  await expect(page.locator(".pause-dialog")).not.toBeVisible();
  const move = await page.evaluate(async () => {
    const { validMoves } = await import("/src/core/match3/engine.js");
    return validMoves(window.__battle.state.board)[0];
  });
  const a = await page.locator(".gem").nth(move[0]).boundingBox(),
    b = await page.locator(".gem").nth(move[1]).boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 5 });
  await page.mouse.up();
  await page.waitForFunction(() => window.__battle.state.phase === "idle");
  expect(await page.evaluate(() => window.__battle.state.turn)).toBe(1);
  expect(
    await page.evaluate(() =>
      window.__battle.state.heroes.some((h) => h.hp < h.stats.hp),
    ),
  ).toBe(true);
  await page.waitForTimeout(16000);
  await expect(page.locator(".hint")).toHaveCount(2);
  await expect(page.locator(".directional")).toHaveCount(1);
  expect(failures).toEqual([]);
});
test("real controller clears three waves; ultimates render healing; death removes after dissolve", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    const { state } = window.__battle;
    state.speed = 30;
    state.heroes[0].hp = 300;
    state.heroes[0].energy = 100;
  });
  await page.locator(".hero-card").first().click();
  await page.waitForFunction(() => window.__battle.state.phase === "idle");
  expect(await page.evaluate(() => window.__battle.state.heroes[0].hp)).toBe(
    560,
  );
  for (let wave = 0; wave < 3; wave++) {
    await page.evaluate(async () => {
      const { state, controller } = window.__battle;
      const { validMoves } = await import("/src/core/match3/engine.js");
      state.enemies.forEach((e) => (e.hp = 1));
      for (
        let turn = 0;
        turn < 15 &&
        state.wave ===
          Number(document.querySelector("#wave").textContent[0]) - 1 &&
        state.phase !== "victory";
        turn++
      ) {
        const before = state.wave;
        await controller.move(...validMoves(state.board)[0]);
        if (state.wave !== before) break;
      }
    });
  }
  await expect(page.locator(".result-dialog")).toBeVisible();
  await expect(page.locator(".result-dialog")).toContainText(
    "All three waves cleared",
  );
});
