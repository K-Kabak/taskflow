import { randomUUID } from "node:crypto";
import { expect, test, testDatabase } from "./fixtures";

test("statystyki są liczone tylko z bieżącej przestrzeni i obsługują zero danych", async ({ page }) => {
  const db = testDatabase();
  const id = randomUUID();
  const workspaceId = `e2e_metrics_workspace_${id}`;
  const projectId = `e2e_metrics_project_${id}`;
  try {
    await db.workspace.create({ data: { id: workspaceId, name: "Statystyki testowe", ownerId: "seed_user_owner", members: { create: { userId: "seed_user_owner", role: "OWNER" } }, projects: { create: { id: projectId, name: "Projekt metryk", createdById: "seed_user_owner" } } } });
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("anna@taskflow.demo");
    await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await page.goto(`/w/${workspaceId}/dashboard`);
    const dashboardStats = page.getByRole("region", { name: "Postęp przestrzeni" });
    await expect(dashboardStats).toContainText("Ukończone: 0 z 0 zadań");
    await expect(dashboardStats).toContainText("Brak zadań do podsumowania.");
    await db.task.createMany({ data: [
      { id: `e2e_metrics_todo_${id}`, projectId, title: "Termin minął", status: "TODO", priority: "MEDIUM", position: 1000, dueDate: new Date("2020-01-01T00:00:00.000Z"), createdById: "seed_user_owner" },
      { id: `e2e_metrics_done_${id}`, projectId, title: "Praca ukończona", status: "DONE", priority: "MEDIUM", position: 1000, dueDate: new Date("2020-01-01T00:00:00.000Z"), createdById: "seed_user_owner" },
    ] });
    await page.reload();
    await expect(dashboardStats).toContainText("Ukończone: 1 z 2 zadań");
    await expect(dashboardStats.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "50% ukończonych");
    await expect(dashboardStats).toContainText("Po terminie1");
    await page.goto(`/w/${workspaceId}/projects/${projectId}`);
    const projectStats = page.getByRole("region", { name: "Postęp projektu" });
    await expect(projectStats).toContainText("Ukończone: 1 z 2 zadań");
    await expect(projectStats).toContainText("Po terminie1");
  } finally {
    await db.workspace.deleteMany({ where: { id: workspaceId } });
    await db.$disconnect();
  }
});
