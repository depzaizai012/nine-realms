import { test, expect } from "@playwright/test";

test("all elemental lines use one unrotated charged image at mobile sizes", async ({
  page,
}) => {
  const failures = [];
  page.on("requestfailed", (request) => failures.push(request.url()));
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(response.url());
  });
  for (const width of [360, 390, 412]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.evaluate(async () => {
      const { state, view } = window.__battle;
      const { ELEMENTS } = await import("/src/data/elements/index.js");
      ELEMENTS.forEach((element, e) => {
        ["LINE_HORIZONTAL", "LINE_VERTICAL"].forEach((specialType, axis) => {
          Object.assign(state.board[e * 2 + axis], {
            element,
            specialType,
            hazardType: null,
          });
        });
      });
      view.board.render(state.board);
    });
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".gem .base")].every(
        (img) => img.complete && img.naturalWidth > 0,
      ),
    );
    const rendered = await page.evaluate(() =>
      [...document.querySelectorAll(".gem")].slice(0, 12).map((cell) => {
        const base = cell.querySelector(".base"),
          rect = base.getBoundingClientRect(),
          cellRect = cell.getBoundingClientRect();
        return {
          src: new URL(base.src).pathname,
          width: base.naturalWidth,
          specialHidden: cell.querySelector(".special").hidden,
          rotation: getComputedStyle(base).rotate,
          animation: getComputedStyle(base).animationName,
          overlay: getComputedStyle(cell, "::after").content,
          fits:
            rect.width <= cellRect.width * 1.05 &&
            rect.height <= cellRect.height * 1.05,
        };
      }),
    );
    for (const [e, element] of [
      "WOOD",
      "FIRE",
      "WATER",
      "EARTH",
      "LIGHT",
      "DARK",
    ].entries()) {
      for (const [axis, direction] of ["H", "V"].entries()) {
        const gem = rendered[e * 2 + axis];
        expect(gem.src).toBe(
          `/assets/gems/GEM_${element}_LINE_${direction}.png`,
        );
        expect(gem.width).toBe(1254);
        expect(gem.specialHidden).toBe(true);
        expect(["none", "0deg"]).toContain(gem.rotation);
        expect(gem.animation).toBe("line-charged");
        expect(["none", "normal"]).toContain(gem.overlay);
        expect(gem.fits).toBe(true);
      }
    }
    await page.screenshot({
      path: `tests/artifacts/elemental-lines-${width}.png`,
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await page
        .locator('.gem[data-special="LINE_HORIZONTAL"] .base')
        .first()
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("none");
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  expect(failures).toEqual([]);
});
