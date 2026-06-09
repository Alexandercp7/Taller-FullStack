import { InventoryRepository } from '../../ports/repositories/inventory.repository';
import { StockMovementRepository } from '../../ports/repositories/stock-movement.repository';
import { UnitOfWork } from '../../ports/unit-of-work.port';
import { MovementType } from '../../../domain/enums/movement-type.enum';

interface RegisterMovementInput {
  itemId: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  userId: string;
}

export class RegisterStockMovementUseCase {
  constructor(
    private readonly inventoryRepo: InventoryRepository,
    private readonly stockMovementRepo: StockMovementRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: RegisterMovementInput): Promise<void> {
    const item = await this.inventoryRepo.findById(input.itemId);
    if (!item) throw new Error('Artículo no encontrado');

    let movement;
    if (input.type === MovementType.ENTRY) {
      movement = item.addStock(input.quantity, input.userId, input.reason);
    } else if (input.type === MovementType.ADJUSTMENT) {
      const newStock = item.stock + input.quantity;
      movement = item.adjustStock(newStock, input.userId, input.reason ?? 'Ajuste de inventario');
    } else {
      movement = item.deductStock(input.quantity, input.userId, '').movement;
    }

    await this.unitOfWork.execute(async () => {
      await this.inventoryRepo.save(item);
      await this.stockMovementRepo.save(movement);
    });

    item.clearEvents();
  }
}
