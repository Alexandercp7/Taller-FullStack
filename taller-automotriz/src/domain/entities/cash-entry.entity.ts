import { CashType } from '../enums/cash-type.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { Money } from '../value-objects/money.vo';
import { InvalidValueObjectError } from '../errors/invalid-value-object.error';

export class CashEntry {
  constructor(
    public readonly id: string,
    public readonly type: CashType,
    private _amount: Money,
    private _description: string,
    private _method: PaymentMethod,
    private _orderId: string | null,
    private _userId: string,
    public readonly date: Date,
  ) {
    if (_amount.isZero()) {
      throw new InvalidValueObjectError('CashEntry', 'el monto debe ser mayor a 0');
    }
  }

  get amount(): Money { return this._amount; }
  get description(): string { return this._description; }
  get method(): PaymentMethod { return this._method; }
  get orderId(): string | null { return this._orderId; }
  get userId(): string { return this._userId; }
}
