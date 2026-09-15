import { test, expect } from "@playwright/test";
import { collectEvidence } from "../../src/adapters/playwright/collector.js";
test("product_bug: order API fails", async ({ page }, info) => {
  await page.goto("/");
  const capture = collectEvidence(page);
  try {
    await test.step("Place order", () =>
      page.getByRole("button", { name: "Place order" }).click());
    await expect(page.getByRole("status")).toHaveText("Order confirmed");
  } finally {
    await capture.finish(info);
  }
});
test("test_bug: stale button locator", async ({ page }, info) => {
  await page.goto("/");
  const capture = collectEvidence(page);
  try {
    await test.step("Verify checkout loaded", () =>
      expect(page.getByRole("heading")).toHaveText("Demo shop"));
    await test.step("Submit order", () =>
      page
        .getByRole("button", { name: "Submit order", exact: true })
        .click({ timeout: 700 }));
  } finally {
    await capture.finish(info);
  }
});
test("flaky_suspect: controlled timing recovery", async ({ page }, info) => {
  await page.goto("/");
  // A deterministic stand-in for delayed readiness: the first attempt never becomes ready.
  if (info.retry > 0)
    await page.getByRole("status").evaluate((el) => {
      el.textContent = "Ready for checkout";
    });
  await expect(page.getByRole("status")).toHaveText("Ready for checkout");
});
test("environment: dependency connection refused", async ({ page }, info) => {
  await page.goto("/");
  const capture = collectEvidence(page);
  try {
    await page.route("**/dependency", (route) =>
      route.abort("connectionrefused"),
    );
    await page.evaluate(async () => {
      await fetch("/dependency");
    });
  } finally {
    await capture.finish(info);
  }
});
test("unknown: assertion without context", async () => {
  expect(1).toBe(2);
});
