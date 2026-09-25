import { expect, test } from "./fixtures";

test("panel zadania zachowuje widok listy i obsługuje klawiaturę", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await page.goto("/w/seed_workspace_studio/projects/seed_project_redesign?view=list&status=TODO");
  const taskLink = page.locator('a[href*="task="]:visible').first();
  await taskLink.click();
  const dialog = page.getByRole("dialog", { name: "Szczegóły zadania" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Zamknij panel zadania" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.locator(":focus")).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Zamknij panel zadania" })).toBeFocused();
  await expect(page).toHaveURL(/view=list.*status=TODO/);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/view=list.*status=TODO/);
  await expect(taskLink).toBeFocused();
});
