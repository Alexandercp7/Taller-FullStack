import { OrderRepository } from '../../ports/repositories/order.repository';
import { TimelineRepository } from '../../ports/repositories/timeline.repository';

interface RegisterIntakeCausesInput {
  orderId: string;
  causes: string[];
  userId: string;
}

export class RegisterIntakeCausesUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly timelineRepo: TimelineRepository,
  ) {}

  async execute(input: RegisterIntakeCausesInput): Promise<void> {
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) throw new Error('Orden no encontrada');

    order.setIntakeCauses(input.causes);
    await this.orderRepo.save(order);

    await this.timelineRepo.save({
      orderId: input.orderId,
      userId: input.userId,
      event: 'intake_causes_registered',
      detail: { causes: input.causes },
    });
  }
}
