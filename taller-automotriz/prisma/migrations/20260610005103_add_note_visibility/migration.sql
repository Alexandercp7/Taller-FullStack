-- CreateEnum
CREATE TYPE "NoteVisibility" AS ENUM ('INTERNAL', 'CLIENT');

-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "visibility" "NoteVisibility" NOT NULL DEFAULT 'INTERNAL';
