import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
import { PrismaClient } from "../src/generated/prisma/client";

if (process.env.NODE_ENV === "production") throw new Error("Seed demonstracyjny nie może działać w produkcji.");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Brak DATABASE_URL.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const users = [
  { id: "seed_user_owner", name: "Anna Kowalska", email: "anna@taskflow.demo", avatarColor: "#F97316" },
  { id: "seed_user_admin", name: "Marek Nowak", email: "marek@taskflow.demo", avatarColor: "#3B82F6" },
  { id: "seed_user_member", name: "Ola Wiśniewska", email: "ola@taskflow.demo", avatarColor: "#8B5CF6" },
];

const taskData = [
  ["Audyt obecnej strony", "TODO", "HIGH", 1000, 3], ["Mapa nowej nawigacji", "TODO", "MEDIUM", 2000, 7], ["Treści strony głównej", "TODO", "LOW", 3000, 12], ["Makiety desktopowe", "TODO", "URGENT", 4000, 5],
  ["System komponentów", "IN_PROGRESS", "HIGH", 1000, 4], ["Widok mobilny", "IN_PROGRESS", "MEDIUM", 2000, 8], ["Optymalizacja wydajności", "IN_PROGRESS", "HIGH", 3000, 10], ["Formularz kontaktowy", "IN_PROGRESS", "LOW", 4000, 14],
  ["Badania użytkowników", "DONE", "MEDIUM", 1000, -8], ["Analiza konkurencji", "DONE", "LOW", 2000, -5], ["Kierunek wizualny", "DONE", "HIGH", 3000, -2], ["Plan analityki", "DONE", "MEDIUM", 4000, -1],
] as const;

async function main() {
  const passwordHash = await hash("TaskFlowDemo123!", { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  for (const user of users) await db.user.upsert({ where: { id: user.id }, create: { ...user, passwordHash }, update: { name: user.name, email: user.email, passwordHash, avatarColor: user.avatarColor } });
  await db.workspace.upsert({ where: { id: "seed_workspace_studio" }, create: { id: "seed_workspace_studio", name: "Studio", ownerId: users[0].id }, update: { name: "Studio", ownerId: users[0].id } });
  for (const [index, user] of users.entries()) await db.workspaceMember.upsert({ where: { workspaceId_userId: { workspaceId: "seed_workspace_studio", userId: user.id } }, create: { workspaceId: "seed_workspace_studio", userId: user.id, role: index === 0 ? "OWNER" : index === 1 ? "ADMIN" : "MEMBER" }, update: { role: index === 0 ? "OWNER" : index === 1 ? "ADMIN" : "MEMBER" } });
  await db.project.upsert({ where: { id: "seed_project_redesign" }, create: { id: "seed_project_redesign", workspaceId: "seed_workspace_studio", name: "Przebudowa strony internetowej", description: "Kompleksowa przebudowa serwisu firmowego — od badań do wdrożenia.", createdById: users[0].id }, update: { archivedAt: null, name: "Przebudowa strony internetowej", description: "Kompleksowa przebudowa serwisu firmowego — od badań do wdrożenia." } });
  const labels = [{ id: "seed_label_design", name: "Design", color: "#8B5CF6" }, { id: "seed_label_ui", name: "UI", color: "#3B82F6" }, { id: "seed_label_research", name: "Research", color: "#F97316" }, { id: "seed_label_dev", name: "Development", color: "#10B981" }];
  for (const label of labels) await db.label.upsert({ where: { id: label.id }, create: { ...label, workspaceId: "seed_workspace_studio" }, update: { name: label.name, color: label.color } });
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  for (const [index, [title, status, priority, position, offset]] of taskData.entries()) {
    const dueDate = new Date(today); dueDate.setUTCDate(dueDate.getUTCDate() + offset);
    const id = `seed_task_${String(index + 1).padStart(2, "0")}`;
    await db.task.upsert({ where: { id }, create: { id, projectId: "seed_project_redesign", title, description: `Zadanie demonstracyjne: ${title}.`, status, priority, position, dueDate, createdById: users[index % users.length].id }, update: { title, status, priority, position, dueDate } });
    for (const user of users.slice(0, (index % 3) + 1)) await db.taskAssignee.upsert({ where: { taskId_userId: { taskId: id, userId: user.id } }, create: { taskId: id, userId: user.id }, update: {} });
    const label = labels[index % labels.length]; await db.taskLabel.upsert({ where: { taskId_labelId: { taskId: id, labelId: label.id } }, create: { taskId: id, labelId: label.id }, update: {} });
  }
  await db.comment.upsert({ where: { id: "seed_comment_01" }, create: { id: "seed_comment_01", taskId: "seed_task_05", authorId: users[1].id, body: "Pierwszy zestaw komponentów jest gotowy do przeglądu." }, update: {} });
  await db.taskLink.upsert({ where: { id: "seed_link_01" }, create: { id: "seed_link_01", taskId: "seed_task_05", createdById: users[0].id, title: "Dokumentacja systemu projektowego", url: "https://example.com/design-system" }, update: {} });
  await db.activity.upsert({ where: { id: "seed_activity_01" }, create: { id: "seed_activity_01", workspaceId: "seed_workspace_studio", projectId: "seed_project_redesign", taskId: "seed_task_05", actorId: users[1].id, action: "COMMENT_ADDED" }, update: {} });
  console.log("Seed gotowy: anna@taskflow.demo / TaskFlowDemo123!");
}

main().finally(() => db.$disconnect());
