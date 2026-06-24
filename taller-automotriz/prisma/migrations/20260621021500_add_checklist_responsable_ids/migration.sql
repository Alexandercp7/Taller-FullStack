ALTER TABLE "checklists"
ADD COLUMN "responsableIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "checklists"
SET "responsableIds" = ARRAY["responsableId"]
WHERE "responsableId" IS NOT NULL;
