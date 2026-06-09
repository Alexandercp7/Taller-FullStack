import { PaymentStatus } from '../enums/payment-status.enum';
import { Money } from '../value-objects/money.vo';
import { PaymentCalculator } from '../services/payment-calculator.service';
import { PaymentRegistered } from '../events/payment-registered.event';
import { DomainEvent } from '../events/domain-event';

export class AccountReceivable {
  private _domainEvents: DomainEvent[] = [];

  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly clientId: string,
    private _total: Money,
    private _paid: Money,
    private _balance: Money,
    private _status: PaymentStatus,
    private _dueDate: Date | null,
  ) {}

  get total(): Money { return this._total; }
  get paid(): Money { return this._paid; }
  get balance(): Money { return this._balance; }
  get status(): PaymentStatus { return this._status; }
  get dueDate(): Date | null { return this._dueDate; }
  get domainEvents(): ReadonlyArray<DomainEvent> { return this._domainEvents; }

  registerPayment(amount: Money, clientId: string): void {
    const result = PaymentCalculator.applyPayment(this._total, this._paid, amount);
    this._paid = result.newPaid;
    this._balance = result.newBalance;
    this._status = result.newStatus;

    this._domainEvents.push(
      new PaymentRegistered(this.id, amount.amount, clientId, result.newStatus === PaymentStatus.PAID),
    );
  }

  markOverdue(): void {
    if (this._status !== PaymentStatus.PAID) {
      this._status = PaymentStatus.OVERDUE;
    }
  }

  setDueDate(date: Date): void {
    this._dueDate = date;
  }

  clearEvents(): void {
    this._domainEvents = [];
  }
}
