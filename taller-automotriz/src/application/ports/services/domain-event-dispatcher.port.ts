import { DomainEvent } from '../../../domain/events/domain-event';

export interface IDomainEventDispatcher {
  dispatch(events: ReadonlyArray<DomainEvent>): Promise<void>;
}
