import { expect, test } from "@playwright/test";

test.describe("Saans E2E user journeys", () => {
  test("navigates Today -> Plan toggle -> Home Lab -> Ask -> Community -> Proof with zero console errors", async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/?demo=sharma");
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page.getByLabel(/Do not show this again/i).check();
    await page.getByRole("button", { name: /Next/i }).click();
    await page.getByRole("button", { name: /Close/i }).click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/WHO/i);

    // Check zero horizontal overflow against visual viewport (360 on mobile, 1280 on desktop)
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        (window.visualViewport?.width ?? window.innerWidth) + 1,
    );
    expect(overflow).toBe(false);

    // Switch member to Dadi
    await page.getByRole("button", { name: /Dadi/i }).click();
    await expect(page.locator("#gaugeDesc")).toContainText("Dadi");

    // Click an hour bar on the interactive 24h chart and verify live inspector updates
    await page.locator("svg[aria-labelledby='stripTitle stripDesc'] rect").nth(14).click();
    await expect(page.locator("#next24-heading").locator("..")).toContainText("14:00");

    // Open and close "Show the math" modal
    await page
      .getByRole("button", { name: /Show the math/i })
      .first()
      .click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page.getByRole("button", { name: /Close/i }).click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);

    // Save reference screenshot on mobile project
    if (testInfo.project.name === "mobile-360") {
      await page.screenshot({ path: "docs/build-journal/e2e-today-mobile.png" });
    }

    // Plan tab + waterfall toggle recompute
    await page
      .getByRole("button", { name: /^Plan$/i })
      .first()
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Dose across the day/i);
    const firstSwitch = page.getByRole("switch").first();
    const beforeState = await firstSwitch.getAttribute("aria-checked");
    await firstSwitch.click();
    const afterState = await firstSwitch.getAttribute("aria-checked");
    expect(afterState).not.toBe(beforeState);

    // Home Lab tab
    await page
      .getByRole("button", { name: /Home Lab/i })
      .first()
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Home Air Lab/i);

    // Ask Saans tab
    await page.getByRole("button", { name: /^Ask$/i }).first().click();
    await page.getByRole("button", { name: /Is a purifier worth it/i }).click();
    await expect(page.locator("[aria-live='polite']")).toContainText(/PM2\.5|verified|Offline/i);

    // Switch to Hindi + Dark mode and verify zero overflow
    await page.getByRole("button", { name: "हिं" }).click();
    await page.getByRole("button", { name: /Toggle theme/i }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/पूछें/);
    const hiOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        (window.visualViewport?.width ?? window.innerWidth) + 1,
    );
    expect(hiOverflow).toBe(false);

    if (testInfo.project.name === "desktop-1280") {
      await page.screenshot({ path: "docs/build-journal/e2e-ask-hi-dark.png" });
    }

    // Community + Proof tabs
    if (testInfo.project.name === "mobile-360") {
      await page.getByRole("button", { name: "और" }).click();
    }
    await page.getByRole("button", { name: /समुदाय/ }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/स्कूल|कार्यालय|समुदाय/);

    if (testInfo.project.name === "mobile-360") {
      await page.getByRole("button", { name: "और" }).click();
    }
    await page
      .getByRole("button", { name: /प्रमाण और तथ्य/ })
      .first()
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/गणना|मिथक|प्रमाण/);

    expect(errors).toEqual([]);
  });
});
