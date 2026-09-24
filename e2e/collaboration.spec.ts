import { expect, test } from "@playwright/test";

async function loginDemo(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

test("jednorazowe zaproszenie pozwala dołączyć nowemu użytkownikowi", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Cykl zaproszenia jest wykonywany raz");
  await loginDemo(page);
  await page.goto("/w/seed_workspace_studio/team");
  await page.getByRole("button", { name: "Generuj link" }).click();
  const url = await page.locator("input[readonly]").inputValue();
  await page.getByRole("button", { name: "Wyloguj się" }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  await page.goto(url);
  await page.getByRole("link", { name: "Utwórz konto" }).click();
  const email = `invite-${Date.now()}@example.test`;
  await page.getByLabel("Imię").fill("Gość Testowy");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Hasło", { exact: true }).fill("BezpieczneHaslo123!");
  await page.getByLabel("Powtórz hasło").fill("BezpieczneHaslo123!");
  await page.getByRole("button", { name: "Utwórz konto" }).click();
  await expect(page.getByRole("button", { name: "Akceptuj zaproszenie" })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Akceptuj zaproszenie" }).click();
  await expect(page).toHaveURL(/\/w\/seed_workspace_studio\/dashboard/, { timeout: 20_000 });
  await page.goto(url);
  await expect(page.getByText(/link wygasł, został wykorzystany/)).toBeVisible();
});

test("przeciągnięcie karty zapisuje nowy status", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "DnD jest wykonywane raz");
  await loginDemo(page);
  await page.goto("/w/seed_workspace_studio/projects/seed_project_redesign");
  const card = page.getByText("Audyt obecnej strony").locator("xpath=ancestor::article");
  const handle = card.getByRole("button", { name: /Przenieś zadanie/ });
  const target = page.locator("section").filter({ has: page.getByRole("heading", { name: "W trakcie" }) }).first();
  const from = await handle.boundingBox(); const to = await target.boundingBox();
  expect(from).not.toBeNull(); expect(to).not.toBeNull();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + 140, { steps: 12 });
  const saveResponse = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("seed_project_redesign"));
  await page.mouse.up();
  await expect(target.getByText("Audyt obecnej strony")).toBeVisible({ timeout: 10_000 });
  await saveResponse;
  await page.reload();
  await expect(page.locator("section").filter({ has: page.getByRole("heading", { name: "W trakcie" }) }).first().getByText("Audyt obecnej strony")).toBeVisible();
  await page.getByText("Audyt obecnej strony").click();
  await page.getByLabel("Status").selectOption("TODO");
  const resetResponse = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("seed_project_redesign"));
  await page.getByRole("button", { name: "Zapisz zmiany" }).click();
  await resetResponse;
  await expect(page.getByLabel("Status")).toHaveValue("TODO");
});
