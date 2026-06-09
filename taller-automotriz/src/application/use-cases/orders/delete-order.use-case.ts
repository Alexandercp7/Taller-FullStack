import { OrderRepository } from '../../ports/repositories/order.repository';
import { OrderStatus } from '../../../domain/enums/order-status.enum';

const DELETABLE_STATUSES: OrderStatus[] = [OrderStatus.SCHEDULED, OrderStatus.ARCHIVED];

export class DeleteOrderUseCase {
  constructor(private readonly orderRepo: OrderRepository) {}

  async execute(orderId: string): Promise<void> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new Error('Orden no encontrada');

    if (!DELETABLE_STATUSES.includes(order.status)) {
      throw new Error(`No se puede eliminar una orden con estado '${order.status}'`);
    }

    await this.orderRepo.delete(orderId);
  }
}
