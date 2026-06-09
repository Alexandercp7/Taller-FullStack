-- AlterTable
ALTER TABLE "price_lists" ADD COLUMN     "categoriaPrincipal" TEXT NOT NULL DEFAULT 'Mecánica General',
ADD COLUMN     "concepto" TEXT,
ADD COLUMN     "diametro" TEXT,
ADD COLUMN     "familia" TEXT,
ADD COLUMN     "observacion" TEXT,
ADD COLUMN     "precioAuto" DECIMAL(12,2),
ADD COLUMN     "precioCamion" DECIMAL(12,2),
ADD COLUMN     "precioCamioneta" DECIMAL(12,2),
ADD COLUMN     "sistema" TEXT,
ADD COLUMN     "tamano" TEXT,
ALTER COLUMN "vehicleType" DROP NOT NULL,
ALTER COLUMN "price" SET DEFAULT 0;
