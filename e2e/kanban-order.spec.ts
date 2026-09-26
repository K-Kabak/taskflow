import type { Page } from "./fixtures";
import { expect, test, testDatabase } from "./fixtures";

test.beforeEach(async () => {
  const db = testDatabase();
  try {
    await db.$transaction([
      db.task.update({ where: { id: "seed_task_01" }, data: { status: "TODO", position: 1000 } }),
      db.task.update({ where: { id: "seed_task_02" }, data: { status: "TODO", position: 2000 } }),
      db.task.update({ where: { id: "seed_task_03" }, data: { status: "TODO", position: 3000 } }),
      db.task.update({ where: { id: "seed_task_04" }, data: { status: "TODO", position: 4000 } }),
    ]);
  } finally {
    await db.$disconnect();
  }
});

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

async function dragBefore(page: Page, movingId: string, targetId: string) {
  const moving = page.locator(`a[href*="task=${movingId}"]`).locator("xpath=ancestor::article");
  const target = page.locator(`a[href*="task=${targetId}"]`).locator("xpath=ancestor::article");
  const handle = moving.getByRole("button", { name: /Przenieś zadanie/ });
  await handle.scrollIntoViewIfNeeded();
  const from = await handle.boundingBox();
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
  await dragBefore(page, "seed_task_02", "seed_task_01");
  const todo = page.locator("section").filter({ has: page.getByRole("heading", { name: "Do zrobienia" }) }).first();
  await expect(todo.locator("article").first().locator('a[href*="task=seed_task_02"]')).toBeVisible();
  await page.reload();
  await expect(todo.locator("article").first().locator('a[href*="task=seed_task_02"]')).toBeVisible();
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

  await dragBefore(otherPage, "seed_task_02", "seed_task_03");
  await expect(otherPage.getByText(/Tablica zmieniła się w innej sesji/)).toBeVisible();
  await expect(otherPage.locator("section").filter({ has: otherPage.getByRole("heading", { name: "W trakcie" }) }).first().getByText("Audyt obecnej strony")).toBeVisible();
  await otherPage.close();
});
