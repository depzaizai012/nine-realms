import { test, expect } from "@playwright/test";
async function setup(page) {
  await page.goto("/?screen=battle");
  await page.evaluate(() => {
    window.__animations = [];
    window.__actions = [];
    const original = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      window.__animations.push({
        className: this.className,
        cell: this.dataset.cell,
        actor: this.dataset.actor,
        frames,
        duration: options.duration,
        time: performance.now(),
      });
      return original.call(this, frames, options);
    };
    const { vfx } = window.__battle,
      attack = vfx.attack;
    vfx.attack = async (...args) => {
      const entry = { source: args[0].source, start: performance.now() };
      window.__actions.push(entry);
      try {
        return await attack(...args);
      } finally {
        entry.end = performance.now();
      }
    };
  });
}
async function fixture(page) {
  await page.evaluate(async () => {
    const { state, view } = window.__battle;
    const { BOARD_CONFIG: C } = await import("/src/data/boardConfig.js");
    const { ELEMENTS } = await import("/src/data/elements/index.js");
    state.board = Array.from({ length: C.rows * C.cols }, (_, i) => ({
      id: -i - 1,
      element:
        ELEMENTS[(Math.floor(i / C.cols) * 2 + (i % C.cols)) % ELEMENTS.length],
      specialType: null,
      hazardType: null,
    }));
    state.speed = 1;
    view.board.render(state.board);
    window.__animations = [];
  });
}

test("FIRE gesture raises only Fenrir, uses readable normal VFX, returns and keeps input locked", async ({
  page,
}) => {
  await setup(page);
  await fixture(page);
  const before = await page.locator(".hero-card").evaluateAll((cards) =>
    cards.map((el) => ({
      id: el.dataset.actor,
      top: el.getBoundingClientRect().top,
    })),
  );
  await page.evaluate(() => {
    const { state, view, controller } = window.__battle;
    state.board[0].element = "FIRE";
    state.board[1].element = "FIRE";
    state.board[2].element = "WATER";
    state.board[9].element = "FIRE";
    view.board.render(state.board);
    controller.move(2, 9);
  });
  await page.waitForFunction(() => {
    const card = document.querySelector('[data-actor="HERO_002_FENRIR"]');
    return (
      card.classList.contains("hero-acting") &&
      new DOMMatrix(getComputedStyle(card).transform).m42 <= -27
    );
  });
  const raised = await page.locator(".hero-card").evaluateAll((cards) =>
    cards.map((el) => ({
      id: el.dataset.actor,
      top: el.getBoundingClientRect().top,
      acting: el.classList.contains("hero-acting"),
      scale: new DOMMatrix(getComputedStyle(el).transform).m11,
      dy: new DOMMatrix(getComputedStyle(el).transform).m42,
    })),
  );
  expect(raised[1].acting).toBe(true);
  expect(raised[1].dy).toBeCloseTo(-28, 0);
  expect(raised[1].scale).toBeCloseTo(1.08, 1);
  for (const i of [0, 2, 3, 4])
    expect(raised[i].top).toBeCloseTo(before[i].top, 1);
  await expect(page.locator(".ultimate-art")).toHaveCount(0);
  expect(await page.evaluate(() => window.__battle.controller.move(0, 1))).toBe(
    false,
  );
  await page.screenshot({ path: "tests/artifacts/polish-hero-rise.png" });
  await page.waitForFunction(() =>
    window.__actions.some((a) => a.source === "HERO_002_FENRIR" && a.end),
  );
  const normal = await page.evaluate(() => ({
    action: window.__actions.find((a) => a.source === "HERO_002_FENRIR"),
    projectile: window.__animations.some(
      (a) => a.className.includes("projectile slash") && a.duration === 350,
    ),
    number: window.__animations.some(
      (a) => a.className === "floating-number damage",
    ),
    hp: window.__battle.state.enemies[0].hp,
  }));
  expect(normal.action.end - normal.action.start).toBeGreaterThanOrEqual(1100);
  expect(normal.action.end - normal.action.start).toBeLessThan(1400);
  expect(normal.projectile).toBe(true);
  expect(normal.number).toBe(true);
  expect(normal.hp).toBeLessThanOrEqual(665);
  await page.waitForFunction(() => window.__battle.state.phase === "idle");
  await expect(page.locator(".hero-acting")).toHaveCount(0);
  expect(await page.evaluate(() => window.__battle.state.turn)).toBe(1);
});

