import { expect, test } from "@playwright/test";
import { adminUser, login, staffUser, visit } from "./helpers";

test.describe("authentication and navigation", () => {
  test("admin can access core routes", async ({ page }) => {
    await login(page, adminUser);

    const routes = [
      { path: "/dashboard", heading: "Dashboard" },
      { path: "/borrowers", heading: "Borrower Management" },
      { path: "/loans", heading: "Loan Management" },
      { path: "/repayments", heading: "Repayment Tracking" },
      { path: "/reports", heading: "Reports & Analytics" },
      { path: "/settings", heading: "Settings" },
      { path: "/branches", heading: "Branch Management" },
      { path: "/staff", heading: "Staff Administration" }
    ];

    for (const route of routes) {
      await visit(page, route.path);
      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
    }
  });

  test("staff gets redirected away from admin-only pages", async ({ page }) => {
    await login(page, staffUser);

    await visit(page, "/branches");
    await expect(page).toHaveURL(/\/dashboard$/);

    await visit(page, "/staff");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
