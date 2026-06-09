import { OrderRepository } from '../../ports/repositories/order.repository';
import { TimelineRepository } from '../../ports/repositories/timeline.repository';
import { IDomainEventDispatcher } from '../../ports/services/domain-event-dispatcher.port';
import { OrderStatus } from '../../../domain/enums/order-status.enum';

interface ChangeOrderStatusInput {
  orderId: string;
  newStatus: OrderStatus;
  userId: string;
}

export class ChangeOrderStatusUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly timelineRepo: TimelineRepository,
    private readonly dispatcher: IDomainEventDispatcher,
  ) {}

  async execute(input: ChangeOrderStatusInput): Promise<void> {
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) throw new Error('Orden no encontrada');

    order.changeStatus(input.newStatus, input.userId);
    await this.orderRepo.save(order);

    await this.timelineRepo.save({
      orderId: input.orderId,
      userId: input.userId,
      event: 'status_changed',
      detail: { newStatus: input.newStatus },
    });

    await this.dispatcher.dispatch(order.domainEvents);
    order.clearEvents();
  }
}
