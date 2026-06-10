import { describe, it, expect } from 'vitest';
import { Percentage } from '../../../../src/domain/value-objects/percentage.vo';
import { InvalidValueObjectError } from '../../../../src/domain/errors/invalid-value-object.error';

describe('Percentage', () => {
  it('crea un porcentaje válido', () => {
    const p = Percentage.from(15);
    expect(p.value).toBe(15);
  });

  it('acepta el límite inferior (0)', () => {
    const p = Percentage.from(0);
    expect(p.value).toBe(0);
  });

  it('acepta el límite superior (100)', () => {
    const p = Percentage.from(100);
    expect(p.value).toBe(100);
  });

  it('toString agrega el símbolo %', () => {
    const p = Percentage.from(16);
    expect(p.toString()).toBe('16%');
  });

  it('lanza error si es negativo', () => {
    expect(() => Percentage.from(-1)).toThrow(InvalidValueObjectError);
  });

  it('lanza error si es mayor a 100', () => {
    expect(() => Percentage.from(101)).toThrow(InvalidValueObjectError);
  });
});
