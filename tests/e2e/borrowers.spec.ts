import { expect, test } from "@playwright/test";
import { adminUser, login, staffUser, visit } from "./helpers";

test.describe("borrower management", () => {
  test("admin sees destructive borrower controls", async ({ page }) => {
    await login(page, adminUser);
    await visit(page, "/borrowers");

    await expect(page.getByRole("button", { name: "Reset client" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete client" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark reviewed" })).toBeVisible();
  });

  test("staff can view borrowers but does not see admin controls", async ({ page }) => {
    await login(page, staffUser);
    await visit(page, "/borrowers");

    await expect(page.getByRole("heading", { name: "Borrower Management" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset client" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delete client" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Mark reviewed" })).toHaveCount(0);
  });
});
