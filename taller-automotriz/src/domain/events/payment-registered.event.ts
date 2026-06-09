import { DomainEvent } from './domain-event';

export class PaymentRegistered extends DomainEvent {
  constructor(
    accountId: string,
    public readonly amount: number,
    public readonly clientId: string,
    public readonly isPaid: boolean,
  ) {
    super(accountId);
  }
}
