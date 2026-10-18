import { test, expect } from "@playwright/test";

test("VFX Studio previews, saves and exports without touching Battle state", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/dev/vfx-studio");
  await expect(page.getByRole("heading", { name: "Auto VFX Studio" })).toBeVisible();
  await expect(page.locator("[data-role='catalog'] button")).toHaveCount(9);

  await page.locator("[data-role='duration']").evaluate(el => { el.value = "3000"; el.dispatchEvent(new Event("input",{bubbles:true})); });
  await page.locator("[data-role='scale']").evaluate(el => { el.value = "1.5"; el.dispatchEvent(new Event("input",{bubbles:true})); });
  await page.locator("[data-role='element']").selectOption("WOOD");
  await page.locator("[data-role='play']").click();
  await expect(page.locator(".vfx-studio__stage .auto-vfx")).toHaveCount(1);
  await expect(page.locator(".vfx-studio__stage .auto-vfx")).toHaveCSS("--vfx-color", "#70e890");

  await page.locator("[data-role='save']").click();
  const result = await page.evaluate(() => ({
    data: localStorage.getItem("nine-realms-vfx-studio-v1"),
  }));
  expect(JSON.parse(result.data).BASIC_TANK_SHIELD_BASH.scale).toBe(1.5);

  await page.locator('[data-mapping="WARRIOR"]').selectOption("HIT_IMPACT");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("[data-role='export']").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("nine-realms-vfx-config.json");

  await page.goto("/");
  await expect(page.locator(".hero-card")).toHaveCount(5);
  const mapping = await page.evaluate(async () => {
    const { getClassBasicVfx } = await import("/src/core/vfx/autoVfxLibrary.js");
    return getClassBasicVfx({ role: "WARRIOR" });
  });
  expect(mapping).toBe("HIT_IMPACT");
  expect(errors).toEqual([]);
});
