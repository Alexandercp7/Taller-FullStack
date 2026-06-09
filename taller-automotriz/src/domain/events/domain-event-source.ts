import { DomainEvent } from './domain-event';

export interface DomainEventSource {
  readonly domainEvents: ReadonlyArray<DomainEvent>;
  clearEvents(): void;
}
