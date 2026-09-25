import { expect, test } from "./fixtures";

test("karta odświeża dane po edycji bez zmiany statusu", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  await page.goto("/w/seed_workspace_studio/projects/seed_project_redesign?task=seed_task_02");
  const panel = page.getByRole("dialog");
  await panel.getByLabel("Tytuł").fill("Mapa nawigacji po audycie");
  await panel.getByLabel("Termin").fill("2026-10-10");
  await panel.getByLabel("Priorytet").selectOption("HIGH");
  await panel.getByRole("button", { name: "Zapisz zmiany" }).click();
  await expect(panel.getByText("Zapisano zmiany.")).toBeVisible();
  await panel.getByRole("link", { name: "Zamknij", exact: true }).click();
  const card = page.getByRole("article").filter({ hasText: "Mapa nawigacji po audycie" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("Wysoki");
  await expect(card).toContainText("10 paź 2026");
});

test("nieudany zapis ruchu przywraca kartę i pokazuje błąd", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await page.goto("/w/seed_workspace_studio/projects/seed_project_redesign");

  await page.route("**/w/seed_workspace_studio/projects/seed_project_redesign", async (route) => {
    if (route.request().method() === "POST") await route.abort();
    else await route.continue();
  });

  const card = page.getByText("Treści strony głównej").locator("xpath=ancestor::article");
  const handle = card.getByRole("button", { name: /Przenieś zadanie/ });
  const target = page.locator("section").filter({ has: page.getByRole("heading", { name: "W trakcie" }) }).first();
  const from = await handle.boundingBox();
  const to = await target.boundingBox();
  expect(from).not.toBeNull();
  expect(to).not.toBeNull();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + 140, { steps: 12 });
  await page.mouse.up();

  await expect(page.getByText("Nie udało się zapisać kolejności. Przywrócono poprzedni układ.")).toBeVisible();
  await expect(page.locator("section").filter({ has: page.getByRole("heading", { name: "Do zrobienia" }) }).first().getByText("Treści strony głównej")).toBeVisible();
});
