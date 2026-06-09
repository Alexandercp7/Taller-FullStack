import { InvalidValueObjectError } from '../errors/invalid-value-object.error';

export class VIN {
  private constructor(private readonly _value: string) {}

  static from(value: string): VIN {
    const clean = value.trim().toUpperCase();
    if (clean.length < 6) {
      throw new InvalidValueObjectError('VIN', 'debe tener al menos 6 caracteres');
    }
    if (clean.length !== 17 && clean.length !== 11 && clean.length < 6) {
      throw new InvalidValueObjectError('VIN', 'longitud inválida (6, 11 o 17 caracteres)');
    }
    return new VIN(clean);
  }

  get value(): string {
    return this._value;
  }

  get isFullVin(): boolean {
    return this._value.length === 17;
  }

  toString(): string {
    return this._value;
  }
}
