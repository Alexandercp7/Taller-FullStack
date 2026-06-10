import { UnitOfWork } from '../../src/application/ports/unit-of-work.port';
import { JobQueue } from '../../src/application/ports/services/job-queue.port';
import { TimelineRepository, SaveTimelineEntryData } from '../../src/application/ports/repositories/timeline.repository';
import { TimelineEventRecord } from '../../src/domain/types/timeline-event.type';
import { StockMovementRepository } from '../../src/application/ports/repositories/stock-movement.repository';
import { StockMovementRecord } from '../../src/domain/entities/inventory-item.entity';
import { NotificationSender, NotificationMessage } from '../../src/application/ports/services/notification-sender.port';
import { IDomainEventDispatcher } from '../../src/application/ports/services/domain-event-dispatcher.port';
import { DomainEvent } from '../../src/domain/events/domain-event';
import { Hasher } from '../../src/application/ports/services/hasher.port';
import { TokenProvider, TokenPayload } from '../../src/application/ports/services/token-provider.port';

export class FakeUnitOfWork implements UnitOfWork {
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}

export class FakeJobQueue implements JobQueue {
  jobs: Array<{ name: string; data: Record<string, unknown> }> = [];

  async enqueue<T extends Record<string, unknown>>(jobName: string, data: T): Promise<void> {
    this.jobs.push({ name: jobName, data });
  }

  clear() {
    this.jobs = [];
  }
}

export class FakeTimelineRepository implements TimelineRepository {
  entries: SaveTimelineEntryData[] = [];

  async save(entry: SaveTimelineEntryData): Promise<void> {
    this.entries.push(entry);
  }

  async findByOrderId(orderId: string): Promise<TimelineEventRecord[]> {
    return this.entries
      .filter((e) => e.orderId === orderId)
      .map((e, idx) => ({
        id: `tl-${idx}`,
        orderId: e.orderId,
        event: e.event,
        detail: e.detail ?? null,
        userId: e.userId,
        userName: 'Test User',
        createdAt: new Date(),
      }));
  }
}

export class FakeStockMovementRepository implements StockMovementRepository {
  movements: Array<Omit<StockMovementRecord, 'id'>> = [];

  async save(movement: Omit<StockMovementRecord, 'id'>): Promise<void> {
    this.movements.push(movement);
  }

  async findByItemId(itemId: string): Promise<StockMovementRecord[]> {
    return this.movements
      .filter((m) => m.itemId === itemId)
      .map((m, idx) => ({ ...m, id: `sm-${idx}` }));
  }
}

export class FakeDomainEventDispatcher implements IDomainEventDispatcher {
  dispatched: DomainEvent[] = [];

  async dispatch(events: ReadonlyArray<DomainEvent>): Promise<void> {
    this.dispatched.push(...events);
  }
}

export class FakeHasher implements Hasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async verify(plain: string, hashed: string): Promise<boolean> {
    return hashed === `hashed:${plain}`;
  }
}

export class FakeTokenProvider implements TokenProvider {
  sign(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return `access:${payload.sub}:${payload.role}`;
  }

  verify(token: string): TokenPayload {
    const [, sub, role] = token.split(':');
    return { sub, role };
  }

  signRefresh(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return `refresh:${payload.sub}:${payload.role}`;
  }

  verifyRefresh(token: string): TokenPayload {
    const [, sub, role] = token.split(':');
    return { sub, role };
  }
}

export class FakeNotificationSender implements NotificationSender {
  readonly channel = 'fake';
  sent: Array<{ to: string; message: NotificationMessage }> = [];

  async send(to: string, message: NotificationMessage): Promise<void> {
    this.sent.push({ to, message });
  }
}