test("four-cascade gesture awaits distinct heroes and returns them before its single enemy phase", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    const { state, view } = window.__battle;
    const { createBoard, validMoves } =
      await import("/src/core/match3/engine.js");
    const { createBattleController } =
      await import("/src/core/battle/battleController.js");
    let seed = 279;
    const rng = () =>
      (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    state.board = createBoard(rng);
    state.enemies.forEach((e) => (e.hp = e.maxHp = 100000));
    state.speed = 5;
    view.board.render(state.board);
    const controller = createBattleController(
      state,
      view,
      window.__battle.vfx,
      { rng },
    );
    window.__moveDone = false;
    controller
      .move(...validMoves(state.board)[0])
      .then(() => (window.__moveDone = true));
  });
  await page.waitForFunction(() => window.__moveDone);
  const trace = await page.evaluate(() => ({
    actions: window.__actions,
    turn: window.__battle.state.turn,
    active: document.querySelectorAll(".hero-acting").length,
  }));
  const heroes = trace.actions.filter((a) => a.source.startsWith("HERO_")),
    enemies = trace.actions.filter((a) => a.source.startsWith("w"));
  expect(new Set(heroes.map((a) => a.source)).size).toBeGreaterThanOrEqual(3);
  expect(enemies).toHaveLength(2);
  expect(trace.turn).toBe(1);
  expect(trace.active).toBe(0);
  for (let i = 1; i < trace.actions.length; i++)
    expect(trace.actions[i].start).toBeGreaterThanOrEqual(
      trace.actions[i - 1].end,
    );
  expect(enemies[0].start).toBeGreaterThan(heroes.at(-1).end);
});

test("normal match animates only cleared gems and gravity never fades stationary gems or frame", async ({
  page,
}) => {
  await setup(page);
  await fixture(page);
  await page.evaluate(async () => {
    const { state, vfx } = window.__battle;
    const { resolveStep } = await import("/src/core/match3/engine.js");
    for (const i of [0, 1, 2]) state.board[i].element = "FIRE";
    window.__step = resolveStep(state.board);
    window.__clearDone = false;
    vfx.clear(window.__step).then(() => (window.__clearDone = true));
  });
  await page.waitForFunction(() => window.__clearDone);
  const clear = await page.evaluate(() => ({
    step: window.__step.clear,
    animated: window.__animations
      .filter((a) => a.cell !== undefined)
      .map((a) => Number(a.cell)),
    global: window.__animations.filter((a) =>
      /^(board|board-frame|board-shell|visual-root)$/.test(a.className),
    ),
    stable: {
      opacity: getComputedStyle(document.querySelector('[data-cell="41"]'))
        .opacity,
      filter: getComputedStyle(document.querySelector(".board-frame")).filter,
    },
  }));
  expect(clear.step).toEqual([0, 1, 2]);
  expect(clear.animated).toEqual([0, 1, 2]);
  expect(clear.global).toEqual([]);
  expect(clear.stable.opacity).toBe("1");
  expect(clear.stable.filter).toBe("none");
  await page.evaluate(async () => {
    const { state, view, vfx } = window.__battle;
    const { fallAndRefill } = await import("/src/core/match3/engine.js");
    const before = state.board;
    state.board = fallAndRefill(before, window.__step);
    view.board.render(state.board);
    window.__expectedFall = state.board.flatMap((g, i) =>
      g.id !== before[i].id ? [i] : [],
    );
    window.__animations = [];
    await vfx.fall(before, state.board);
  });
  const fall = await page.evaluate(() => ({
    expected: window.__expectedFall,
    animated: window.__animations
      .filter((a) => a.cell !== undefined)
      .map((a) => Number(a.cell)),
    opacity: window.__animations.some((a) =>
      a.frames.some((f) => "opacity" in f),
    ),
  }));
  expect(fall.animated).toEqual(fall.expected);
  expect(fall.opacity).toBe(false);
});

