export interface TimelineEventRecord {
  id: string;
  orderId: string;
  event: string;
  detail: Record<string, unknown> | null;
  userId: string;
  userName: string;
  createdAt: Date;
}
