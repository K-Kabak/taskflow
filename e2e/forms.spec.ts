import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
});

test("odrzuca niepoprawną nazwę projektu z widocznym błędem", async ({ page }) => {
  await page.goto("/w/seed_workspace_studio/projects");
  const form = page.locator("form").filter({ has: page.getByRole("heading", { name: "Nowy projekt" }) });
  await form.getByPlaceholder("Nazwa projektu").fill(" ");
  await form.getByRole("button", { name: "Utwórz" }).click();
  await expect(form.getByRole("alert")).toContainText("Nazwa projektu");
  await expect(page).toHaveURL(/\/projects$/);
});

test("odrzuca niepoprawny tytuł zadania bez zmiany danych", async ({ page }) => {
  await page.goto("/w/seed_workspace_studio/projects/seed_project_redesign?task=seed_task_02");
  const panel = page.getByRole("dialog");
  await panel.getByLabel("Tytuł").fill(" ");
  await panel.getByRole("button", { name: "Zapisz zmiany" }).click();
  await expect(panel.getByRole("alert")).toContainText("Tytuł zadania");
  await page.reload();
  await expect(panel.getByLabel("Tytuł")).toHaveValue("Mapa nowej nawigacji");
});
