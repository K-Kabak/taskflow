import { randomUUID } from "node:crypto";
import { expect, test, testDatabase } from "./fixtures";

test("przypisanie i komentarz tworzą pojedyncze powiadomienia właściwego odbiorcy", async ({ page }) => {
  const db = testDatabase();
  const taskId = `e2e_notification_${randomUUID()}`;
  const title = `Zadanie powiadomień ${taskId.slice(-8)}`;
  try {
    await db.task.create({ data: { id: taskId, projectId: "seed_project_redesign", title, status: "TODO", priority: "MEDIUM", position: 999100, createdById: "seed_user_owner" } });
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("anna@taskflow.demo");
    await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await page.goto(`/w/seed_workspace_studio/projects/seed_project_redesign?task=${taskId}`);
    const panel = page.getByRole("dialog", { name: "Szczegóły zadania" });
    await panel.getByLabel("Marek Nowak").check();
    await panel.getByRole("button", { name: "Zapisz zmiany" }).click();
    await expect(panel.getByText("Zapisano zmiany.")).toBeVisible();
    await expect.poll(() => db.notification.count({ where: { taskId, type: "TASK_ASSIGNED" } })).toBe(1);
    await panel.getByRole("button", { name: "Zapisz zmiany" }).click();
    await expect.poll(() => db.notification.count({ where: { taskId, type: "TASK_ASSIGNED" } })).toBe(1);
    const comments = panel.getByRole("heading", { name: /Komentarze/ }).locator("..");
    await comments.getByLabel("Dodaj komentarz").fill("Proszę o przegląd zadania");
    await comments.getByRole("button", { name: "Dodaj", exact: true }).click();
    await expect.poll(() => db.notification.count({ where: { taskId, type: "COMMENT_ADDED" } })).toBe(1);
    const notifications = await db.notification.findMany({ where: { taskId }, orderBy: { createdAt: "asc" } });
    expect(notifications.map((item) => item.userId)).toEqual(["seed_user_admin", "seed_user_admin"]);
    expect(new Set(notifications.map((item) => item.eventKey)).size).toBe(2);
    expect(await db.notification.count({ where: { taskId, userId: "seed_user_owner" } })).toBe(0);
  } finally {
    await db.task.deleteMany({ where: { id: taskId } });
    await db.$disconnect();
  }
});
