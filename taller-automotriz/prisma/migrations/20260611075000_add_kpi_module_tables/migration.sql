-- AlterTable
ALTER TABLE "users" ADD COLUMN "kpiRole" TEXT;

-- CreateTable
CREATE TABLE "organization_info" (
    "id" TEXT NOT NULL,
    "mision" TEXT NOT NULL DEFAULT '',
    "vision" TEXT NOT NULL DEFAULT '',
    "valores" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "organization_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpis" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "roleResponsable" TEXT NOT NULL,
    "meta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "progreso" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "periodo" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_tags" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "activity_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_activities" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "roleAsignado" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pendiente',
    "prioridad" TEXT NOT NULL DEFAULT 'Normal',
    "fechaVencimiento" TIMESTAMP(3),
    "empleadoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_KpiActivityTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_KpiActivityTags_AB_pkey" PRIMARY KEY ("A", "B")
);

-- CreateIndex
CREATE INDEX "_KpiActivityTags_B_index" ON "_KpiActivityTags"("B");

-- AddForeignKey
ALTER TABLE "kpi_activities" ADD CONSTRAINT "kpi_activities_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KpiActivityTags" ADD CONSTRAINT "_KpiActivityTags_A_fkey" FOREIGN KEY ("A") REFERENCES "activity_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KpiActivityTags" ADD CONSTRAINT "_KpiActivityTags_B_fkey" FOREIGN KEY ("B") REFERENCES "kpi_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
