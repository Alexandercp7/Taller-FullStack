import { describe, it, expect } from 'vitest';
import { AccountPayable } from '../../../../src/domain/entities/account-payable.entity';
import { Money } from '../../../../src/domain/value-objects/money.vo';
import { PaymentStatus } from '../../../../src/domain/enums/payment-status.enum';
import { PaymentExceedsBalanceError } from '../../../../src/domain/errors/payment-exceeds-balance.error';

function buildPayable(overrides: Partial<{ paid: number; status: PaymentStatus; dueDate: Date | null }> = {}): AccountPayable {
  const total = Money.fromAmount(1000);
  const paid = Money.fromAmount(overrides.paid ?? 0);
  const balance = total.subtract(paid);
  return new AccountPayable(
    'payable-1',
    'supplier-1',
    'Compra de refacciones',
    total,
    paid,
    balance,
    overrides.status ?? PaymentStatus.PENDING,
    overrides.dueDate ?? null,
  );
}

describe('AccountPayable', () => {
  it('expone los datos iniciales mediante getters', () => {
    const payable = buildPayable();

    expect(payable.description).toBe('Compra de refacciones');
    expect(payable.total.amount).toBe(1000);
    expect(payable.paid.amount).toBe(0);
    expect(payable.balance.amount).toBe(1000);
    expect(payable.status).toBe(PaymentStatus.PENDING);
    expect(payable.dueDate).toBeNull();
  });

  describe('registerPayment', () => {
    it('registra un pago parcial y actualiza el saldo y estatus', () => {
      const payable = buildPayable();

      payable.registerPayment(Money.fromAmount(400));

      expect(payable.paid.amount).toBe(400);
      expect(payable.balance.amount).toBe(600);
      expect(payable.status).toBe(PaymentStatus.PARTIAL);
    });

    it('registra un pago completo y marca como PAID', () => {
      const payable = buildPayable();

      payable.registerPayment(Money.fromAmount(1000));

      expect(payable.balance.amount).toBe(0);
      expect(payable.status).toBe(PaymentStatus.PAID);
    });

    it('lanza error si el pago excede el saldo pendiente', () => {
      const payable = buildPayable();

      expect(() => payable.registerPayment(Money.fromAmount(1500))).toThrow(PaymentExceedsBalanceError);
    });
  });

  describe('markOverdue', () => {
    it('marca como OVERDUE si no está pagada', () => {
      const payable = buildPayable({ status: PaymentStatus.PENDING });

      payable.markOverdue();

      expect(payable.status).toBe(PaymentStatus.OVERDUE);
    });

    it('no cambia el estatus si ya está PAID', () => {
      const payable = buildPayable({ paid: 1000, status: PaymentStatus.PAID });

      payable.markOverdue();

      expect(payable.status).toBe(PaymentStatus.PAID);
    });
  });

  it('setDueDate asigna la fecha límite', () => {
    const payable = buildPayable();
    const date = new Date('2026-07-01');

    payable.setDueDate(date);

    expect(payable.dueDate).toBe(date);
  });
});
