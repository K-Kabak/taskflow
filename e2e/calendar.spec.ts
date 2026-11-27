import { expect, test } from "./fixtures";

test("lista, kalendarz i wyszukiwanie działają także przy błędnym parametrze miesiąca", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  await page.goto("/w/seed_workspace_studio/projects/seed_project_redesign?view=list&q=Mapa");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toContainText("Mapa");

  const search = await page.request.get("/api/w/seed_workspace_studio/search?q=Mapa");
  expect(search.status()).toBe(200);
  const { tasks } = (await search.json()) as { tasks: { id: string; title: string }[] };
  const task = tasks.find((item) => item.id === "seed_task_02");
  expect(task?.title).toContain("Mapa");

  const workspaceSearch = page.getByRole("search");
  const searchInput = workspaceSearch.getByRole("textbox", { name: "Szukaj projektów i zadań" });
  await searchInput.fill("Mapa");
  const result = workspaceSearch.getByRole("link", { name: task!.title });
  await expect(result).toBeVisible();
  await searchInput.press("Escape");
  await expect(result).toHaveCount(0);
  await expect(searchInput).toBeFocused();
  await searchInput.fill(task!.title);
  await result.click();
  await expect(page.getByRole("dialog", { name: "Szczegóły zadania" })).toBeVisible();

  await page.goto("/w/seed_workspace_studio/calendar?month=2026-99");
  await expect(page.getByRole("heading", { name: "Kalendarz" })).toBeVisible();
  const month = page.getByRole("region", { name: "Widok miesiąca" });
  const dateWithTasks = month.getByRole("link", { name: /Liczba zadań: [1-9]/ }).first();
  if (!(await dateWithTasks.count())) await month.getByRole("link", { name: "Następny miesiąc" }).click();
  await dateWithTasks.click();
  await expect(dateWithTasks).toHaveAttribute("aria-current", "date");
  await expect(page.getByRole("heading", { name: /^Zadania:/ })).toBeVisible();
  expect(errors).toEqual([]);
});
