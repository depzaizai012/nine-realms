import { test, expect } from "@playwright/test";
async function open(page) {
  await page.goto("/");
  await expect(page.locator(".hero-card")).toHaveCount(5);
  await page.evaluate(() => window.__battle.view.dismissMessage());
}
const card = (page) => page.locator(".hero-card").first();
test("six real HUD PNGs load once, correct layers, portrait sizing and no shift at mobile sizes", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("response", (r) => {
    if (r.url().includes("/assets/ui/") && r.status() >= 400)
      errors.push(r.url());
  });
  for (const size of [
    { width: 390, height: 844 },
    { width: 360, height: 800 },
    { width: 412, height: 915 },
  ]) {
    await page.setViewportSize(size);
    await open(page);
    const before = await page.locator(".hero-card").evaluateAll((cards) =>
      cards.map((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
    await page.evaluate(() => {
      const { state, controller } = window.__battle;
      for (const [i, h] of state.heroes.entries()) {
        h.energy = [0, 1, 4].includes(i) ? 100 : 0;
        h.statuses = Array.from({ length: 6 }, (_, j) => ({
          id: `s${j}`,
          type: j === 0 ? "CONTROL" : j === 1 ? "DOT" : "BUFF",
          stacks: j === 1 ? 3 : 1,
          durationTurns: 2,
        }));
      }
      controller.render();
    });
    await expect(page.locator(".hero-card.charged")).toHaveCount(3);
    await expect(
      page.locator(".hero-card").first().locator(".status-slot"),
    ).toHaveCount(4);
    await expect(card(page).locator(".status-overflow")).toHaveText("+3");
    const after = await page.locator(".hero-card").evaluateAll((cards) =>
      cards.map((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
    expect(after).toEqual(before);
    const layout = await page.evaluate(() => ({
      scroll: document.documentElement.scrollHeight > innerHeight,
      imgs: [...document.querySelectorAll("img[data-hud-asset]")].every(
        (i) => i.complete && i.naturalWidth > 0,
      ),
      cards: [...document.querySelectorAll(".hero-card")].map((e) => {
        const c = e.getBoundingClientRect(),
          p = e.querySelector(".avatar-wrap").getBoundingClientRect(),
          hp = e.querySelector(".hp").getBoundingClientRect(),
          text = e.querySelector(".hp-text").getBoundingClientRect(),
          mana = e.querySelector(".energy").getBoundingClientRect(),
          slots = [...e.querySelectorAll(".status-slot")].map((s) =>
            s.getBoundingClientRect(),
          );
        return {
          right: c.right,
          top: c.top,
          portrait: p.width,
          hpHeight: hp.height,
          manaHeight: mana.height,
          textInside: hp.top <= text.top && hp.bottom >= text.bottom,
          slotsInside: slots.every(
            (s) => s.left >= c.left && s.right <= c.right,
          ),
        };
      }),
    }));
    expect(layout.scroll).toBe(false);
    expect(layout.imgs).toBe(true);
    expect(
      layout.cards.every(
        (c) => c.right <= size.width && c.slotsInside && c.textInside,
      ),
    ).toBe(true);
    expect(new Set(layout.cards.map((c) => c.top)).size).toBe(1);
    for (const c of layout.cards) {
      expect(c.hpHeight).toBeGreaterThanOrEqual(8);
      expect(c.hpHeight).toBeLessThanOrEqual(11);
      expect(c.manaHeight).toBeGreaterThanOrEqual(4);
      expect(c.portrait).toBeGreaterThanOrEqual(62);
    }
    await page.waitForTimeout(320);
    await page.screenshot({
      path: `tests/artifacts/hud-ready-status-${size.width}.png`,
    });
  }
  const urls = await page.evaluate(async () => {
    const { COMMON_HUD_ASSETS, getHudAsset } =
      await import("/src/data/assets/manifest.js");
    return Promise.all(
      COMMON_HUD_ASSETS.map(async (key) => {
        const response = await fetch(getHudAsset(key));
        await response.arrayBuffer();
        return { key, status: response.status };
      }),
    );
  });
  expect(urls).toHaveLength(6);
  expect(urls.every((r) => r.status === 200)).toBe(true);
  const reused = await page.evaluate(async () => {
    const hudCount = () =>
      performance
        .getEntriesByType("resource")
        .filter((e) => e.name.includes("/assets/ui/")).length;
    const before = hudCount();
    for (let i = 0; i < 20; i++) window.__battle.controller.render();
    // Reuse the app's module URL, including Vite's development HMR query.
    const loadedModule = performance
      .getEntriesByType("resource")
      .find(
        (e) => new URL(e.name).pathname === "/src/data/assets/preloader.js",
      );
    const { preloadStage } = await import(
      loadedModule?.name || "/src/data/assets/preloader.js"
    );
    await preloadStage();
    await preloadStage();
    return { before, after: hudCount() };
  });
  expect(reused.after).toBe(reused.before);
  expect(errors).toEqual([]);
});
test("HP color thresholds and healing transitions preserve text overlay and damage trail", async ({
  page,
}) => {
  await open(page);
  for (const [hp, tone] of [
    [100, "GREEN"],
    [60, "GREEN"],
    [59, "YELLOW"],
    [30, "YELLOW"],
    [29, "RED"],
    [1, "RED"],
    [0, "RED"],
    [40, "YELLOW"],
    [70, "GREEN"],
  ]) {
    await page.evaluate((hp) => {
      const { state, controller } = window.__battle;
      state.heroes[0].hp = hp;
      state.heroes[0].stats.hp = 100;
      controller.render();
    }, hp);
    await expect(card(page)).toHaveAttribute("data-hp-tone", tone);
    const colors = {
      GREEN: "rgb(53, 205, 99)",
      YELLOW: "rgb(237, 188, 48)",
      RED: "rgb(233, 73, 64)",
    };
    await expect
      .poll(
        () =>
          card(page)
            .locator(".hp .fill")
            .evaluate((el) => getComputedStyle(el).backgroundColor),
        { timeout: 1500 },
      )
      .toBe(colors[tone]);
    await expect(card(page).locator(".hp-text")).toHaveText(`${hp} / 100`);
    if (hp === 0) await expect(card(page)).toBeDisabled();
  }
  await page.evaluate(() => {
    const { state, controller } = window.__battle;
    state.heroes[0].hp = 507;
    state.heroes[0].stats.hp = 760;
    controller.render();
    state.heroes[0].hp = 400;
    controller.render();
  });
  const timing = await card(page)
    .locator(".trail")
    .evaluate((el) => ({
      duration: getComputedStyle(el).transitionDuration,
      delay: getComputedStyle(el).transitionDelay,
    }));
  expect(timing.duration).toBe("0.5s");
  expect(timing.delay).toBe("0.15s");
  await page.evaluate(() => {
    const { state, controller } = window.__battle;
    state.heroes[0].hp = 12845;
    state.heroes[0].stats.hp = 12845;
    controller.render();
  });
  await expect(card(page).locator(".hp-text")).toHaveText("12,845 / 12,845");
});
test("Readiness transition fires once, mana consumption clears gold, dead full mana cannot cast", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => {
    const { state, controller } = window.__battle;
    state.heroes[0].energy = 99;
    controller.render();
  });
  await expect(card(page)).not.toHaveClass(/charged/);
  await page.waitForTimeout(210);
  await page.evaluate(() => {
    const { state, controller } = window.__battle;
    state.heroes[0].energy = 100;
    controller.render();
  });
  await expect(card(page)).toHaveClass(/ready-arrival/);
  await expect(card(page)).toHaveAttribute("data-ready-transitions", "1");
  await page.evaluate(() => {
    for (let i = 0; i < 10; i++) window.__battle.controller.render();
  });
  await expect(card(page)).toHaveAttribute("data-ready-transitions", "1");
  await page.waitForTimeout(650);
  await expect(card(page)).not.toHaveClass(/ready-arrival/);
  expect(
    await card(page)
      .locator(".energy .fill")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("rgb(255, 212, 79)");
  await page.evaluate(() => {
    const { state, controller } = window.__battle;
    state.heroes[0].hp = 300;
    state.speed = 5;
    controller.useUltimate(state.heroes[0].id);
  });
  await page.waitForFunction(() => window.__battle.state.phase === "idle");
  await expect(card(page)).not.toHaveClass(/charged/);
  expect(
    await card(page)
      .locator(".hero-ultimate-glow")
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe("0");
  await page.waitForTimeout(210);
  expect(
    await card(page)
      .locator(".energy .fill")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("rgb(35, 183, 228)");
  await page.evaluate(() => {
    const { state, controller } = window.__battle;
    state.heroes[0].hp = 0;
    state.heroes[0].energy = 100;
    controller.render();
  });
  await expect(card(page)).toBeDisabled();
  await expect(card(page)).not.toHaveClass(/charged/);
  const state = await page.evaluate(() => ({
    hp: window.__battle.state.heroes[0].hp,
    energy: window.__battle.state.heroes[0].energy,
    phase: window.__battle.state.phase,
  }));
  await card(page).evaluate((el) => el.click());
  expect(
    await page.evaluate(() => ({
      hp: window.__battle.state.heroes[0].hp,
      energy: window.__battle.state.heroes[0].energy,
      phase: window.__battle.state.phase,
    })),
  ).toEqual(state);
});
test("status row hides at zero, supports stacks/turns/overflow and existing shield/buff state", async ({
  page,
}) => {
  await open(page);
  for (const count of [0, 1, 4, 6]) {
    await page.evaluate((count) => {
      const { state, controller } = window.__battle;
      state.heroes[0].statuses = Array.from({ length: count }, (_, i) => ({
        id: `effect${i}`,
        type: i === 0 ? "CONTROL" : i === 1 ? "DOT" : "BUFF",
        name: i === 1 ? "Poison" : "Effect",
        stacks: i === 1 ? 3 : 1,
        durationTurns: 2,
        priority: count - i,
      }));
      controller.render();
    }, count);
    await expect(card(page).locator(".status-slot")).toHaveCount(
      Math.min(count, 4),
    );
    if (count === 0)
      await expect(card(page).locator(".status-container")).toBeHidden();
    if (count === 6)
      await expect(card(page).locator(".status-overflow")).toHaveText("+3");
  }
  await expect(
    card(page).locator('[data-type="DOT"] .status-counter'),
  ).toHaveText("×3");
  await page.evaluate(() => {
    const { state, controller } = window.__battle;
    state.heroes[0].statuses = [];
    state.heroes[0].shield = 240;
    state.heroes[0].modifiers.buff = 0.2;
    controller.render();
  });
  await expect(card(page).locator('[data-type="SHIELD"]')).toHaveCount(1);
  await expect(card(page).locator('[data-type="BUFF"]')).toHaveCount(1);
});
test("missing HUD file uses CSS fallback only, battle still renders with all avatars", async ({
  page,
}) => {
  const warnings = [];
  page.on("console", (m) => {
    if (m.type() === "warning") warnings.push(m.text());
  });
  await page.route("**/assets/ui/HUD_HERO_FRAME_NORMAL.png", (route) =>
    route.fulfill({ status: 404, body: "missing" }),
  );
  await open(page);
  await expect(
    page.locator(".hero-card.missing-hud_hero_frame_normal"),
  ).toHaveCount(5);
  await expect(page.locator(".gem")).toHaveCount(42);
  expect(
    await card(page)
      .locator(".frame-fallback")
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe("1");
  expect(warnings.some((w) => w.includes("HUD_HERO_FRAME_NORMAL.png"))).toBe(
    true,
  );
  expect(
    await page
      .locator(".avatar")
      .evaluateAll((images) => images.every((i) => i.naturalWidth > 0)),
  ).toBe(true);
});
