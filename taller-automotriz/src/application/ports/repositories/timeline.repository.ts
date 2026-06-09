import { TimelineEventRecord } from '../../../domain/types/timeline-event.type';

export interface SaveTimelineEntryData {
  orderId: string;
  userId: string;
  event: string;
  detail?: Record<string, unknown>;
}

export interface TimelineRepository {
  save(entry: SaveTimelineEntryData): Promise<void>;
  findByOrderId(orderId: string): Promise<TimelineEventRecord[]>;
}
