import { describe, it, expect } from 'vitest';
import { OrderCode } from '../../../../src/domain/value-objects/order-code.vo';
import { InvalidValueObjectError } from '../../../../src/domain/errors/invalid-value-object.error';

describe('OrderCode', () => {
  it('crea un código válido a partir de un string', () => {
    const code = OrderCode.from('WO-0001');
    expect(code.value).toBe('WO-0001');
  });

  it('acepta códigos con más de 4 dígitos', () => {
    const code = OrderCode.from('WO-12345');
    expect(code.value).toBe('WO-12345');
  });

  it('genera un código con padding de 4 dígitos', () => {
    const code = OrderCode.generate(7);
    expect(code.value).toBe('OT-0007');
  });

  it('genera un código sin padding adicional si el número ya tiene 4+ dígitos', () => {
    const code = OrderCode.generate(12345);
    expect(code.value).toBe('OT-12345');
  });

  it('toString retorna el valor', () => {
    const code = OrderCode.from('WO-0099');
    expect(code.toString()).toBe('WO-0099');
  });

  it('lanza error si no tiene el prefijo WO-', () => {
    expect(() => OrderCode.from('AB-0001')).toThrow(InvalidValueObjectError);
  });

  it('lanza error si tiene menos de 4 dígitos', () => {
    expect(() => OrderCode.from('WO-001')).toThrow(InvalidValueObjectError);
  });

  it('lanza error con cadena vacía', () => {
    expect(() => OrderCode.from('')).toThrow(InvalidValueObjectError);
  });
});
