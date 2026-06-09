import {
  TimelineRepository,
  SaveTimelineEntryData,
} from '../../../application/ports/repositories/timeline.repository';
import { TimelineEventRecord } from '../../../domain/types/timeline-event.type';
import { createId } from '../../../shared/identifier';
import { PrismaClientProvider } from '../prisma/prisma-client-provider';

export class PrismaTimelineRepository implements TimelineRepository {
  constructor(private readonly provider: PrismaClientProvider) {}

  private get db() {
    return this.provider.getClient();
  }

  async save(entry: SaveTimelineEntryData): Promise<void> {
    await this.db.timelineEntry.create({
      data: {
        id: createId(),
        orderId: entry.orderId,
        userId: entry.userId,
        event: entry.event,
        detail: (entry.detail ?? null) as any,
      },
    });
  }

  async findByOrderId(orderId: string): Promise<TimelineEventRecord[]> {
    const items = await this.db.timelineEntry.findMany({
      where: { orderId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      event: item.event,
      detail: item.detail as Record<string, unknown> | null,
      userId: item.userId,
      userName: item.user.name,
      createdAt: item.createdAt,
    }));
  }
}