for (const type of ["LINE_HORIZONTAL", "LINE_VERTICAL"])
  test(`${type} uses correct art, axis, exact affected cells and ordered local sweep`, async ({
    page,
  }) => {
    await setup(page);
    await fixture(page);
    const horizontal = type === "LINE_HORIZONTAL",
      index = horizontal ? 25 : 19;
    await page.evaluate(
      async ({ type, index }) => {
        const { state, view, vfx } = window.__battle;
        const { resolveStep } = await import("/src/core/match3/engine.js");
        const delta = type === "LINE_HORIZONTAL" ? 1 : 7;
        for (const i of [index - delta, index, index + delta])
          state.board[i].element =
            type === "LINE_HORIZONTAL" ? "LIGHT" : "EARTH";
        state.board[index].specialType = type;
        view.board.render(state.board);
        window.__step = resolveStep(state.board);
        window.__clearStart = performance.now();
        window.__clearDone = false;
        vfx.clear(window.__step).then(() => {
          window.__clearEnd = performance.now();
          window.__clearDone = true;
        });
      },
      { type, index },
    );
    await page.waitForFunction(
      (horizontal) =>
        !!document.querySelector(
          horizontal ? ".beam.horizontal" : ".beam.vertical",
        ),
      horizontal,
    );
    const beam = await page.evaluate((horizontal) => {
      const el = document.querySelector(
          horizontal ? ".beam.horizontal" : ".beam.vertical",
        ),
        rect = el.getBoundingClientRect(),
        board = document.querySelector(".board").getBoundingClientRect();
      return {
        cells: el.dataset.cells.split(",").map(Number),
        width: rect.width,
        height: rect.height,
        gridWidth: board.width,
        gridHeight: board.height,
        rotated: getComputedStyle(
          document.querySelector(
            `[data-cell="${horizontal ? 25 : 19}"] .special`,
          ),
        ).rotate,
      };
    }, horizontal);
    const expected = horizontal
      ? [21, 22, 23, 24, 25, 26, 27]
      : [5, 12, 19, 26, 33, 40];
    expect(beam.cells).toEqual(expected);
    expect(beam.rotated).toBe("0deg");
    if (horizontal) {
      expect(beam.width).toBeCloseTo(beam.gridWidth, 0);
      expect(beam.height).toBe(4);
    } else {
      expect(beam.height).toBeCloseTo(beam.gridHeight, 0);
      expect(beam.width).toBe(4);
    }
    await page.screenshot({ path: `tests/artifacts/polish-${type}.png` });
    await page.waitForFunction(() => window.__clearDone);
    const result = await page.evaluate(() => ({
      clear: window.__step.clear,
      explosions: window.__animations
        .filter((a) => a.cell !== undefined && a.frames.at(-1).opacity === 0)
        .map((a) => ({ cell: Number(a.cell), time: a.time })),
      elapsed: window.__clearEnd - window.__clearStart,
    }));
    expect([...result.clear].sort((a, b) => a - b)).toEqual(expected);
    expect(result.explosions.map((a) => a.cell)).toEqual(expected);
    for (let i = 1; i < result.explosions.length; i++)
      expect(
        result.explosions[i].time - result.explosions[i - 1].time,
      ).toBeGreaterThanOrEqual(12);
    expect(result.elapsed).toBeGreaterThanOrEqual(500);
    expect(result.elapsed).toBeLessThan(1000);
  });

