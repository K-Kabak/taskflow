import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function pausePost(page: Page, pattern: string) {
  let release = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let requests = 0;
  await page.route(pattern, async (route) => {
    if (route.request().method() === "POST") {
      requests += 1;
      await gate;
    }
    await route.continue();
  });
  return { release, count: () => requests };
}

async function expectPending(page: Page, label: string, fieldNames: string[]) {
  const form = page.locator("form");
  const button = form.getByRole("button", { name: label });
  await expect(form).toHaveAttribute("aria-busy", "true");
  await expect(button).toBeDisabled();
  await expect(button.locator("svg.animate-spin")).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("status")).toHaveText("To może potrwać kilka sekund.");
  for (const name of fieldNames) await expect(form.getByLabel(name, { exact: true })).toBeDisabled();
  await form.evaluate((element: HTMLFormElement) => element.requestSubmit());
}

test("logowanie pokazuje stan oczekiwania i blokuje ponowne wysłanie", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
  const request = await pausePost(page, "**/api/auth/callback/credentials*");
  try {
    await page.getByLabel("Hasło", { exact: true }).press("Enter");
    await expectPending(page, "Logowanie…", ["E-mail", "Hasło"]);
    await expect.poll(request.count).toBe(1);
  } finally { request.release(); }
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
});

test("błąd logowania przywraca pola, przycisk i komunikat błędu", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("NiepoprawneHaslo123!");
  const request = await pausePost(page, "**/api/auth/callback/credentials*");
  try {
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expectPending(page, "Logowanie…", ["E-mail", "Hasło"]);
  } finally { request.release(); }
  await expect(page.locator("form").getByRole("alert")).toContainText("Nieprawidłowy e-mail lub hasło.");
  await expect(page.locator("form")).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("button", { name: "Zaloguj się" })).toBeEnabled();
  await expect(page.getByLabel("E-mail")).toBeEnabled();
  await expect(page.getByLabel("Hasło", { exact: true })).toBeEnabled();
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("rejestracja pokazuje stan oczekiwania, a potem otwiera dashboard", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Imię").fill("Test UX");
  await page.getByLabel("E-mail").fill(`auth-loading-${randomUUID()}@example.test`);
  await page.getByLabel("Hasło", { exact: true }).fill("TestoweHaslo123!");
  await page.getByLabel("Powtórz hasło").fill("TestoweHaslo123!");
  const request = await pausePost(page, "**/register*");
  try {
    await page.getByRole("button", { name: "Utwórz konto" }).click();
    await expectPending(page, "Tworzenie konta…", ["Imię", "E-mail", "Hasło", "Powtórz hasło"]);
    await expect.poll(request.count).toBe(1);
  } finally { request.release(); }
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
});

test("błąd rejestracji przywraca formularz i widoczny komunikat", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Imię").fill("Anna Test");
  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("TestoweHaslo123!");
  await page.getByLabel("Powtórz hasło").fill("TestoweHaslo123!");
  const request = await pausePost(page, "**/register*");
  try {
    await page.getByRole("button", { name: "Utwórz konto" }).click();
    await expectPending(page, "Tworzenie konta…", ["Imię", "E-mail", "Hasło", "Powtórz hasło"]);
  } finally { request.release(); }
  await expect(page.locator("form").getByRole("alert")).toContainText("Nie udało się utworzyć konta");
  await expect(page.locator("form")).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("button", { name: "Utwórz konto" })).toBeEnabled();
  for (const name of ["Imię", "E-mail", "Hasło", "Powtórz hasło"]) await expect(page.getByLabel(name, { exact: true })).toBeEnabled();
  await expect(page.getByRole("status")).toHaveCount(0);
});
