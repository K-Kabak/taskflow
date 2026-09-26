CREATE TYPE "NotificationType" AS ENUM ('TASK_ASSIGNED', 'COMMENT_ADDED');

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "taskId" TEXT,
    "projectId" TEXT,
    "message" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notification_eventKey_key" ON "Notification"("eventKey");
CREATE INDEX "Notification_workspaceId_userId_createdAt_idx" ON "Notification"("workspaceId", "userId", "createdAt");
CREATE INDEX "Notification_workspaceId_userId_readAt_idx" ON "Notification"("workspaceId", "userId", "readAt");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
