import { InvalidValueObjectError } from '../errors/invalid-value-object.error';

export class Phone {
  private constructor(private readonly _value: string) {}

  static from(value: string): Phone {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) {
      throw new InvalidValueObjectError('Phone', 'debe tener entre 10 y 13 dígitos');
    }
    return new Phone(digits);
  }

  get value(): string {
    return this._value;
  }

  get formatted(): string {
    if (this._value.length === 10) {
      return `(${this._value.slice(0, 3)}) ${this._value.slice(3, 6)}-${this._value.slice(6)}`;
    }
    return this._value;
  }

  toString(): string {
    return this._value;
  }
}
