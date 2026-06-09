import { PaymentStatus } from '../enums/payment-status.enum';
import { CashType } from '../enums/cash-type.enum';
import { Money } from '../value-objects/money.vo';

export class ScheduledPayment {
  constructor(
    public readonly id: string,
    private _description: string,
    private _amount: Money,
    private _dueDate: Date,
    private _status: PaymentStatus,
    public readonly type: CashType,
    private _supplierId: string | null,
    private _clientId: string | null,
    private _calendarEventId: string | null,
    private _notes: string | null,
  ) {}

  get description(): string { return this._description; }
  get amount(): Money { return this._amount; }
  get dueDate(): Date { return this._dueDate; }
  get status(): PaymentStatus { return this._status; }
  get supplierId(): string | null { return this._supplierId; }
  get clientId(): string | null { return this._clientId; }
  get calendarEventId(): string | null { return this._calendarEventId; }
  get notes(): string | null { return this._notes; }

  markPaid(): void {
    this._status = PaymentStatus.PAID;
  }

  detectOverdue(): boolean {
    if (this._status === PaymentStatus.PAID) return false;
    const isOverdue = new Date() > this._dueDate;
    if (isOverdue) this._status = PaymentStatus.OVERDUE;
    return isOverdue;
  }

  attachCalendarEvent(eventId: string): void {
    this._calendarEventId = eventId;
  }

  update(data: { description?: string; amount?: Money; dueDate?: Date; notes?: string | null }): void {
    if (data.description !== undefined) this._description = data.description;
    if (data.amount !== undefined) this._amount = data.amount;
    if (data.dueDate !== undefined) this._dueDate = data.dueDate;
    if (data.notes !== undefined) this._notes = data.notes;
  }
}
