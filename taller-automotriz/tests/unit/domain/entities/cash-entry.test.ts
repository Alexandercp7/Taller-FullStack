import { describe, it, expect } from 'vitest';
import { CashEntry } from '../../../../src/domain/entities/cash-entry.entity';
import { Money } from '../../../../src/domain/value-objects/money.vo';
import { CashType } from '../../../../src/domain/enums/cash-type.enum';
import { PaymentMethod } from '../../../../src/domain/enums/payment-method.enum';
import { InvalidValueObjectError } from '../../../../src/domain/errors/invalid-value-object.error';

function buildEntry(amount = 100): CashEntry {
  return new CashEntry(
    'entry-1',
    CashType.INCOME,
    Money.fromAmount(amount),
    'Pago de orden WO-0001',
    PaymentMethod.CASH,
    'order-1',
    'user-1',
    new Date('2026-06-01'),
  );
}

describe('CashEntry', () => {
  it('expone los datos iniciales mediante getters', () => {
    const entry = buildEntry(250);

    expect(entry.type).toBe(CashType.INCOME);
    expect(entry.amount.amount).toBe(250);
    expect(entry.description).toBe('Pago de orden WO-0001');
    expect(entry.method).toBe(PaymentMethod.CASH);
    expect(entry.orderId).toBe('order-1');
    expect(entry.userId).toBe('user-1');
    expect(entry.date).toEqual(new Date('2026-06-01'));
  });

  it('permite orderId nulo (movimiento sin orden asociada)', () => {
    const entry = new CashEntry(
      'entry-2',
      CashType.EXPENSE,
      Money.fromAmount(50),
      'Compra de insumos',
      PaymentMethod.TRANSFER,
      null,
      'user-1',
      new Date('2026-06-01'),
    );

    expect(entry.orderId).toBeNull();
    expect(entry.type).toBe(CashType.EXPENSE);
  });

  it('lanza error si el monto es cero', () => {
    expect(
      () =>
        new CashEntry(
          'entry-3',
          CashType.INCOME,
          Money.zero(),
          'Movimiento inválido',
          PaymentMethod.CASH,
          null,
          'user-1',
          new Date('2026-06-01'),
        ),
    ).toThrow(InvalidValueObjectError);
  });
});
