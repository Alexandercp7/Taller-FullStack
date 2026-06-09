-- DropIndex
DROP INDEX "clients_phone_key";

-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "phone" DROP NOT NULL;
