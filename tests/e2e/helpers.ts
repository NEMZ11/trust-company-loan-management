import { expect, Page } from "@playwright/test";

export const adminUser = {
  email: process.env.E2E_ADMIN_EMAIL || "admin@trustcompany.local",
  password: process.env.E2E_ADMIN_PASSWORD || "admin123"
};

export const staffUser = {
  email: process.env.E2E_STAFF_EMAIL || "williams@trustcompany.local",
  password: process.env.E2E_STAFF_PASSWORD || "williams123"
};

export async function login(page: Page, credentials: { email: string; password: string }) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15000 });
}

export async function visit(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
}
