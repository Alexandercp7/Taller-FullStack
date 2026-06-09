import { InventoryRepository } from '../../ports/repositories/inventory.repository';

export class DeleteInventoryItemUseCase {
  constructor(private readonly inventoryRepo: InventoryRepository) {}

  async execute(itemId: string): Promise<void> {
    const item = await this.inventoryRepo.findById(itemId);
    if (!item) throw new Error('Artículo no encontrado');
    item.deactivate();
    await this.inventoryRepo.save(item);
  }
}