for (const size of [
  { width: 390, height: 844 },
  { width: 360, height: 800 },
  { width: 412, height: 915 },
])
  test(`raised hero and all five ultimate presentations remain readable at ${size.width}x${size.height}`, async ({
    page,
  }) => {
    const errors = [],
      warnings = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    page.on("console", (msg) => {
      if (msg.type() === "warning") warnings.push(msg.text());
    });
    await page.setViewportSize(size);
    await setup(page);
    await expect(page.locator(".speed")).toHaveCount(1);
    expect(
      await page.evaluate(() => window.__battle.state.autoBattleEnabled),
    ).toBe(false);
    const ids = await page.evaluate(() =>
      window.__battle.state.heroes.map((h) => h.id),
    );
    await page.evaluate(async () => {
      const { state, view, vfx } = window.__battle;
      const { heroAttack } = await import("/src/core/battle/engine.js");
      state.phase = "resolving";
      view.dismissMessage();
      window.__normalDone = false;
      vfx
        .attack(heroAttack(state, { element: "FIRE", count: 3 }), () =>
          view.render(state),
        )
        .then(() => {
          state.phase = "idle";
          window.__normalDone = true;
        });
    });
    await page.waitForFunction(() => {
      const card = document.querySelector(".hero-acting");
      return card && new DOMMatrix(getComputedStyle(card).transform).m42 <= -27;
    });
    const rise = await page.evaluate(() => {
      const card = document
          .querySelector(".hero-acting")
          .getBoundingClientRect(),
        board = document.querySelector(".board").getBoundingClientRect();
      const overlap = [...document.querySelectorAll(".enemy")].map((el) => {
        const r = el.getBoundingClientRect();
        return (
          (Math.max(
            0,
            Math.min(card.right, r.right) - Math.max(card.left, r.left),
          ) *
            Math.max(
              0,
              Math.min(card.bottom, r.bottom) - Math.max(card.top, r.top),
            )) /
          (card.width * card.height)
        );
      });
      return {
        overlap,
        bottom: card.bottom,
        boardTop: board.top,
        left: card.left,
        right: card.right,
        scroll: document.documentElement.scrollHeight > innerHeight,
      };
    });
    expect(Math.max(...rise.overlap)).toBeLessThan(0.15);
    expect(rise.bottom).toBeLessThan(rise.boardTop);
    expect(rise.left).toBeGreaterThanOrEqual(0);
    expect(rise.right).toBeLessThan(size.width);
    expect(rise.scroll).toBe(false);
    await page.screenshot({
      path: `tests/artifacts/polish-hero-rise-${size.width}.png`,
    });
    await page.waitForFunction(() => window.__normalDone);
    for (const id of ids) {
      await page.evaluate((id) => {
        const { state, controller } = window.__battle;
        state.speed = 1;
        state.enemies.forEach((e) => (e.hp = e.maxHp = 100000));
        state.heroes.forEach((h) => {
          h.hp = h.stats.hp - 200;
          h.energy = h.id === id ? 100 : 0;
        });
        controller.render();
        window.__animations = [];
        window.__castDone = false;
        window.__castStart = performance.now();
        controller.useUltimate(id).then(() => {
          window.__castEnd = performance.now();
          window.__castDone = true;
        });
      }, id);
      await page.waitForFunction(
        () =>
          !!document.querySelector(".ultimate-art") &&
          document.querySelector(".ultimate-art").naturalWidth > 0,
      );
      await page.waitForTimeout(320);
      const layout = await page.evaluate(() => {
        const art = document.querySelector(".ultimate-art"),
          a = art.getBoundingClientRect(),
          enemy = document
            .querySelector(".ultimate-focus")
            .getBoundingClientRect(),
          board = document.querySelector(".board").getBoundingClientRect(),
          hud = document.querySelector(".top-hud").getBoundingClientRect(),
          card = document.querySelector(".ultimate-caster");
        return {
          type: art.dataset.assetType,
          src: art.src,
          left: a.left,
          right: a.right,
          top: a.top,
          bottom: a.bottom,
          boardTop: board.top,
          hudBottom: hud.bottom,
          enemyLeft: enemy.left,
          enemyRight: enemy.right,
          viewport: innerWidth,
          phase: window.__battle.state.phase,
          charged: card.classList.contains("charged"),
          gold: card.classList.contains("ultimate-caster"),
          title: document.querySelector(".ultimate-title strong").textContent,
        };
      });
      expect(layout.type).toBe("full_body");
      expect(layout.src).toContain("FULL_BODY");
      // WAAPI scale/translation can leave a few millionths of a CSS pixel at 0.
      expect(layout.left).toBeGreaterThanOrEqual(-0.1);
      expect(layout.right).toBeLessThan(layout.enemyLeft);
      expect(layout.enemyRight).toBeLessThanOrEqual(size.width);
      expect(layout.top).toBeGreaterThanOrEqual(layout.hudBottom);
      expect(layout.bottom).toBeLessThan(layout.boardTop);
      expect(layout.phase).toBe("ultimate");
      expect(layout.charged).toBe(true);
      expect(layout.gold).toBe(true);
      expect(layout.title.length).toBeGreaterThan(5);
      expect(
        await page.evaluate(() => window.__battle.controller.move(0, 1)),
      ).toBe(false);
      await page.screenshot({
        path: `tests/artifacts/polish-ultimate-${id}-${size.width}.png`,
      });
      if (size.width === 390) {
        await page.waitForFunction(() => {
          const node = document.querySelector(".ultimate-power");
          return (
            node &&
            node
              .getAnimations()
              .some((a) => a.currentTime >= 150 && a.currentTime < 450)
          );
        });
        await page.screenshot({
          path: `tests/artifacts/polish-ultimate-power-${id}.png`,
        });
      }
      await page.waitForFunction(() => window.__castDone);
      const outcome = await page.evaluate(() => ({
        elapsed: window.__castEnd - window.__castStart,
        power: window.__animations.some((a) =>
          a.className.startsWith("ultimate-power"),
        ),
        numbers: window.__animations.some((a) =>
          a.className.startsWith("floating-number"),
        ),
        auto: window.__battle.state.autoBattleEnabled,
        turn: window.__battle.state.turn,
      }));
      expect(outcome.power).toBe(true);
      expect(outcome.numbers).toBe(true);
      expect(outcome.elapsed).toBeGreaterThanOrEqual(1800);
      expect(outcome.elapsed).toBeLessThan(2800);
      expect(outcome.auto).toBe(false);
      expect(outcome.turn).toBe(0);
      await expect(page.locator(".ultimate-art")).toHaveCount(0);
      expect(
        await page.evaluate(
          (id) => window.__battle.state.heroes.find((h) => h.id === id).energy,
          id,
        ),
      ).toBe(0);
    }
    expect(
      warnings.some((w) => w.includes("HERO_004_SYLVA_FULL_BODY.png")),
    ).toBe(false);
    expect(errors).toEqual([]);
  });
