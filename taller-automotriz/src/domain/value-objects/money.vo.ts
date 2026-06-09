import { InvalidValueObjectError } from '../errors/invalid-value-object.error';

export class Money {
  private constructor(private readonly _cents: number) {}

  static fromAmount(amount: number): Money {
    if (amount < 0) throw new InvalidValueObjectError('Money', 'no puede ser negativo');
    return new Money(Math.round(amount * 100));
  }

  static zero(): Money {
    return new Money(0);
  }

  static fromCents(cents: number): Money {
    return new Money(cents);
  }

  get amount(): number {
    return this._cents / 100;
  }

  get cents(): number {
    return this._cents;
  }

  add(other: Money): Money {
    return new Money(this._cents + other._cents);
  }

  subtract(other: Money): Money {
    const result = this._cents - other._cents;
    if (result < 0) throw new InvalidValueObjectError('Money', 'resultado negativo');
    return new Money(result);
  }

  multiply(quantity: number): Money {
    return new Money(Math.round(this._cents * quantity));
  }

  applyDiscount(percentage: number): Money {
    const discount = Math.round(this._cents * (percentage / 100));
    return new Money(this._cents - discount);
  }

  applyTax(percentage: number): Money {
    const tax = Math.round(this._cents * (percentage / 100));
    return new Money(this._cents + tax);
  }

  isGreaterThan(other: Money): boolean {
    return this._cents > other._cents;
  }

  isLessThanOrEqual(other: Money): boolean {
    return this._cents <= other._cents;
  }

  isZero(): boolean {
    return this._cents === 0;
  }

  equals(other: Money): boolean {
    return this._cents === other._cents;
  }

  toString(): string {
    return `$${this.amount.toFixed(2)}`;
  }
}
