import { expect, test } from "@playwright/test";
import { adminUser, login, staffUser, visit } from "./helpers";

test.describe("settings", () => {
  test("admin sees account, security, and staff access settings", async ({ page }) => {
    await login(page, adminUser);
    await visit(page, "/settings");

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Phone")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Staff Access Control" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Reset Staff Password" })).toBeVisible();
  });

  test("staff sees personal settings but not admin controls", async ({ page }) => {
    await login(page, staffUser);
    await visit(page, "/settings");

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Phone")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Staff Access Control" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Reset Staff Password" })).toHaveCount(0);
  });
});
