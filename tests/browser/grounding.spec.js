import { test, expect } from "@playwright/test";
for (const size of [
  { width: 390, height: 844 },
  { width: 360, height: 800 },
  { width: 412, height: 915 },
])
  test(`new assets, footprint anchors, tier rings/local HUD and boss fixture at ${size.width}`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.url());
    });
    await page.setViewportSize(size);
    await page.goto("/");
    await expect(page.locator(".enemy")).toHaveCount(2);
    await page.evaluate(() => window.__battle.view.dismissMessage());
    expect(
      await page.locator(".combat").evaluate((el) => el.style.backgroundImage),
    ).toContain("BG_W01_COMMON_WHISPERING_WILDS.png");
    expect(
      await page
        .locator(".sprite-idle")
        .first()
        .evaluate((el) => el.src),
    ).toContain("BLIGHT_OOZE_IDLE.png");
    await expect(page.locator(".contact-shadow")).toHaveCount(2);
    await expect(page.locator(".enemy-local-name")).toHaveCount(0);
    await expect(page.locator(".enemy-hud")).toBeHidden();
    const normal = await page.locator(".enemy").first().boundingBox();
    const grounded = await page
      .locator(".enemy")
      .first()
      .evaluate((el) => ({
        spriteBottom: el
          .querySelector(".enemy-ground-anchor")
          .getBoundingClientRect().bottom,
        ringBottom: el.querySelector(".target-ring").getBoundingClientRect()
          .bottom,
        color: getComputedStyle(el.querySelector(".target-ring"))
          .borderTopColor,
        shadowOpacity: getComputedStyle(el.querySelector(".contact-shadow"))
          .opacity,
      }));
    expect(grounded.spriteBottom).toBeLessThan(grounded.ringBottom);
    expect(grounded.color).toBe("rgb(223, 207, 119)");
    expect(Number(grounded.shadowOpacity)).toBeGreaterThanOrEqual(0.18);
    await page.waitForTimeout(330);
    await page.screenshot({
      path: `tests/artifacts/grounding-normal-${size.width}.png`,
    });
    await page.evaluate(() => {
      const { state, view, controller } = window.__battle;
      state.stage = { ...state.stage, backgroundTier: "elite" };
      state.enemies = state.enemies.slice(0, 1);
      state.enemies[0].elite = true;
      state.enemies[0].maxMana = 100;
      state.enemies[0].mana = 40;
      view.enemies.spawn(state.enemies);
      controller.render();
    });
    await expect(page.locator(".enemy-hud")).toBeHidden();
    await expect(page.locator(".enemy-local-mana")).toBeVisible();
    expect(
      await page.locator(".combat").evaluate((el) => el.style.backgroundImage),
    ).toContain("BG_W01_ELITE_THORNROOT_CROSSING.png");
    const elite = await page.locator(".enemy").boundingBox();
    expect(
      await page
        .locator(".target-ring")
        .evaluate((el) => getComputedStyle(el).borderTopColor),
    ).toBe("rgb(198, 146, 242)");
    expect(elite.width).toBeGreaterThan(normal.width);
    await page.screenshot({
      path: `tests/artifacts/grounding-elite-${size.width}.png`,
    });
    await page.evaluate(() => {
      const { state, view, controller } = window.__battle;
      state.stage = { ...state.stage, backgroundTier: "boss" };
      Object.assign(state.enemies[0], {
        isBoss: true,
        elite: false,
        assetId: "BOSS_W01_THORNHEART",
        phase: 1,
        name: "THORNHEART",
        hp: 10000,
        maxHp: 10000,
      });
      view.enemies.spawn(state.enemies);
      controller.render();
    });
    await expect(page.locator(".enemy-hud")).toBeVisible();
    await expect(page.locator(".boss-stage-info")).toContainText("STAGE 1-1");
    await expect(page.locator(".enemy-local-hud")).toHaveCount(0);
    expect(
      await page.locator(".enemy-icon").evaluate((el) => el.src),
    ).toContain("GEM_WOOD");
    const boss = await page.locator(".enemy").boundingBox();
    expect(
      await page
        .locator(".target-ring")
        .evaluate((el) => getComputedStyle(el).borderTopColor),
    ).toBe("rgb(230, 124, 89)");
    expect(boss.width).toBeGreaterThan(elite.width);
    expect(boss.x).toBeGreaterThanOrEqual(0);
    expect(boss.x + boss.width).toBeLessThanOrEqual(size.width);
    expect(
      await page.locator(".combat").evaluate((el) => el.style.backgroundImage),
    ).toContain("BG_W01_BOSS_BRIARHEART_SANCTUARY.png");
    await page.waitForFunction(
      () => document.querySelector(".sprite-idle").naturalWidth > 0,
    );
    await page.screenshot({
      path: `tests/artifacts/grounding-boss-${size.width}.png`,
    });
    expect(errors).toEqual([]);
  });
