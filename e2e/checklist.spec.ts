import { expect, test, testDatabase } from "./fixtures";

const taskUrl = "/w/seed_workspace_studio/projects/seed_project_redesign?task=seed_task_01";

test.beforeEach(async () => {
  const db = testDatabase();
  try { await db.taskChecklistItem.deleteMany({ where: { taskId: "seed_task_01" } }); }
  finally { await db.$disconnect(); }
});

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

test("checklista zapisuje dodanie, edycję, ukończenie i usunięcie", async ({ page }) => {
  await login(page);
  await page.goto(taskUrl);
  const checklist = page.getByRole("region", { name: "Checklista" });
  await checklist.getByLabel("Nowa pozycja").fill("Sprawdzić treść");
  await checklist.getByRole("button", { name: "Dodaj", exact: true }).click();
  await expect(checklist).toContainText("0 z 1 ukończonych");
  await page.reload();
  await expect(checklist.locator("li > div > span").first()).toHaveText("Sprawdzić treść");
  await checklist.getByLabel("Edytuj: Sprawdzić treść").click();
  await checklist.getByLabel("Treść pozycji").fill("Sprawdzić tekst i kontrast");
  await checklist.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(checklist.locator("li > div > span").first()).toHaveText("Sprawdzić tekst i kontrast");
  await checklist.getByRole("button", { name: "Oznacz jako ukończone: Sprawdzić tekst i kontrast" }).click();
  await expect(checklist).toContainText("1 z 1 ukończonych");
  await page.reload();
  await expect(checklist).toContainText("1 z 1 ukończonych");
  await page.getByRole("button", { name: "Zamknij panel zadania" }).click();
  await expect(page.locator('a[href*="task=seed_task_01"]').locator("xpath=ancestor::article")).toContainText("1/1");
  await page.locator('a[href*="task=seed_task_01"]').click();
  page.once("dialog", (dialog) => dialog.accept());
  await checklist.getByRole("button", { name: "Usuń: Sprawdzić tekst i kontrast" }).click();
  await expect(checklist).toContainText("Brak pozycji checklisty.");
});

test("checklista odrzuca pustą pozycję i blokuje zapis po archiwizacji", async ({ page }) => {
  const db = testDatabase();
  try {
    await login(page);
    await page.goto(taskUrl);
    const checklist = page.getByRole("region", { name: "Checklista" });
    await checklist.getByRole("button", { name: "Dodaj", exact: true }).click();
    await expect(checklist.getByRole("alert")).toContainText("Pozycja checklisty");
    await db.project.update({ where: { id: "seed_project_redesign" }, data: { archivedAt: new Date() } });
    await checklist.getByLabel("Nowa pozycja").fill("Nie wolno zapisać");
    await checklist.getByRole("button", { name: "Dodaj", exact: true }).click();
    await expect(checklist.getByRole("alert")).toContainText("tylko do odczytu");
    expect(await db.taskChecklistItem.count({ where: { taskId: "seed_task_01" } })).toBe(0);
  } finally {
    await db.project.update({ where: { id: "seed_project_redesign" }, data: { archivedAt: null } });
    await db.$disconnect();
  }
});

test("obca przestrzeń nie ujawnia checklisty zadania", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Imię").fill("Obcy Tester");
  await page.getByLabel("E-mail").fill(`checklist-foreign-${Date.now()}@example.test`);
  await page.getByLabel("Hasło", { exact: true }).fill("BezpieczneHaslo123!");
  await page.getByLabel("Powtórz hasło").fill("BezpieczneHaslo123!");
  await page.getByRole("button", { name: "Utwórz konto" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await page.goto(taskUrl);
  await expect(page.getByRole("heading", { name: "Nie znaleziono strony" })).toBeVisible();
});
