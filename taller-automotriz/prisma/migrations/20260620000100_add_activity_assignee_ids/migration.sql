ALTER TABLE "activities"
ADD COLUMN "asignadoAIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "activities"
SET "asignadoAIds" = ARRAY["asignadoAId"]
WHERE "asignadoAId" IS NOT NULL;
