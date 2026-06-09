import { InventoryRepository } from '../../ports/repositories/inventory.repository';
import { StockMovementRepository } from '../../ports/repositories/stock-movement.repository';
import { StockMovementRecord } from '../../../domain/entities/inventory-item.entity';

export class GetMovementHistoryUseCase {
  constructor(
    private readonly inventoryRepo: InventoryRepository,
    private readonly stockMovementRepo: StockMovementRepository,
  ) {}

  async execute(itemId: string): Promise<StockMovementRecord[]> {
    const item = await this.inventoryRepo.findById(itemId);
    if (!item) throw new Error('Artículo no encontrado');
    return this.stockMovementRepo.findByItemId(itemId);
  }
}
