import { randomUUID } from "node:crypto";
import { expect, test, testDatabase } from "./fixtures";

const projectUrl = "/w/seed_workspace_studio/projects/seed_project_redesign";

test("filtry Kanban trwają w URL i blokują DnD bez blokowania edycji statusu", async ({ page }) => {
  const db = testDatabase();
  const id = `e2e_filter_${randomUUID()}`;
  const title = `Zadanie filtra ${id.slice(-8)}`;
  try {
    await db.task.create({ data: { id, projectId: "seed_project_redesign", title, status: "TODO", priority: "URGENT", position: 999000, dueDate: new Date("2026-10-01T00:00:00.000Z"), createdById: "seed_user_owner", assignees: { create: { userId: "seed_user_owner" } }, labels: { create: { labelId: "seed_label_ui" } } } });
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("anna@taskflow.demo");
    await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

    const params = new URLSearchParams({ view: "board", bq: title, bpriority: "URGENT", bassignee: "seed_user_owner", blabel: "seed_label_ui", bfrom: "2026-09-30", bto: "2026-10-02" });
    await page.goto(`${projectUrl}?${params}`);
    const filters = page.getByRole("region", { name: "Filtry tablicy" });
    await expect(filters).toContainText("6 aktywnych");
    await expect(filters).toContainText("Widoczne zadania: 1 z");
    await expect(page.getByRole("article").filter({ hasText: title })).toBeVisible();
    await expect(page.getByRole("button", { name: new RegExp(`Przenieś zadanie ${title}`) })).toHaveCount(0);
    await page.reload();
    await expect(filters.getByLabel("Tekst")).toHaveValue(title);
    await expect(page.getByRole("article").filter({ hasText: title })).toBeVisible();

    await page.getByRole("link", { name: title }).click();
    const panel = page.getByRole("dialog", { name: "Szczegóły zadania" });
    await panel.getByLabel("Status").selectOption("IN_PROGRESS");
    await panel.getByRole("button", { name: "Zapisz zmiany" }).click();
    await expect(panel.getByText("Zapisano zmiany.")).toBeVisible();
    await panel.getByRole("button", { name: "Zamknij panel zadania" }).click();
    await expect(page).toHaveURL(/bq=Zadanie/);
    expect((await db.task.findUniqueOrThrow({ where: { id } })).status).toBe("IN_PROGRESS");

    await page.goto(`${projectUrl}?view=board&bq=nieistniejace-zadanie`);
    await expect(filters).toContainText("Żadne zadanie nie pasuje do filtrów.");
    await expect(page.getByText("Brak pasujących zadań.")).toHaveCount(3);
    await filters.getByRole("link", { name: "Wyczyść filtry" }).click();
    await expect(filters).toContainText(/Widoczne zadania: (\d+) z \1/);
  } finally {
    await db.task.deleteMany({ where: { id } });
    await db.$disconnect();
  }
});
