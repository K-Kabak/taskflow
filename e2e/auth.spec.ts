import { expect, test } from "./fixtures";

test("użytkownik demo może się zalogować i wylogować", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /Dzień dobry/ })).toBeVisible();
  await page.getByRole("button", { name: "Wyloguj się" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("landing jest responsywny", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); await expect(page.getByRole("link", { name: "Utwórz konto" }).first()).toBeVisible(); });
