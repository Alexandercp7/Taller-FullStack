-- Rename repairNotes → diagnostico (preserva datos existentes)
ALTER TABLE "work_orders" RENAME COLUMN "repairNotes" TO "diagnostico";

-- Eliminar columnas legacy no usadas
ALTER TABLE "work_orders" DROP COLUMN IF EXISTS "mileageOut";
ALTER TABLE "work_orders" DROP COLUMN IF EXISTS "exitKm";
ALTER TABLE "work_orders" DROP COLUMN IF EXISTS "fuelLevel";
