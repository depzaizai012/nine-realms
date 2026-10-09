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
