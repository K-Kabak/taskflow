import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { expect, test, type Page } from "./fixtures";

function database() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Testy wymagają DATABASE_URL.");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

async function login(page: Page, email = "anna@taskflow.demo") {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Hasło", { exact: true }).fill("TaskFlowDemo123!");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

test("powtórzony identyfikator przypisania nie powoduje błędu zapisu", async ({ page }) => {
  await login(page);
  await page.goto("/w/seed_workspace_studio/projects/seed_project_redesign?task=seed_task_02");
  const panel = page.getByRole("dialog");
  const form = panel.locator("form").first();
  await form.evaluate((node) => {
    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = "assigneeIds";
    hidden.value = "seed_user_owner";
    node.appendChild(hidden);
  });
  await form.getByRole("button", { name: "Zapisz zmiany" }).click();
  await expect(panel.getByText("Zapisano zmiany.")).toBeVisible();
});

test("nie pozwala przypisać osoby i etykiety z innej przestrzeni", async ({ page }) => {
  const db = database();
  const id = randomUUID();
  const foreignUserId = `e2e_foreign_user_${id}`;
  const foreignWorkspaceId = `e2e_foreign_workspace_${id}`;
  const foreignLabelId = `e2e_foreign_label_${id}`;
  try {
    await db.user.create({ data: { id: foreignUserId, name: "Obca osoba", email: `foreign-${id}@example.test`, passwordHash: "test-only" } });
    await db.workspace.create({ data: { id: foreignWorkspaceId, name: "Obca przestrzeń", ownerId: foreignUserId, members: { create: { userId: foreignUserId, role: "OWNER" } }, labels: { create: { id: foreignLabelId, name: "Obca etykieta", color: "#112233" } } } });
    await login(page);
    await page.goto("/w/seed_workspace_studio/projects/seed_project_redesign?task=seed_task_02");
    const panel = page.getByRole("dialog");
    const form = panel.locator("form").first();
    await form.evaluate((node, values) => {
      for (const [name, value] of Object.entries(values)) {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = name;
        hidden.value = value;
        node.appendChild(hidden);
      }
    }, { assigneeIds: foreignUserId, labelIds: foreignLabelId });
    await form.getByRole("button", { name: "Zapisz zmiany" }).click();
    await expect(form.getByRole("alert")).toContainText("bieżącej przestrzeni");
    expect(await db.taskAssignee.count({ where: { taskId: "seed_task_02", userId: foreignUserId } })).toBe(0);
    expect(await db.taskLabel.count({ where: { taskId: "seed_task_02", labelId: foreignLabelId } })).toBe(0);
  } finally {
    await db.workspace.deleteMany({ where: { id: foreignWorkspaceId } });
    await db.user.deleteMany({ where: { id: foreignUserId } });
    await db.$disconnect();
  }
});

test("MEMBER nie widzi zarządzania projektami ani rolami", async ({ page }) => {
  await login(page, "ola@taskflow.demo");
  await page.goto("/w/seed_workspace_studio/projects");
  await expect(page.getByRole("heading", { name: "Projekty" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nowy projekt" })).toHaveCount(0);
  await page.goto("/w/seed_workspace_studio/team");
  await expect(page.getByRole("button", { name: "Generuj link" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Zmień" })).toHaveCount(0);
});

test("archiwizacja w innej sesji blokuje zapis już otwartego zadania", async ({ page }) => {
  const db = database();
  try {
    await login(page);
    await page.goto("/w/seed_workspace_studio/projects/seed_project_redesign?task=seed_task_02");
    const panel = page.getByRole("dialog");
    const title = panel.getByLabel("Tytuł");
    const previous = await title.inputValue();
    await title.fill("Zmiana po archiwizacji");
    await db.project.update({ where: { id: "seed_project_redesign" }, data: { archivedAt: new Date() } });
    await panel.getByRole("button", { name: "Zapisz zmiany" }).click();
    await expect(panel.getByText("Zarchiwizowany projekt jest tylko do odczytu.")).toBeVisible();
    expect((await db.task.findUniqueOrThrow({ where: { id: "seed_task_02" } })).title).toBe(previous);
  } finally {
    await db.project.update({ where: { id: "seed_project_redesign" }, data: { archivedAt: null } });
    await db.$disconnect();
  }
});

test("archiwizacja w innej sesji blokuje zapis już otwartego projektu", async ({ page }) => {
  const db = database();
  try {
    await login(page);
    await page.goto("/w/seed_workspace_studio/projects/seed_project_redesign");
    const editor = page.getByText("Edytuj projekt");
    await editor.click();
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Zapisz", exact: true }) });
    const previous = await form.locator('input[name="name"]').inputValue();
    await form.locator('input[name="name"]').fill("Projekt po archiwizacji");
    await db.project.update({ where: { id: "seed_project_redesign" }, data: { archivedAt: new Date() } });
    await form.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect(form.getByRole("alert")).toContainText("Zarchiwizowany projekt jest tylko do odczytu.");
    expect((await db.project.findUniqueOrThrow({ where: { id: "seed_project_redesign" } })).name).toBe(previous);
  } finally {
    await db.project.update({ where: { id: "seed_project_redesign" }, data: { archivedAt: null } });
    await db.$disconnect();
  }
});

test("wyszukiwanie nie ujawnia danych obcej przestrzeni", async ({ page }) => {
  const email = `foreign-search-${randomUUID()}@example.test`;
  await page.goto("/register");
  await page.getByLabel("Imię").fill("Obca osoba");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Hasło", { exact: true }).fill("BezpieczneHaslo123!");
  await page.getByLabel("Powtórz hasło").fill("BezpieczneHaslo123!");
  await page.getByRole("button", { name: "Utwórz konto" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  const response = await page.request.get("/api/w/seed_workspace_studio/search?q=Mapa");
  expect(response.status()).toBe(404);
  expect(await response.text()).not.toContain("Mapa nowej nawigacji");
});

test("wygasłe zaproszenie nie pozwala dołączyć", async ({ page }) => {
  const db = database();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invite = await db.workspaceInvite.create({ data: { workspaceId: "seed_workspace_studio", createdById: "seed_user_owner", tokenHash, expiresAt: new Date(Date.now() - 60_000) } });
  try {
    await page.goto(`/invite/${token}`);
    await expect(page.getByText(/link wygasł, został wykorzystany/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Akceptuj zaproszenie" })).toHaveCount(0);
  } finally {
    await db.workspaceInvite.delete({ where: { id: invite.id } });
    await db.$disconnect();
  }
});
