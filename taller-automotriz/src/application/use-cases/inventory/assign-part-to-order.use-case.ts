import { OrderRepository } from '../../ports/repositories/order.repository';
import { InventoryRepository } from '../../ports/repositories/inventory.repository';
import { StockMovementRepository } from '../../ports/repositories/stock-movement.repository';
import { TimelineRepository } from '../../ports/repositories/timeline.repository';
import { UnitOfWork } from '../../ports/unit-of-work.port';

interface AssignPartInput {
  orderId: string;
  itemId: string;
  quantity: number;
  userId: string;
}

interface AssignPartOutput {
  assignedPartId: string;
  newStock: number;
  isBelowMinimum: boolean;
}

export class AssignPartToOrderUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly inventoryRepo: InventoryRepository,
    private readonly stockMovementRepo: StockMovementRepository,
    private readonly timelineRepo: TimelineRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: AssignPartInput): Promise<AssignPartOutput> {
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) throw new Error('Orden no encontrada');

    const item = await this.inventoryRepo.findById(input.itemId);
    if (!item) throw new Error('Artículo no encontrado');

    const result = item.deductStock(input.quantity, input.userId, input.orderId);

    const assignedPartId = await this.unitOfWork.execute(async () => {
      await this.inventoryRepo.save(item);
      await this.stockMovementRepo.save(result.movement);

      const partId = await this.inventoryRepo.assignToOrder({
        orderId: input.orderId,
        itemId: input.itemId,
        quantity: input.quantity,
        unitPrice: item.salePrice.amount,
      });

      await this.timelineRepo.save({
        orderId: input.orderId,
        userId: input.userId,
        event: 'part_assigned',
        detail: { itemName: item.name, quantity: input.quantity },
      });

      return partId;
    }, [item]);

    return {
      assignedPartId,
      newStock: item.stock,
      isBelowMinimum: result.isBelowMinimum,
    };
  }
}
