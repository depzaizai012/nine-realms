import { test, expect } from "@playwright/test";
async function observeEffects(page) {
  await page.evaluate(() => {
    window.__effects = [];
    window.__animations = [];
    const original = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      if (this.closest(".vfx-layer"))
        window.__animations.push({
          className: this.className,
          frames: frames.length,
        });
      return original.call(this, frames, options);
    };
    new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes)
          if (node.nodeType === 1)
            window.__effects.push({
              className: node.className,
              frames: node
                .getAnimations()
                .flatMap((a) => a.effect.getKeyframes()).length,
            });
    }).observe(document.querySelector(".vfx-layer"), { childList: true });
  });
}
async function sawEffect(page, cls) {
  await expect
    .poll(() =>
      page.evaluate(
        (cls) =>
          window.__animations.some(
            (e) => e.className.split(" ").includes(cls) && e.frames > 0,
          ),
        cls,
      ),
    )
    .toBe(true);
}
test("FIRE swipe drives Fenrir VFX and damage, enemy feedback, invalid rollback", async ({
  page,
}) => {
  await page.goto("/");
  await observeEffects(page);
  await page.evaluate(() => {
    const { state, view } = window.__battle;
    state.speed = 2;
    const elements = ["WOOD", "FIRE", "WATER", "EARTH", "LIGHT", "DARK"];
    state.board = Array.from({ length: 42 }, (_, i) => ({
      id: i,
      element: elements[(Math.floor(i / 7) * 2 + (i % 7)) % 6],
      specialType: null,
      hazardType: null,
    }));
    state.board[0].element = "FIRE";
    state.board[1].element = "FIRE";
    state.board[2].element = "WATER";
    state.board[9].element = "FIRE";
    view.board.render(state.board);
  });
  const start = await page.locator(".gem").nth(2).boundingBox(),
    end = await page.locator(".gem").nth(9).boundingBox();
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, {
    steps: 5,
  });
  await page.mouse.up();
  await sawEffect(page, "slash");
  await sawEffect(page, "floating-number");
  await page.waitForFunction(() => window.__battle.state.phase === "idle");
  expect(
    await page.evaluate(() => window.__battle.state.enemies[0].hp),
  ).toBeLessThan(850);
  expect(
    await page.evaluate(() => window.__battle.state.heroes[1].energy),
  ).toBeGreaterThanOrEqual(20);
  expect(
    await page.evaluate(() =>
      window.__battle.state.heroes.some((h) => h.hp < h.stats.hp),
    ),
  ).toBe(true);
  const snapshot = await page.evaluate(async () => {
    const { state, controller } = window.__battle;
    const { isValidSwap } = await import("/src/core/match3/engine.js");
    const before = {
      turn: state.turn,
      hp: state.heroes.map((h) => h.hp),
      ids: state.board.map((g) => g.id),
    };
    for (let a = 0; a < 41; a++) {
      if (a % 7 < 6 && !isValidSwap(state.board, a, a + 1)) {
        await controller.move(a, a + 1);
        break;
      }
    }
    return {
      before,
      after: {
        turn: state.turn,
        hp: state.heroes.map((h) => h.hp),
        ids: state.board.map((g) => g.id),
      },
    };
  });
  expect(snapshot.after).toEqual(snapshot.before);
});
test("line beams, bomb explosion, prism rays, chain, death and heal particles", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => (window.__battle.state.speed = 2));
  await observeEffects(page);
  for (const type of ["LINE_HORIZONTAL", "LINE_VERTICAL", "BOMB", "PRISM"]) {
    await page.evaluate((type) => {
      const { state, view } = window.__battle;
      const elements = ["WOOD", "FIRE", "WATER", "EARTH", "LIGHT", "DARK"];
      state.board = Array.from({ length: 42 }, (_, i) => ({
        id: i + 100,
        element: elements[(Math.floor(i / 7) * 2 + (i % 7)) % 6],
        specialType: null,
        hazardType: null,
      }));
      state.enemies.forEach((e) => (e.hp = e.maxHp = 100000));
      if (type.startsWith("LINE")) {
        for (const i of [14, 15, 16]) state.board[i].element = "FIRE";
        state.board[15].specialType = type;
        state.board[type === "LINE_HORIZONTAL" ? 20 : 36].specialType = "BOMB";
      } else state.board[0].specialType = type;
      view.board.render(state.board);
    }, type);
    await page.evaluate((type) => {
      const { state, vfx } = window.__battle;
      import("/src/core/match3/engine.js").then(({ resolveStep }) => {
        window.__effectDone = false;
        const step = resolveStep(state.board, {
          swap: type.startsWith("LINE") ? null : [0, 1],
        });
        vfx.clear(step).then(() => (window.__effectDone = true));
      });
    }, type);
    const cls = type.startsWith("LINE")
      ? "beam"
      : type === "BOMB"
        ? "explosion"
        : "prism-ray";
    if (cls === "prism-ray")
      await expect
        .poll(() =>
          page.evaluate(() =>
            window.__effects.some((e) => e.className === "prism-ray"),
          ),
        )
        .toBe(true);
    else await sawEffect(page, cls);
    await page.waitForFunction(() => window.__effectDone);
    await page.evaluate(() => (window.__effects = []));
  }
  await page.evaluate(() => {
    const { state, controller } = window.__battle;
    state.heroes[0].hp = 100;
    state.heroes[0].energy = 100;
    controller.useUltimate(state.heroes[0].id);
  });
  await sawEffect(page, "heal-particle");
  await sawEffect(page, "heal");
  await page.waitForFunction(() => window.__battle.state.phase === "idle");
  await page.evaluate(() => {
    window.__deathDone = false;
    window.__battle.vfx.death("w0-0").then(() => (window.__deathDone = true));
  });
  await expect(page.locator('[data-actor="w0-0"]')).toBeAttached();
  await page.waitForFunction(() => window.__deathDone);
  await expect(page.locator('[data-actor="w0-0"]')).toHaveCount(0);
});
test("stage preloader requests only its 19 production assets with zero missing files", async ({
  page,
}) => {
  await page.goto("/");
  const audit = await page.evaluate(async () => {
    const { stageAssets, MANIFEST } =
      await import("/src/data/assets/manifest.js");
    const urls = stageAssets();
    return {
      count: urls.length,
      detected: Object.keys(MANIFEST).length,
      failed: (
        await Promise.all(
          urls.map(async (url) => ({ url, status: (await fetch(url)).status })),
        )
      ).filter((r) => r.status !== 200),
      unused: [...performance.getEntriesByType("resource")]
        .filter((r) =>
          /ULTIMATE_CUTIN|PORTRAIT|FULL_BODY|THORN_WOLF|THORNHEART|WOOD_TEMPLE/.test(
            r.name,
          ),
        )
        .map((r) => r.name),
    };
  });
  expect(audit.count).toBe(19);
  expect(audit.detected).toBe(56);
  expect(audit.failed).toEqual([]);
  expect(audit.unused).toEqual([]);
});
