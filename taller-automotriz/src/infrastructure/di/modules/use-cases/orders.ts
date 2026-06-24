import { AddNoteToOrderUseCase } from '../../../../application/use-cases/orders/add-note-to-order.use-case';
import { CreateOrderUseCase } from '../../../../application/use-cases/orders/create-order.use-case';
import { ListOrdersUseCase } from '../../../../application/use-cases/orders/list-orders.use-case';
import { GetOrderDetailUseCase } from '../../../../application/use-cases/orders/get-order-detail.use-case';
import { ChangeOrderStatusUseCase } from '../../../../application/use-cases/orders/change-order-status.use-case';
import { CloseOrderUseCase } from '../../../../application/use-cases/orders/close-order.use-case';
import { DeleteOrderUseCase } from '../../../../application/use-cases/orders/delete-order.use-case';
import { RevertOrderPhaseUseCase } from '../../../../application/use-cases/orders/revert-order-phase.use-case';
import { ShareOrderPortalUseCase } from '../../../../application/use-cases/orders/share-order-portal.use-case';
import type { Repos } from '../repositories';
import type { Infra } from '../infra';

export function buildOrderUseCases(repos: Repos, infra: Infra) {
  const { orderRepo, clientRepo, vehicleRepo, timelineRepo, noteRepo, photoRepo, checklistRepo, arRepo } = repos;
  const { unitOfWork, dispatcher } = infra;
  return {
    addNoteToOrder: new AddNoteToOrderUseCase(orderRepo, noteRepo),
    createOrder: new CreateOrderUseCase(orderRepo, clientRepo, vehicleRepo, timelineRepo, unitOfWork),
    listOrders: new ListOrdersUseCase(orderRepo),
    getOrderDetail: new GetOrderDetailUseCase(orderRepo, timelineRepo, noteRepo, photoRepo, checklistRepo),
    changeOrderStatus: new ChangeOrderStatusUseCase(orderRepo, timelineRepo, dispatcher),
    closeOrder: new CloseOrderUseCase(orderRepo, clientRepo, arRepo, timelineRepo, unitOfWork),
    deleteOrder: new DeleteOrderUseCase(orderRepo),
    revertOrderPhase: new RevertOrderPhaseUseCase(orderRepo, timelineRepo),
    shareOrderPortal: new ShareOrderPortalUseCase(orderRepo),
  };
}
