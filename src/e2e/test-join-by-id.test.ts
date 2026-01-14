import { test, expect } from "@playwright/test";

test("should navigate to the about page", async ({ page }) => {
  // Start from the index page (the baseURL is set via the webServer in the playwright.config.ts)
  await page.goto("/join");
  await page.fill("input[data-testid='event-id-input']", "123456");
  await page.waitForLoadState("networkidle");
  await expect(page).not.toHaveURL("/join");
});
