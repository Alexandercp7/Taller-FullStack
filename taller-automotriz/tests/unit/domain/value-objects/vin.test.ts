import { describe, it, expect } from 'vitest';
import { VIN } from '../../../../src/domain/value-objects/vin.vo';
import { InvalidValueObjectError } from '../../../../src/domain/errors/invalid-value-object.error';

describe('VIN', () => {
  it('crea un VIN completo de 17 caracteres', () => {
    const vin = VIN.from('1HGCM82633A004352');
    expect(vin.value).toBe('1HGCM82633A004352');
    expect(vin.isFullVin).toBe(true);
  });

  it('normaliza a mayúsculas y elimina espacios', () => {
    const vin = VIN.from('  1hgcm82633a004352  ');
    expect(vin.value).toBe('1HGCM82633A004352');
  });

  it('isFullVin es false si no tiene 17 caracteres', () => {
    const vin = VIN.from('ABC123');
    expect(vin.isFullVin).toBe(false);
  });

  it('toString retorna el valor normalizado', () => {
    const vin = VIN.from('abc123');
    expect(vin.toString()).toBe('ABC123');
  });

  it('lanza error si tiene menos de 6 caracteres', () => {
    expect(() => VIN.from('ABC12')).toThrow(InvalidValueObjectError);
  });

  it('lanza error con cadena vacía', () => {
    expect(() => VIN.from('')).toThrow(InvalidValueObjectError);
  });

  // Nota: la validación actual solo exige >= 6 caracteres; la segunda condición
  // (longitud !== 17 && !== 11 && < 6) nunca se cumple porque ya se valida < 6 antes.
  // Esto significa que VINs de longitudes "raras" (ej. 7, 12, 20 caracteres) son
  // aceptados aunque no sean 6, 11 o 17. Documentado como hallazgo en TESTING.md.
  it('acepta longitudes distintas de 6, 11 o 17 si tienen al menos 6 caracteres (comportamiento actual)', () => {
    const vin = VIN.from('ABCDEFG');
    expect(vin.value).toBe('ABCDEFG');
    expect(vin.isFullVin).toBe(false);
  });
});
