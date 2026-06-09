import { PrismaClient, Prisma } from '@prisma/client';
import { UnitOfWork } from '../../../application/ports/unit-of-work.port';
import { IDomainEventDispatcher } from '../../../application/ports/services/domain-event-dispatcher.port';
import { DomainEventSource } from '../../../domain/events/domain-event-source';
import { PrismaClientProvider } from './prisma-client-provider';

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

    // La transacción hizo commit — ahora es seguro despachar.
    // Si el dispatch falla, la persistencia ya ocurrió; en producción
    // considera el Outbox Pattern para garantía at-least-once.
    const events = eventSources.flatMap((s) => [...s.domainEvents]);
    eventSources.forEach((s) => s.clearEvents());
    if (events.length > 0) {
      await this.dispatcher.dispatch(events);
    }

    return result;
  }
}
