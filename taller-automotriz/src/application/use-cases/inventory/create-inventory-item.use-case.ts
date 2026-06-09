import { InventoryRepository } from '../../ports/repositories/inventory.repository';
import { InventoryItem } from '../../../domain/entities/inventory-item.entity';
import { InventoryType } from '../../../domain/enums/inventory-type.enum';
import { Money } from '../../../domain/value-objects/money.vo';
import { createId } from '../../../shared/identifier';

interface CreateInventoryItemInput {
  name: string;
  description?: string;
  sku?: string;
  type: InventoryType;
  stock?: number;
  minStock?: number;
  purchasePrice: number;
  salePrice: number;
  supplierId?: string;
  location?: string;
}

export class CreateInventoryItemUseCase {
  constructor(private readonly inventoryRepo: InventoryRepository) {}

  async execute(input: CreateInventoryItemInput): Promise<{ id: string }> {
    const item = new InventoryItem(
      createId(),
      input.name,
      input.description ?? null,
      input.sku ?? null,
      input.type,
      input.stock ?? 0,
      input.minStock ?? 0,
      Money.fromAmount(input.purchasePrice),
      Money.fromAmount(input.salePrice),
      input.supplierId ?? null,
      input.location ?? null,
      true,
    );

    await this.inventoryRepo.save(item);
    return { id: item.id };
  }
}
