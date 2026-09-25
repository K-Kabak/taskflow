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
  expect((await search.json()).tasks.some((task: { title: string }) => task.title.includes("Mapa"))).toBe(true);

  await page.goto("/w/seed_workspace_studio/calendar?month=2026-99");
  await expect(page.getByRole("heading", { name: "Kalendarz" })).toBeVisible();
  expect(errors).toEqual([]);
});
