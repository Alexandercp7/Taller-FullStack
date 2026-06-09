import { InventoryRepository } from '../../ports/repositories/inventory.repository';
import { InventoryType } from '../../../domain/enums/inventory-type.enum';
import { Money } from '../../../domain/value-objects/money.vo';

interface UpdateInventoryItemInput {
  itemId: string;
  name?: string;
  description?: string | null;
  sku?: string | null;
  type?: InventoryType;
  minStock?: number;
  purchasePrice?: number;
  salePrice?: number;
  supplierId?: string | null;
  location?: string | null;
}

export class UpdateInventoryItemUseCase {
  constructor(private readonly inventoryRepo: InventoryRepository) {}

  async execute(input: UpdateInventoryItemInput): Promise<void> {
    const { itemId, purchasePrice, salePrice, ...infoFields } = input;
    const item = await this.inventoryRepo.findById(itemId);
    if (!item) throw new Error('Artículo no encontrado');

    item.updateInfo(infoFields);

    if (purchasePrice !== undefined || salePrice !== undefined) {
      item.updatePrices(
        purchasePrice !== undefined ? Money.fromAmount(purchasePrice) : item.purchasePrice,
        salePrice !== undefined ? Money.fromAmount(salePrice) : item.salePrice,
      );
    }

    await this.inventoryRepo.save(item);
  }
}
