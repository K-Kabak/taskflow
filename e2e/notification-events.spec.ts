import { randomUUID } from "node:crypto";
import { expect, test, testDatabase } from "./fixtures";

test("przypisanie i komentarz tworzą pojedyncze powiadomienia właściwego odbiorcy", async ({ page }) => {
  const db = testDatabase();
  const taskId = `e2e_notification_${randomUUID()}`;
  const title = `Zadanie powiadomień ${taskId.slice(-8)}`;
  try {
    const unreadBefore = await db.notification.count({ where: { workspaceId: "seed_workspace_studio", userId: "seed_user_admin", readAt: null } });
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
    await panel.getByRole("button", { name: "Zamknij panel zadania" }).click();
    await page.getByRole("button", { name: "Wyloguj się" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel("E-mail").fill("marek@taskflow.demo");
    await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page.getByRole("link", { name: `Powiadomienia, nieprzeczytane: ${unreadBefore + 2}` })).toBeVisible();
    await page.getByRole("link", { name: `Powiadomienia, nieprzeczytane: ${unreadBefore + 2}` }).click();
    const list = page.getByRole("region", { name: "Lista powiadomień" });
    const ownEvents = list.getByRole("article").filter({ hasText: title });
    await expect(ownEvents).toHaveCount(2);
    await ownEvents.first().getByRole("button", { name: "Oznacz jako przeczytane" }).click();
    await expect(page.getByRole("link", { name: `Powiadomienia, nieprzeczytane: ${unreadBefore + 1}` })).toBeVisible();
    expect(await db.notification.count({ where: { taskId, userId: "seed_user_admin", readAt: null } })).toBe(1);
    await ownEvents.first().getByRole("link", { name: "Otwórz zadanie" }).click();
    await expect(page.getByRole("dialog", { name: "Szczegóły zadania" })).toBeVisible();
  } finally {
    await db.notification.deleteMany({ where: { taskId } });
    await db.task.deleteMany({ where: { id: taskId } });
    await db.$disconnect();
  }
});

test("lista i licznik nie ujawniają powiadomień innych odbiorców ani przestrzeni", async ({ page }) => {
  const db = testDatabase();
  const id = randomUUID();
  const workspaceId = `e2e_notification_workspace_${id}`;
  const ownMessage = `Własne powiadomienie ${id}`;
  const otherMessage = `Cudze powiadomienie ${id}`;
  try {
    await db.workspace.create({ data: { id: workspaceId, name: "Pusta przestrzeń testowa", ownerId: "seed_user_owner", members: { create: { userId: "seed_user_owner", role: "OWNER" } } } });
    await db.notification.createMany({ data: [
      { workspaceId: "seed_workspace_studio", userId: "seed_user_owner", type: "TASK_ASSIGNED", message: ownMessage, eventKey: `e2e:own:${id}` },
      { workspaceId: "seed_workspace_studio", userId: "seed_user_admin", type: "TASK_ASSIGNED", message: otherMessage, eventKey: `e2e:other:${id}` },
    ] });
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("anna@taskflow.demo");
    await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await page.goto(`/w/${workspaceId}/notifications`);
    await expect(page.getByText("Nie masz jeszcze powiadomień.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Powiadomienia, nieprzeczytane: 0" })).toBeVisible();
    await page.goto("/w/seed_workspace_studio/notifications");
    await expect(page.getByText(ownMessage)).toBeVisible();
    await expect(page.getByText(otherMessage)).toHaveCount(0);
  } finally {
    await db.notification.deleteMany({ where: { eventKey: { in: [`e2e:own:${id}`, `e2e:other:${id}`] } } });
    await db.workspace.deleteMany({ where: { id: workspaceId } });
    await db.$disconnect();
  }
});
