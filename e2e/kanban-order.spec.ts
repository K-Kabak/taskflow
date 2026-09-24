import { expect, test, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

async function dragBefore(page: Page, movingTitle: string, targetTitle: string) {
  const moving = page.getByText(movingTitle).locator("xpath=ancestor::article");
  const target = page.getByText(targetTitle).locator("xpath=ancestor::article");
  const from = await moving.getByRole("button", { name: /Przenieś zadanie/ }).boundingBox();
  const to = await target.boundingBox();
  expect(from).not.toBeNull();
  expect(to).not.toBeNull();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 12 });
  const saveResponse = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("seed_project_redesign"));
  await page.mouse.up();
  await saveResponse;
}

test("zmiana kolejności w kolumnie jest trwała", async ({ page }) => {
  await login(page);
  await page.goto("/w/seed_workspace_studio/projects/seed_project_redesign");
  await dragBefore(page, "Mapa nowej nawigacji", "Audyt obecnej strony");
  const todo = page.locator("section").filter({ has: page.getByRole("heading", { name: "Do zrobienia" }) }).first();
  await expect(todo.locator("article").first()).toContainText("Mapa nowej nawigacji");
  await page.reload();
  await expect(todo.locator("article").first()).toContainText("Mapa nowej nawigacji");
});

test("nie nadpisuje zmiany wykonanej w innej sesji", async ({ page, context }) => {
  await login(page);
  const otherPage = await context.newPage();
  const boardUrl = "/w/seed_workspace_studio/projects/seed_project_redesign";
  await otherPage.goto(boardUrl);
  await page.goto(`${boardUrl}?task=seed_task_01`);
  await page.getByRole("dialog").getByLabel("Status").selectOption("IN_PROGRESS");
  await page.getByRole("dialog").getByRole("button", { name: "Zapisz zmiany" }).click();
  await expect(page.getByRole("dialog").getByText("Zapisano zmiany.")).toBeVisible();

  await dragBefore(otherPage, "Mapa nowej nawigacji", "Treści strony głównej");
  await expect(otherPage.getByText(/Tablica zmieniła się w innej sesji/)).toBeVisible();
  await expect(otherPage.locator("section").filter({ has: otherPage.getByRole("heading", { name: "W trakcie" }) }).first().getByText("Audyt obecnej strony")).toBeVisible();
  await otherPage.close();
});
