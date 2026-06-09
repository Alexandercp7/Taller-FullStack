import { DomainEventSource } from '../../domain/events/domain-event-source';

export interface UnitOfWork {
  /**
   * Ejecuta `fn` dentro de una transacción atómica.
   * Si la transacción tiene éxito, despacha los eventos de dominio
   * acumulados en `eventSources` — NUNCA antes del commit.
   * Si la transacción falla, los eventos se descartan sin despachar.
   */
  execute<T>(fn: () => Promise<T>, eventSources?: DomainEventSource[]): Promise<T>;
}
