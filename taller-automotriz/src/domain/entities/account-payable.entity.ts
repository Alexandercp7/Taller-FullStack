import { PaymentStatus } from '../enums/payment-status.enum';
import { Money } from '../value-objects/money.vo';
import { PaymentCalculator } from '../services/payment-calculator.service';

export class AccountPayable {
  constructor(
    public readonly id: string,
    public readonly supplierId: string,
    private _description: string,
    private _total: Money,
    private _paid: Money,
    private _balance: Money,
    private _status: PaymentStatus,
    private _dueDate: Date | null,
  ) {}

  get description(): string { return this._description; }
  get total(): Money { return this._total; }
  get paid(): Money { return this._paid; }
  get balance(): Money { return this._balance; }
  get status(): PaymentStatus { return this._status; }
  get dueDate(): Date | null { return this._dueDate; }

  registerPayment(amount: Money): void {
    const result = PaymentCalculator.applyPayment(this._total, this._paid, amount);
    this._paid = result.newPaid;
    this._balance = result.newBalance;
    this._status = result.newStatus;
  }

  markOverdue(): void {
    if (this._status !== PaymentStatus.PAID) {
      this._status = PaymentStatus.OVERDUE;
    }
  }

  setDueDate(date: Date): void {
    this._dueDate = date;
  }
}
