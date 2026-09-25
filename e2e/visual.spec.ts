import { expect, test } from "./fixtures";
import { mkdir } from "node:fs/promises";

test("zapisuje rzeczywisty screenshot tablicy", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Screenshot desktopowy tylko raz");
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await page.goto("/w/seed_workspace_studio/projects/seed_project_redesign");
  await expect(page.getByRole("heading", { name: "Przebudowa strony internetowej" })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 960 });
  await mkdir("docs/screenshots/stage-1", { recursive: true });
  await page.screenshot({ path: "docs/screenshots/stage-1/kanban-desktop.png", fullPage: true, caret: "initial" });
});
