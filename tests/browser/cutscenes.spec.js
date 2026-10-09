import { test, expect } from "@playwright/test";

test.describe("Chapter I cinematic previews", () => {
  test("intro presents dialogue, can replay, and transitions into real Stage 1-1", async ({ page }) => {
    await page.goto("/?cutscene=intro");
    await expect(page.locator('.story-screen[aria-label="Cutscene CH1_INTRO"]')).toBeVisible();
    await expect(page.locator(".story-dialogue")).toContainText("Đừng");
    await page.getByRole("button", { name: /tự động/i }).click();
    await page.locator(".story-caption").click();
    await expect(page.locator(".story-dialogue")).toContainText("Đây là");
    await page.getByRole("button", { name: /phát lại/i }).click();
    await expect(page.locator(".story-dialogue")).toContainText("Đừng");
    await page.getByRole("button", { name: /bỏ qua/i }).click();
    await expect(page.getByRole("main", { name: "Triệu hồi tân thủ" })).toBeVisible();
    await page.getByRole("button", { name: /triệu hồi 5 hero/i }).click();
    await expect(page.locator(".starter-card.revealed")).toHaveCount(5);
    await page.getByRole("button", { name: /vào trận 1-1/i }).click();
    await expect(page.getByRole("grid", { name: "Match three board" })).toBeVisible();
    await expect(page.locator(".story-screen")).toHaveCount(0);
  });

  test("ending preview displays reveal and replayable reward without changing stage progress", async ({ page }) => {
    await page.goto("/?cutscene=ending");
    await expect(page.locator('.story-screen[aria-label="Cutscene CH1_ENDING"]')).toBeVisible();
    await page.getByRole("button", { name: /bỏ qua/i }).click();
    await expect(page.getByText("CHAPTER I COMPLETE")).toBeVisible();
    await expect(page.getByText("GIỚI TINH · 1 / 8")).toBeVisible();
    await expect(page.getByText(/Chưa mở trong bản game hiện tại/)).toBeVisible();
    await page.getByRole("button", { name: /xem lại cutscene/i }).click();
    await expect(page.locator(".story-dialogue")).toContainText("Ta...");
    await page.getByRole("button", { name: /bỏ qua/i }).click();
    await page.getByRole("button", { name: /trở về màn 1-1/i }).click();
    await expect(page.getByRole("grid", { name: "Match three board" })).toBeVisible();
  });
});

test("standalone starter summon preview grants fixed R/SR team", async ({ page }) => {
  await page.goto("/?summon=starter");
  await expect(page.locator(".starter-card")).toHaveCount(5);
  await page.getByRole("button", {name:/triệu hồi 5 hero/i}).click();
  await expect(page.locator(".starter-card.revealed")).toHaveCount(5);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("nine-realms:starter-roster:v1")));
  expect(saved.heroIds).toEqual([
    "HERO_003_ROWAN","HERO_006_EMBER","HERO_007_TIKO","HERO_004_SYLVA","HERO_005_PIP"
  ]);
  await page.getByRole("button", {name:/vào trận 1-1/i}).click();
  await expect(page.getByRole("grid", { name: "Match three board" })).toBeVisible();
});
