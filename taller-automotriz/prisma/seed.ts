import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminHash        = await argon2.hash('admin123456');
  const managerHash      = await argon2.hash('gerente123456');
  const techHash         = await argon2.hash('tech123456');
  const receptionistHash = await argon2.hash('recepcion123456');

  await prisma.user.upsert({
    where: { email: 'admin@taller.com' },
    update: {},
    create: {
      id: 'seed-admin-001',
      name: 'Administrador',
      email: 'admin@taller.com',
      passwordHash: adminHash,
      role: 'ADMIN',
      permissions: [],
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'gerente@taller.com' },
    update: {},
    create: {
      id: 'seed-manager-001',
      name: 'Gerente General',
      email: 'gerente@taller.com',
      passwordHash: managerHash,
      role: 'MANAGER',
      permissions: [],
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'tecnico@taller.com' },
    update: {},
    create: {
      id: 'seed-tech-001',
      name: 'Técnico Principal',
      email: 'tecnico@taller.com',
      passwordHash: techHash,
      role: 'TECHNICIAN',
      permissions: [],
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'recepcion@taller.com' },
    update: {},
    create: {
      id: 'seed-receptionist-001',
      name: 'Recepcionista',
      email: 'recepcion@taller.com',
      passwordHash: receptionistHash,
      role: 'RECEPTIONIST',
      permissions: [],
      isActive: true,
    },
  });

  const client = await prisma.client.upsert({
    where: { id: 'seed-client-001' },
    update: {},
    create: {
      id: 'seed-client-001',
      name: 'Carlos Martínez',
      phone: '5551234567',
      email: 'carlos@example.com',
      tag: 'NEW',
    },
  });

  const vehicle = await prisma.vehicle.upsert({
    where: { plates: 'ABC-123' },
    update: {},
    create: {
      id: 'seed-vehicle-001',
      clientId: client.id,
      plates: 'ABC-123',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      color: 'Blanco',
      type: 'CAR',
    },
  });

  await prisma.inventoryItem.upsert({
    where: { sku: 'FILTRO-ACEITE-001' },
    update: {},
    create: {
      id: 'seed-item-001',
      name: 'Filtro de Aceite Toyota',
      sku: 'FILTRO-ACEITE-001',
      type: 'SALE_PART',
      stock: 25,
      minStock: 5,
      purchasePrice: 45.00,
      salePrice: 120.00,
      location: 'Estante A-1',
      isActive: true,
    },
  });

  console.log('✅ Seed completado');
  console.log(`   Admin:         admin@taller.com      / admin123456`);
  console.log(`   Gerente:       gerente@taller.com    / gerente123456`);
  console.log(`   Técnico:       tecnico@taller.com    / tech123456`);
  console.log(`   Recepcionista: recepcion@taller.com  / recepcion123456`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
