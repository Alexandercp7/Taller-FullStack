import { describe, it, expect } from 'vitest';
import { AccountReceivable } from '../../../../src/domain/entities/account-receivable.entity';
import { Money } from '../../../../src/domain/value-objects/money.vo';
import { PaymentStatus } from '../../../../src/domain/enums/payment-status.enum';
import { PaymentExceedsBalanceError } from '../../../../src/domain/errors/payment-exceeds-balance.error';
import { PaymentRegistered } from '../../../../src/domain/events/payment-registered.event';

function buildReceivable(overrides: Partial<{ paid: number; status: PaymentStatus; dueDate: Date | null }> = {}): AccountReceivable {
  const total = Money.fromAmount(1000);
  const paid = Money.fromAmount(overrides.paid ?? 0);
  const balance = total.subtract(paid);
  return new AccountReceivable(
    'receivable-1',
    'order-1',
    'client-1',
    total,
    paid,
    balance,
    overrides.status ?? PaymentStatus.PENDING,
    overrides.dueDate ?? null,
  );
}

describe('AccountReceivable', () => {
  it('expone los datos iniciales mediante getters', () => {
    const receivable = buildReceivable();

    expect(receivable.total.amount).toBe(1000);
    expect(receivable.paid.amount).toBe(0);
    expect(receivable.balance.amount).toBe(1000);
    expect(receivable.status).toBe(PaymentStatus.PENDING);
    expect(receivable.domainEvents).toHaveLength(0);
  });

  describe('registerPayment', () => {
    it('registra un pago parcial y actualiza el saldo y estatus', () => {
      const receivable = buildReceivable();

      receivable.registerPayment(Money.fromAmount(400), 'client-1');

      expect(receivable.paid.amount).toBe(400);
      expect(receivable.balance.amount).toBe(600);
      expect(receivable.status).toBe(PaymentStatus.PARTIAL);
    });

    it('emite PaymentRegistered con isPaid=false en pago parcial', () => {
      const receivable = buildReceivable();

      receivable.registerPayment(Money.fromAmount(400), 'client-1');

      expect(receivable.domainEvents).toHaveLength(1);
      const event = receivable.domainEvents[0] as PaymentRegistered;
      expect(event).toBeInstanceOf(PaymentRegistered);
      expect(event.isPaid).toBe(false);
    });

    it('emite PaymentRegistered con isPaid=true cuando se liquida el saldo', () => {
      const receivable = buildReceivable();

      receivable.registerPayment(Money.fromAmount(1000), 'client-1');

      expect(receivable.status).toBe(PaymentStatus.PAID);
      const event = receivable.domainEvents[0] as PaymentRegistered;
      expect(event.isPaid).toBe(true);
    });

    it('lanza error si el pago excede el saldo pendiente', () => {
      const receivable = buildReceivable();

      expect(() => receivable.registerPayment(Money.fromAmount(1500), 'client-1')).toThrow(
        PaymentExceedsBalanceError,
      );
    });
  });

  describe('markOverdue', () => {
    it('marca como OVERDUE si no está pagada', () => {
      const receivable = buildReceivable({ status: PaymentStatus.PENDING });

      receivable.markOverdue();

      expect(receivable.status).toBe(PaymentStatus.OVERDUE);
    });

    it('no cambia el estatus si ya está PAID', () => {
      const receivable = buildReceivable({ paid: 1000, status: PaymentStatus.PAID });

      receivable.markOverdue();

      expect(receivable.status).toBe(PaymentStatus.PAID);
    });
  });

  it('setDueDate asigna la fecha límite', () => {
    const receivable = buildReceivable();
    const date = new Date('2026-07-01');

    receivable.setDueDate(date);

    expect(receivable.dueDate).toBe(date);
  });

  it('clearEvents vacía los eventos de dominio acumulados', () => {
    const receivable = buildReceivable();
    receivable.registerPayment(Money.fromAmount(100), 'client-1');

    receivable.clearEvents();

    expect(receivable.domainEvents).toHaveLength(0);
  });
});
