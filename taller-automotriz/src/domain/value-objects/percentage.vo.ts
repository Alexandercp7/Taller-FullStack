import { InvalidValueObjectError } from '../errors/invalid-value-object.error';

export class Percentage {
  private constructor(private readonly _value: number) {}

  static from(value: number): Percentage {
    if (value < 0 || value > 100) {
      throw new InvalidValueObjectError('Percentage', 'debe estar entre 0 y 100');
    }
    return new Percentage(value);
  }

  get value(): number {
    return this._value;
  }

  toString(): string {
    return `${this._value}%`;
  }
}
