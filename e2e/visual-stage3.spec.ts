import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { expect, test, testDatabase } from "./fixtures";

test("rzeczywiste zrzuty czterech funkcji Etapu 3", async ({ page }) => {
  test.skip(process.env.CAPTURE_STAGE3_SCREENSHOTS !== "1", "Zrzuty wykonywane tylko podczas dokumentowania etapu.");
  const db = testDatabase();
  const taskId = `e2e_visual_stage3_${randomUUID()}`;
  const title = "Przegląd nowej strony produktu";
  const screenshotDir = "docs/screenshots/v1.1-stage3";
  try {
    await mkdir(screenshotDir, { recursive: true });
    await db.task.create({ data: { id: taskId, projectId: "seed_project_redesign", title, status: "TODO", priority: "URGENT", position: 999500, createdById: "seed_user_owner" } });
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("anna@taskflow.demo");
    await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await page.setViewportSize({ width: 1440, height: 1200 });
    await expect(page.getByRole("region", { name: "Postęp przestrzeni" })).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/dashboard-metrics.png`, fullPage: true, animations: "disabled", caret: "initial" });

    const projectUrl = "/w/seed_workspace_studio/projects/seed_project_redesign";
    await page.goto(projectUrl);
    await expect(page.getByRole("region", { name: "Postęp projektu" })).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/project-metrics.png`, fullPage: true, animations: "disabled", caret: "initial" });

    await page.goto(`${projectUrl}?task=${taskId}`);
    const panel = page.getByRole("dialog", { name: "Szczegóły zadania" });
    const checklist = panel.getByRole("region", { name: "Checklista" });
    await checklist.getByLabel("Nowa pozycja").fill("Zweryfikować treść i kontrast");
    await checklist.getByRole("button", { name: "Dodaj", exact: true }).click();
    await expect(checklist).toContainText("0 z 1 ukończonych");
    await page.screenshot({ path: `${screenshotDir}/task-checklist.png`, fullPage: true, animations: "disabled", caret: "initial" });

    await panel.getByLabel("Marek Nowak").check();
    await panel.getByRole("button", { name: "Zapisz zmiany" }).click();
    await expect(panel.getByText("Zapisano zmiany.")).toBeVisible();
    const comments = panel.getByRole("heading", { name: /Komentarze/ }).locator("..");
    await comments.getByLabel("Dodaj komentarz").fill("Proszę o sprawdzenie zmian.");
    await comments.getByRole("button", { name: "Dodaj", exact: true }).click();
    await expect.poll(() => db.notification.count({ where: { taskId } })).toBe(2);
    await panel.getByRole("button", { name: "Zamknij panel zadania" }).click();
    await page.goto(`${projectUrl}?view=board&bq=${encodeURIComponent(title)}`);
    await expect(page.getByRole("region", { name: "Filtry tablicy" })).toContainText("Widoczne zadania: 1 z");
    await page.screenshot({ path: `${screenshotDir}/kanban-filters.png`, fullPage: true, animations: "disabled", caret: "initial" });

    await page.getByRole("button", { name: "Wyloguj się" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel("E-mail").fill("marek@taskflow.demo");
    await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await page.goto("/w/seed_workspace_studio/notifications");
    await expect(page.getByRole("region", { name: "Lista powiadomień" }).getByRole("article").filter({ hasText: title })).toHaveCount(2);
    await page.screenshot({ path: `${screenshotDir}/notifications.png`, fullPage: true, animations: "disabled", caret: "initial" });
  } finally {
    await db.notification.deleteMany({ where: { taskId } });
    await db.task.deleteMany({ where: { id: taskId } });
    await db.$disconnect();
  }
});
