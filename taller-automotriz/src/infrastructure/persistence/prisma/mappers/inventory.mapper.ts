import type { InventoryItem as PrismaInventoryItem } from '@prisma/client';
import { InventoryItem } from '../../../../domain/entities/inventory-item.entity';
import { InventoryType } from '../../../../domain/enums/inventory-type.enum';
import { Money } from '../../../../domain/value-objects/money.vo';

export class InventoryMapper {
  static toDomain(raw: PrismaInventoryItem): InventoryItem {
    return new InventoryItem(
      raw.id,
      raw.name,
      raw.description,
      raw.sku,
      raw.type as InventoryType,
      raw.stock,
      raw.minStock,
      Money.fromAmount(Number(raw.purchasePrice)),
      Money.fromAmount(Number(raw.salePrice)),
      raw.supplierId,
      raw.location,
      raw.isActive,
    );
  }

  static toPersistence(entity: InventoryItem): Omit<PrismaInventoryItem, 'createdAt' | 'updatedAt'> {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      sku: entity.sku,
      type: entity.type,
      stock: entity.stock,
      minStock: entity.minStock,
      purchasePrice: entity.purchasePrice.amount as unknown as PrismaInventoryItem['purchasePrice'],
      salePrice: entity.salePrice.amount as unknown as PrismaInventoryItem['salePrice'],
      supplierId: entity.supplierId,
      location: entity.location,
      isActive: entity.isActive,
    };
  }
}
