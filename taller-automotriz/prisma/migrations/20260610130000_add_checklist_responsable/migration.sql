-- AlterTable
ALTER TABLE "checklists" ADD COLUMN     "responsableId" TEXT;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
