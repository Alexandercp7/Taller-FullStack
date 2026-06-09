import { PrismaClient, Prisma } from '@prisma/client';
import {
  InventoryRepository,
  InventoryFilters,
  AssignPartData,
} from '../../../application/ports/repositories/inventory.repository';
import { InventoryItem } from '../../../domain/entities/inventory-item.entity';
import { InventoryMapper } from '../prisma/mappers/inventory.mapper';
import { createId } from '../../../shared/identifier';

export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<InventoryItem | null> {
    const raw = await this.prisma.inventoryItem.findUnique({ where: { id } });
    return raw ? InventoryMapper.toDomain(raw) : null;
  }

  async findByFilters(filters: InventoryFilters): Promise<{ data: InventoryItem[]; total: number }> {
    const where: Prisma.InventoryItemWhereInput = { isActive: true };
    if (filters.type) where.type = filters.type;
    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return { data: items.map(InventoryMapper.toDomain), total };
  }

  async findBelowMinStock(): Promise<InventoryItem[]> {
    const items = await this.prisma.$queryRaw<typeof this.prisma.inventoryItem.$queryRaw>`
      SELECT * FROM inventory_items
      WHERE stock < "minStock" AND "isActive" = true
    `;
    return (items as any[]).map(InventoryMapper.toDomain);
  }

  async save(item: InventoryItem): Promise<void> {
    const data = InventoryMapper.toPersistence(item);
    await this.prisma.inventoryItem.upsert({
      where: { id: item.id },
      create: data,
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.inventoryItem.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async assignToOrder(data: AssignPartData): Promise<string> {
    const id = createId();
    await this.prisma.assignedPart.create({
      data: {
        id,
        orderId: data.orderId,
        itemId: data.itemId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        notes: data.notes ?? null,
      },
    });
    return id;
  }

  async updateAssignedPart(
    assignedPartId: string,
    data: { quantity?: number; notes?: string },
  ): Promise<void> {
    await this.prisma.assignedPart.update({
      where: { id: assignedPartId },
      data,
    });
  }

  async removeAssignedPart(assignedPartId: string): Promise<void> {
    await this.prisma.assignedPart.delete({ where: { id: assignedPartId } });
  }
}
