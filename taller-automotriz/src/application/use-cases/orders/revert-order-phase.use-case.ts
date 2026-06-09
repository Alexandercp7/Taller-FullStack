import { OrderRepository } from '../../ports/repositories/order.repository';
import { TimelineRepository } from '../../ports/repositories/timeline.repository';
import { OrderPhase } from '../../../domain/enums/order-phase.enum';

interface RevertPhaseInput {
  orderId: string;
  targetPhase: OrderPhase;
  userId: string;
}

export class RevertOrderPhaseUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly timelineRepo: TimelineRepository,
  ) {}

  async execute(input: RevertPhaseInput): Promise<void> {
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) throw new Error('Orden no encontrada');

    order.revertToPhase(input.targetPhase, input.userId);
    await this.orderRepo.save(order);

    await this.timelineRepo.save({
      orderId: input.orderId,
      userId: input.userId,
      event: 'phase_reverted',
      detail: { targetPhase: input.targetPhase },
    });

    order.clearEvents();
  }
}
