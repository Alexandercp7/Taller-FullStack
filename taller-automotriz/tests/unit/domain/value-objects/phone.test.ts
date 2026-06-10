import { describe, it, expect } from 'vitest';
import { Phone } from '../../../../src/domain/value-objects/phone.vo';
import { InvalidValueObjectError } from '../../../../src/domain/errors/invalid-value-object.error';

describe('Phone', () => {
  it('crea un teléfono a partir de 10 dígitos', () => {
    const phone = Phone.from('5512345678');
    expect(phone.value).toBe('5512345678');
  });

  it('elimina caracteres no numéricos', () => {
    const phone = Phone.from('(55) 1234-5678');
    expect(phone.value).toBe('5512345678');
  });

  it('acepta números con código de país (13 dígitos)', () => {
    const phone = Phone.from('+52 55 1234 5678 9');
    expect(phone.value).toBe('5255123456789');
  });

  it('formatea un número de 10 dígitos como (XXX) XXX-XXXX', () => {
    const phone = Phone.from('5512345678');
    expect(phone.formatted).toBe('(551) 234-5678');
  });

  it('formatted retorna el valor crudo si no tiene 10 dígitos', () => {
    const phone = Phone.from('52551234567');
    expect(phone.formatted).toBe('52551234567');
  });

  it('toString retorna el valor sin formato', () => {
    const phone = Phone.from('5512345678');
    expect(phone.toString()).toBe('5512345678');
  });

  it('lanza error si tiene menos de 10 dígitos', () => {
    expect(() => Phone.from('123456789')).toThrow(InvalidValueObjectError);
  });

  it('lanza error si tiene más de 13 dígitos', () => {
    expect(() => Phone.from('12345678901234')).toThrow(InvalidValueObjectError);
  });

  it('lanza error con cadena vacía', () => {
    expect(() => Phone.from('')).toThrow(InvalidValueObjectError);
  });
});
