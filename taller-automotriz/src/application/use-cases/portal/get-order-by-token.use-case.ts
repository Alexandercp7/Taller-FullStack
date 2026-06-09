import { OrderRepository } from '../../ports/repositories/order.repository';
import { TimelineRepository } from '../../ports/repositories/timeline.repository';
import { PhotoRepository } from '../../ports/repositories/photo.repository';

export class GetOrderByTokenUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly timelineRepo: TimelineRepository,
    private readonly photoRepo: PhotoRepository,
  ) {}

  async execute(token: string) {
    const order = await this.orderRepo.findByPortalToken(token);
    if (!order) throw new Error('Orden no encontrada');

    const [timeline, photos] = await Promise.all([
      this.timelineRepo.findByOrderId(order.id),
      this.photoRepo.findByOrderId(order.id),
    ]);

    return {
      order: {
        id: order.id,
        code: order.code,
        status: order.status,
        phase: order.phase,
        problem: order.problem,
        scheduledAt: order.scheduledAt,
      },
      timeline,
      photos,
    };
  }
}
