import { PrismaClient } from '@prisma/client';

/**
 * Provee el cliente Prisma activo para un repositorio.
 * Cuando hay una transacción en curso, devuelve el cliente transaccional (tx).
 * Los repositorios reciben este provider en lugar de PrismaClient directamente,
 * lo que les permite participar automáticamente en transacciones.
 */
export interface PrismaClientProvider {
  getClient(): PrismaClient;
}
