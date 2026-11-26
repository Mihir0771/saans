import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("WCAG 2.2 AA Accessibility audits", () => {
  test("passes axe with zero serious/critical violations on Today, Plan, Lab, Ask, Community, Proof & /design", async ({
    page,
  }, testInfo) => {
    await page.goto("/?demo=sharma");
    const assertClean = async (label: string) => {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      const bad = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(bad, `Axe violations on ${label}: ${JSON.stringify(bad)}`).toEqual([]);
    };

    await assertClean("Welcome Tutorial modal");
    await page.getByRole("button", { name: /Close/i }).click();
    await assertClean("Today EN Light");
    await page.getByRole("button", { name: "हिं" }).click();
    await page.getByRole("button", { name: /Toggle theme/i }).click();
    await assertClean("Today HI Dark");

    await page.getByRole("button", { name: /योजना/ }).first().click();
    await assertClean("Plan HI Dark");

    await page
      .getByRole("button", { name: /होम लैब/ })
      .first()
      .click();
    await assertClean("Home Lab HI Dark");

    await page.getByRole("button", { name: /पूछें/ }).first().click();
    await assertClean("Ask HI Dark");

    if (testInfo.project.name === "mobile-360") {
      await page.getByRole("button", { name: "और" }).click();
    }
    await page.getByRole("button", { name: /समुदाय/ }).first().click();
    await assertClean("Community HI Dark");

    if (testInfo.project.name === "mobile-360") {
      await page.getByRole("button", { name: "और" }).click();
    }
    await page
      .getByRole("button", { name: /प्रमाण और तथ्य/ })
      .first()
      .click();
    await assertClean("Proof HI Dark");

    await page.goto("/design");
    await assertClean("/design showcase");
  });
});
