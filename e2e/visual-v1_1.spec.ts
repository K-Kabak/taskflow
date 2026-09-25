import { mkdir } from "node:fs/promises";
import type { Page, TestInfo } from "@playwright/test";
import { expect, test } from "./fixtures";

const projectUrl = "/w/seed_workspace_studio/projects/seed_project_redesign";

async function capture(page: Page, testInfo: TestInfo, name: string) {
  const saveToRepo = process.env.CAPTURE_V1_1_SCREENSHOTS === "1";
  if (saveToRepo) await mkdir("docs/screenshots/v1.1", { recursive: true });
  await page.screenshot({ path: saveToRepo ? `docs/screenshots/v1.1/${name}` : testInfo.outputPath(name), fullPage: true, animations: "disabled", caret: "initial" });
}

async function expectNoPageOverflow(page: Page, label: string) {
  const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, main: document.querySelector("main")?.scrollWidth ?? 0, mainWidth: document.querySelector("main")?.clientWidth ?? 0 }));
  expect(dimensions.document, `${label}: dokument nie może wyjeżdżać poza ekran`).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.main, `${label}: tylko tablica może przewijać się w poziomie`).toBeLessThanOrEqual(dimensions.mainWidth + 1);
}

test("rzeczywiste widoki v1.1 mieszczą się na ekranach i zapisują screenshoty", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Jeden zestaw zrzutów wystarcza; mobilny układ jest sprawdzany przez zmianę viewportu.");
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  for (const width of [360, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expectNoPageOverflow(page, `dashboard ${width}px`);
  }
  await capture(page, testInfo, "dashboard-desktop.png");

  await page.goto(projectUrl);
  await expect(page.getByRole("heading", { name: "Przebudowa strony internetowej" })).toBeVisible();
  for (const width of [360, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expectNoPageOverflow(page, `Kanban ${width}px`);
    if (width === 390) await capture(page, testInfo, "kanban-mobile.png");
  }
  await capture(page, testInfo, "kanban-desktop.png");

  const taskLink = page.locator('a[href*="task="]:visible').first();
  await taskLink.click();
  const panel = page.getByRole("dialog", { name: "Szczegóły zadania" });
  await expect(panel).toBeVisible();
  for (const width of [360, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const panelWidth = await panel.evaluate((element) => ({ scroll: element.scrollWidth, client: element.clientWidth }));
    expect(panelWidth.scroll, `panel ${width}px bez poziomego overflow`).toBeLessThanOrEqual(panelWidth.client + 1);
  }
  await capture(page, testInfo, "task-panel.png");

  await page.goto("/register");
  await page.getByLabel("Imię").fill("Tester UI");
  await page.getByLabel("E-mail").fill(`ui-${Date.now()}@example.test`);
  await page.getByLabel("Hasło", { exact: true }).fill("BezpieczneHaslo123!");
  await page.getByLabel("Powtórz hasło").fill("BezpieczneHaslo123!");
  await page.getByRole("button", { name: "Utwórz konto" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await page.getByRole("link", { name: "Nowy projekt" }).click();
  await page.getByLabel("Nazwa projektu").fill("Pusty projekt testowy");
  await page.getByRole("button", { name: "Utwórz", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Pusty projekt testowy" })).toBeVisible();
  await expect(page.getByText("Brak zadań w tej kolumnie.")).toHaveCount(3);
  await page.setViewportSize({ width: 1280, height: 900 });
  await capture(page, testInfo, "empty-state.png");
});
