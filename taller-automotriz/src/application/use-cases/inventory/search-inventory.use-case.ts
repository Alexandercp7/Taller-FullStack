import { InventoryRepository, InventoryFilters } from '../../ports/repositories/inventory.repository';
import { InventoryItem } from '../../../domain/entities/inventory-item.entity';

export class SearchInventoryUseCase {
  constructor(private readonly inventoryRepo: InventoryRepository) {}

  async execute(filters: InventoryFilters): Promise<{ data: InventoryItem[]; total: number }> {
    return this.inventoryRepo.findByFilters(filters);
  }
}
