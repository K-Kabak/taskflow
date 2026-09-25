import { expect, test } from "./fixtures";

test("rejestracja tworzy przestrzeń, projekt i zadanie", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.test`;
  await page.goto("/register");
  await page.getByLabel("Imię").fill("Tester E2E");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Hasło", { exact: true }).fill("BezpieczneHaslo123!");
  await page.getByLabel("Powtórz hasło").fill("BezpieczneHaslo123!");
  await page.getByRole("button", { name: "Utwórz konto" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await page.getByRole("link", { name: "Nowy projekt" }).click();
  await page.getByPlaceholder("Nazwa projektu").fill("Projekt E2E");
  await page.getByPlaceholder("Krótki opis (opcjonalnie)").fill("Projekt utworzony przez test");
  await page.getByRole("button", { name: "Utwórz" }).click();
  await expect(page.getByRole("heading", { name: "Projekt E2E" })).toBeVisible();
  await page.getByText("Dodaj zadanie").first().click();
  await page.getByPlaceholder("Tytuł zadania").first().fill("Pierwsze zadanie E2E");
  await page.getByRole("button", { name: "Dodaj", exact: true }).click();
  await expect(page.getByText("Pierwsze zadanie E2E")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Pierwsze zadanie E2E")).toBeVisible();
});

test("obcy użytkownik nie może wejść do projektu Studio", async ({ page }) => {
  const email = `idor-${Date.now()}@example.test`;
  await page.goto("/register");
  await page.getByLabel("Imię").fill("Obcy Użytkownik");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Hasło", { exact: true }).fill("BezpieczneHaslo123!");
  await page.getByLabel("Powtórz hasło").fill("BezpieczneHaslo123!");
  await page.getByRole("button", { name: "Utwórz konto" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await page.goto("/w/seed_workspace_studio/projects/seed_project_redesign");
  await expect(page.getByRole("heading", { name: "Nie znaleziono strony" })).toBeVisible();
});

test("menu mobilne prowadzi do zespołu", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Scenariusz tylko dla projektu mobilnego");
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await page.getByRole("button", { name: "Otwórz menu" }).click();
  await page.getByRole("link", { name: "Zespół" }).click();
  await expect(page.getByRole("heading", { name: "Zespół" })).toBeVisible();
});
