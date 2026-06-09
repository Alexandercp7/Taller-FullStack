import { OrderRepository } from '../../ports/repositories/order.repository';
import { TimelineRepository } from '../../ports/repositories/timeline.repository';
import { NoteRepository } from '../../ports/repositories/note.repository';
import { PhotoRepository } from '../../ports/repositories/photo.repository';
import { ChecklistRepository } from '../../ports/repositories/checklist.repository';
import { WorkOrder } from '../../../domain/entities/work-order.entity';
import { TimelineEventRecord } from '../../../domain/types/timeline-event.type';

export class GetOrderDetailUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly timelineRepo: TimelineRepository,
    private readonly noteRepo: NoteRepository,
    private readonly photoRepo: PhotoRepository,
    private readonly checklistRepo: ChecklistRepository,
  ) {}

  async execute(orderId: string) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new Error('Orden no encontrada');

    const [timeline, notes, photos, checklist] = await Promise.all([
      this.timelineRepo.findByOrderId(orderId),
      this.noteRepo.findByOrderId(orderId),
      this.photoRepo.findByOrderId(orderId),
      this.checklistRepo.findByOrderId(orderId),
    ]);

    return { order, timeline, notes, photos, checklist };
  }
}
