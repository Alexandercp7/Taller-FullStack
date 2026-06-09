import { OrderRepository } from '../../ports/repositories/order.repository';
import { CashEntryRepository } from '../../ports/repositories/cash-entry.repository';
import { InventoryRepository } from '../../ports/repositories/inventory.repository';
import { OrderStatus } from '../../../domain/enums/order-status.enum';

interface GetKPIsInput {
  from: Date;
  to: Date;
}

export class GetKPIsUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly cashEntryRepo: CashEntryRepository,
    private readonly inventoryRepo: InventoryRepository,
  ) {}

  async execute(input: GetKPIsInput) {
    const [cashSummary, lowStockItems] = await Promise.all([
      this.cashEntryRepo.getSummary(input.from, input.to),
      this.inventoryRepo.findBelowMinStock(),
    ]);

    return {
      revenue: cashSummary.totalIncome,
      expenses: cashSummary.totalExpense,
      profit: cashSummary.balance,
      lowStockItemsCount: lowStockItems.length,
      period: { from: input.from, to: input.to },
    };
  }
}
