import { InvalidValueObjectError } from '../errors/invalid-value-object.error';

export class OrderCode {
  private constructor(private readonly _value: string) {}

  static from(value: string): OrderCode {
    if (!/^(WO|OT)-\d{4,}$/.test(value)) {
      throw new InvalidValueObjectError('OrderCode', 'debe tener formato OT-#### (mínimo 4 dígitos)');
    }
    return new OrderCode(value);
  }

  static generate(sequential: number): OrderCode {
    const padded = String(sequential).padStart(4, '0');
    return new OrderCode(`OT-${padded}`);
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }
}
