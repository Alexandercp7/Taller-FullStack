import { PrismaClient, Prisma } from '@prisma/client';
import { UnitOfWork } from '../../../application/ports/unit-of-work.port';
import { IDomainEventDispatcher } from '../../../application/ports/services/domain-event-dispatcher.port';
import { DomainEventSource } from '../../../domain/events/domain-event-source';
import { PrismaClientProvider } from './prisma-client-provider';
import { logger } from '../../config/logger';

export class PrismaUnitOfWork implements UnitOfWork, PrismaClientProvider {
  private _currentTx: PrismaClient | null = null;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly dispatcher: IDomainEventDispatcher,
  ) {}

  getClient(): PrismaClient {
    return this._currentTx ?? this.prisma;
  }

  async execute<T>(fn: () => Promise<T>, eventSources: DomainEventSource[] = []): Promise<T> {
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      this._currentTx = tx as unknown as PrismaClient;
      try {
        return await fn();
      } finally {
        this._currentTx = null;
      }
    });

    // Transaction committed — safe to dispatch events.
    // Dispatch is best-effort: a queue/Redis outage must not roll back committed data.
    const events = eventSources.flatMap((s) => [...s.domainEvents]);
    eventSources.forEach((s) => s.clearEvents());
    if (events.length > 0) {
      await this.dispatcher.dispatch(events).catch((err) => {
        logger.error({ err }, 'Post-commit domain event dispatch failed — data committed, events dropped');
      });
    }

    return result;
  }
}
