-- AlterTable
ALTER TABLE "scheduled_payments" ADD COLUMN "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
