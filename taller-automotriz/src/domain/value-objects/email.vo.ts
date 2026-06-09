import { InvalidValueObjectError } from '../errors/invalid-value-object.error';

export class Email {
  private constructor(private readonly _value: string) {}

  static from(value: string): Email {
    const normalized = value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new InvalidValueObjectError('Email', 'formato inválido');
    }
    return new Email(normalized);
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }
}
