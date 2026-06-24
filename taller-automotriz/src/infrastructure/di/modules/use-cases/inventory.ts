import { AssignPartToOrderUseCase } from '../../../../application/use-cases/inventory/assign-part-to-order.use-case';
import { CreateInventoryItemUseCase } from '../../../../application/use-cases/inventory/create-inventory-item.use-case';
import { SearchInventoryUseCase } from '../../../../application/use-cases/inventory/search-inventory.use-case';
import { RegisterStockMovementUseCase } from '../../../../application/use-cases/inventory/register-stock-movement.use-case';
import { UpdateInventoryItemUseCase } from '../../../../application/use-cases/inventory/update-inventory-item.use-case';
import { DeleteInventoryItemUseCase } from '../../../../application/use-cases/inventory/delete-inventory-item.use-case';
import { GetMovementHistoryUseCase } from '../../../../application/use-cases/inventory/get-movement-history.use-case';
import type { Repos } from '../repositories';
import type { Infra } from '../infra';

export function buildInventoryUseCases(repos: Repos, infra: Infra) {
  const { orderRepo, inventoryRepo, stockMovementRepo, timelineRepo } = repos;
  const { unitOfWork } = infra;
  return {
    assignPartToOrder: new AssignPartToOrderUseCase(orderRepo, inventoryRepo, stockMovementRepo, timelineRepo, unitOfWork),
    createInventoryItem: new CreateInventoryItemUseCase(inventoryRepo),
    searchInventory: new SearchInventoryUseCase(inventoryRepo),
    registerStockMovement: new RegisterStockMovementUseCase(inventoryRepo, stockMovementRepo, unitOfWork),
    updateInventoryItem: new UpdateInventoryItemUseCase(inventoryRepo),
    deleteInventoryItem: new DeleteInventoryItemUseCase(inventoryRepo),
    getMovementHistory: new GetMovementHistoryUseCase(inventoryRepo, stockMovementRepo),
  };
}
