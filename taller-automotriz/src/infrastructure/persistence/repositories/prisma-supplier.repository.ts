import { PrismaClient } from '@prisma/client';
import { SupplierRepository } from '../../../application/ports/repositories/supplier.repository';
import { Supplier } from '../../../domain/entities/supplier.entity';
import { createId } from '../../../shared/identifier';

export class PrismaSupplierRepository implements SupplierRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(raw: any): Supplier {
    return new Supplier(
      raw.id,
      raw.name,
      raw.contact ?? null,
      raw.phone ?? null,
      raw.email ?? null,
      raw.notes ?? null,
      raw.isActive,
    );
  }

  async findById(id: string): Promise<Supplier | null> {
    const raw = await this.prisma.supplier.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findAll(): Promise<Supplier[]> {
    const items = await this.prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return items.map(this.toDomain.bind(this));
  }

  async save(supplier: Supplier): Promise<void> {
    await this.prisma.supplier.upsert({
      where: { id: supplier.id },
      create: {
        id: supplier.id,
        name: supplier.name,
        contact: supplier.contact,
        phone: supplier.phone,
        email: supplier.email,
        notes: supplier.notes,
        isActive: supplier.isActive,
      },
      update: {
        name: supplier.name,
        contact: supplier.contact,
        phone: supplier.phone,
        email: supplier.email,
        notes: supplier.notes,
        isActive: supplier.isActive,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
