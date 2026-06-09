import { describe, it, expect } from 'vitest';
import { Money } from '../../../../src/domain/value-objects/money.vo';
import { InvalidValueObjectError } from '../../../../src/domain/errors/invalid-value-object.error';

describe('Money', () => {
  it('crea dinero desde un monto', () => {
    const m = Money.fromAmount(100);
    expect(m.amount).toBe(100);
  });

  it('no permite montos negativos', () => {
    expect(() => Money.fromAmount(-10)).toThrow(InvalidValueObjectError);
  });

  it('suma correctamente', () => {
    const a = Money.fromAmount(100);
    const b = Money.fromAmount(50);
    expect(a.add(b).amount).toBe(150);
  });

  it('resta correctamente', () => {
    const a = Money.fromAmount(100);
    const b = Money.fromAmount(30);
    expect(a.subtract(b).amount).toBe(70);
  });

  it('lanza error si la resta da negativo', () => {
    const a = Money.fromAmount(10);
    const b = Money.fromAmount(50);
    expect(() => a.subtract(b)).toThrow(InvalidValueObjectError);
  });

  it('aplica descuento correctamente', () => {
    const price = Money.fromAmount(100);
    const discounted = price.applyDiscount(15);
    expect(discounted.amount).toBe(85);
  });

  it('aplica impuesto correctamente', () => {
    const price = Money.fromAmount(100);
    const withTax = price.applyTax(16);
    expect(withTax.amount).toBe(116);
  });

  it('evita errores de punto flotante al sumar 0.1 + 0.2', () => {
    const a = Money.fromAmount(0.1);
    const b = Money.fromAmount(0.2);
    expect(a.add(b).amount).toBe(0.3);
  });

  it('multiplica correctamente', () => {
    const price = Money.fromAmount(15.5);
    const total = price.multiply(3);
    expect(total.amount).toBe(46.5);
  });
});
