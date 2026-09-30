import { expect, test } from "./fixtures";

const theme = (page: import("@playwright/test").Page) => page.locator("html");
const background = (page: import("@playwright/test").Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test("preferencja Dark jest stosowana podczas ładowania dokumentu", async ({ page }) => {
  const response = await page.request.get("/login");
  const html = await response.text();
  expect(html.indexOf("taskflow-theme")).toBeGreaterThan(0);
  expect(html.indexOf("taskflow-theme")).toBeLessThan(html.indexOf("<body"));
  await page.addInitScript(() => localStorage.setItem("taskflow-theme", "dark"));
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(theme(page)).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe("dark");
});

test("Systemowy reaguje na ustawienie systemu, a ręczny wybór ma pierwszeństwo", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/login");
  await expect(theme(page)).toHaveAttribute("data-theme", "system");
  const light = await background(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect.poll(() => background(page)).not.toBe(light);
  const dark = await background(page);

  await page.getByRole("button", { name: "Zmień motyw" }).click();
  await page.getByRole("radio", { name: "Jasny" }).click();
  await expect(theme(page)).toHaveAttribute("data-theme", "light");
  expect(await background(page)).toBe(light);
  await page.reload();
  await expect(theme(page)).toHaveAttribute("data-theme", "light");
  expect(await background(page)).toBe(light);

  await page.getByRole("button", { name: "Zmień motyw" }).click();
  await page.getByRole("radio", { name: "Ciemny" }).click();
  await expect(theme(page)).toHaveAttribute("data-theme", "dark");
  expect(await background(page)).toBe(dark);
  await page.reload();
  expect(await background(page)).toBe(dark);

  await page.getByRole("button", { name: "Zmień motyw" }).click();
  await page.getByRole("radio", { name: "Systemowy" }).click();
  await expect(theme(page)).toHaveAttribute("data-theme", "system");
  expect(await background(page)).toBe(dark);
});

test("nieprawidłowy zapis wraca do Systemowego; panel obsługuje Escape, fokus i kliknięcie poza nim", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("taskflow-theme", "nieznany"));
  await page.goto("/register");
  await expect(theme(page)).toHaveAttribute("data-theme", "system");
  const button = page.getByRole("button", { name: "Zmień motyw" });
  await button.click();
  const dialog = page.getByRole("dialog", { name: "Wybierz motyw" });
  await expect(dialog.getByRole("radio", { name: "Systemowy" })).toBeChecked();
  await expect(dialog.getByRole("radio", { name: "Systemowy" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(button).toBeFocused();
  await button.click();
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await expect(dialog).toHaveCount(0);
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(dialog.getByRole("radio", { name: "Systemowy" })).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(theme(page)).toHaveAttribute("data-theme", "dark");
  await expect(button).toBeFocused();
});

test("motyw jest wspólny dla kart i trwa po logowaniu na kluczowych widokach", async ({ page, context }) => {
  await page.goto("/login");
  const other = await context.newPage();
  await other.goto("/login");
  await page.getByRole("button", { name: "Zmień motyw" }).click();
  await page.getByRole("radio", { name: "Ciemny" }).click();
  await expect(theme(other)).toHaveAttribute("data-theme", "dark");

  await page.getByLabel("E-mail").fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await expect(theme(page)).toHaveAttribute("data-theme", "dark");
  for (const path of ["dashboard", "projects/seed_project_redesign", "notifications"]) {
    await page.goto(`/w/seed_workspace_studio/${path}`);
    await expect(theme(page)).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("main").first()).toBeVisible();
  }
  await page.goto("/w/seed_workspace_studio/projects/seed_project_redesign?task=seed_task_01");
  await expect(page.getByRole("dialog", { name: "Szczegóły zadania" })).toBeVisible();
  await expect(theme(page)).toHaveAttribute("data-theme", "dark");
});

test("przełącznik i panel mieszczą się na telefonie", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Kontrola układu mobilnego.");
  await page.goto("/login");
  await page.getByRole("button", { name: "Zmień motyw" }).click();
  await expect(page.getByRole("dialog", { name: "Wybierz motyw" })).toBeInViewport();
  await page.getByRole("radio", { name: "Ciemny" }).click();
  await expect(theme(page)).toHaveAttribute("data-theme", "dark");
  const width = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(width).toBeLessThanOrEqual(1);
});

test("ciemny formularz zachowuje czytelny błąd, focus i hover", async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem("taskflow-theme", "dark"));
  await page.goto("/login");
  const email = page.getByLabel("E-mail");
  await email.focus();
  expect(await email.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
  const button = page.getByRole("button", { name: "Zaloguj się" });
  if (testInfo.project.name === "chromium") {
    const regular = await button.evaluate((element) => getComputedStyle(element).backgroundColor);
    await button.hover();
    await expect.poll(() => button.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(regular);
  }
  await email.fill("anna@taskflow.demo");
  await page.getByLabel("Hasło", { exact: true }).fill("NiepoprawneHaslo123!");
  await button.click();
  const alert = page.locator("form").getByRole("alert");
  await expect(alert).toContainText("Nieprawidłowy e-mail lub hasło.");
  const contrast = await alert.evaluate((element) => {
    const relative = (css: string) => {
      const rgb = css.match(/[\d.]+/g)!.slice(0, 3).map((part) => Number(part) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    };
    const style = getComputedStyle(element);
    const foreground = relative(style.color);
    const background = relative(style.backgroundColor);
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
});
