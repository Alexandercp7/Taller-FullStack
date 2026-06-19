CREATE TABLE "dashboard_shortcuts" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "shortcutId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dashboard_shortcuts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dashboard_shortcuts_userId_shortcutId_key"
ON "dashboard_shortcuts"("userId", "shortcutId");

CREATE INDEX "dashboard_shortcuts_userId_sortOrder_idx"
ON "dashboard_shortcuts"("userId", "sortOrder");

ALTER TABLE "dashboard_shortcuts"
ADD CONSTRAINT "dashboard_shortcuts_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
