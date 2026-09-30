import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import type { Page } from "@playwright/test";
import { expect, test, testDatabase } from "./fixtures";

const outputDir = "docs/screenshots/v1.2";
const projectUrl = "/w/seed_workspace_studio/projects/seed_project_redesign";

async function capture(page: Page, name: string) {
  await page.screenshot({ path: `${outputDir}/${name}.png`, fullPage: true, animations: "disabled", caret: "initial" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `${name}: poziomy overflow dokumentu`).toBeLessThanOrEqual(1);
}

test("reprezentatywne rzeczywiste widoki Light i Dark", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium" || process.env.CAPTURE_V1_2_SCREENSHOTS !== "1", "Zrzuty wykonuje się świadomie na izolowanej bazie.");
  test.setTimeout(180_000);
  await mkdir(outputDir, { recursive: true });
  const db = testDatabase();
  const eventKey = `e2e_visual_theme_${randomUUID()}`;
  try {
    await db.notification.create({ data: { eventKey, workspaceId: "seed_workspace_studio", userId: "seed_user_owner", type: "TASK_ASSIGNED", taskId: "seed_task_01", projectId: "seed_project_redesign", message: "Przypisano Ci zadanie do przeglądu motywu." } });
    for (const mode of ["light", "dark"] as const) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/login");
      await page.getByRole("button", { name: "Zmień motyw" }).click();
      await page.getByRole("radio", { name: mode === "light" ? "Jasny" : "Ciemny" }).click();
      await page.goto("/");
      await expect(page.getByRole("heading", { name: /Projekty płyną lepiej/ })).toBeVisible();
      await capture(page, `${mode}-landing`);
      await page.goto("/login");
      await capture(page, `${mode}-login`);
      await page.goto("/register");
      await capture(page, `${mode}-register`);
      await page.goto("/login");
      await page.getByLabel("E-mail").fill("anna@taskflow.demo");
      await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
      await page.getByRole("button", { name: "Zaloguj się" }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
      await capture(page, `${mode}-dashboard`);
      await page.goto(projectUrl);
      await expect(page.getByRole("heading", { name: "Przebudowa strony internetowej" })).toBeVisible();
      await capture(page, `${mode}-kanban`);
      await page.goto(`${projectUrl}?task=seed_task_01`);
      await expect(page.getByRole("dialog", { name: "Szczegóły zadania" })).toBeVisible();
      await capture(page, `${mode}-task-panel`);
      await page.goto("/w/seed_workspace_studio/notifications");
      await expect(page.getByText("Przypisano Ci zadanie do przeglądu motywu.")).toBeVisible();
      await capture(page, `${mode}-notifications`);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/w/seed_workspace_studio/dashboard");
      await capture(page, `${mode}-mobile-dashboard`);
      await page.goto(projectUrl);
      await expect(page.getByRole("heading", { name: "Przebudowa strony internetowej" })).toBeVisible();
      await page.getByRole("heading", { name: "Do zrobienia" }).scrollIntoViewIfNeeded();
      await capture(page, `${mode}-mobile-kanban`);
      await page.getByRole("button", { name: "Wyloguj się" }).click();
      await expect(page).toHaveURL(/\/login/);
    }
  } finally {
    await db.notification.deleteMany({ where: { eventKey } });
    await db.$disconnect();
  }
});
