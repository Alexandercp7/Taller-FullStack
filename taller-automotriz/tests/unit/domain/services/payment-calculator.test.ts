import { describe, it, expect } from 'vitest';
import { PaymentCalculator } from '../../../../src/domain/services/payment-calculator.service';
import { Money } from '../../../../src/domain/value-objects/money.vo';
import { PaymentStatus } from '../../../../src/domain/enums/payment-status.enum';
import { PaymentExceedsBalanceError } from '../../../../src/domain/errors/payment-exceeds-balance.error';

describe('PaymentCalculator', () => {
  describe('applyPayment', () => {
    it('retorna estatus PARTIAL cuando el pago no cubre el total', () => {
      const result = PaymentCalculator.applyPayment(
        Money.fromAmount(1000),
        Money.fromAmount(0),
        Money.fromAmount(400),
      );

      expect(result.newPaid.amount).toBe(400);
      expect(result.newBalance.amount).toBe(600);
      expect(result.newStatus).toBe(PaymentStatus.PARTIAL);
    });

    it('retorna estatus PAID cuando el pago liquida el saldo restante', () => {
      const result = PaymentCalculator.applyPayment(
        Money.fromAmount(1000),
        Money.fromAmount(600),
        Money.fromAmount(400),
      );

      expect(result.newBalance.amount).toBe(0);
      expect(result.newStatus).toBe(PaymentStatus.PAID);
    });

    it('lanza error si el pago excede el saldo pendiente', () => {
      expect(() =>
        PaymentCalculator.applyPayment(Money.fromAmount(1000), Money.fromAmount(800), Money.fromAmount(300)),
      ).toThrow(PaymentExceedsBalanceError);
    });
  });

  describe('isOverdue', () => {
    it('retorna false si no hay fecha límite', () => {
      expect(PaymentCalculator.isOverdue(null, PaymentStatus.PENDING)).toBe(false);
    });

    it('retorna false si el estatus ya es PAID', () => {
      expect(PaymentCalculator.isOverdue(new Date('2020-01-01'), PaymentStatus.PAID)).toBe(false);
    });

    it('retorna true si la fecha límite ya pasó y no está pagado', () => {
      expect(PaymentCalculator.isOverdue(new Date('2020-01-01'), PaymentStatus.PENDING)).toBe(true);
    });

    it('retorna false si la fecha límite es futura', () => {
      const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
      expect(PaymentCalculator.isOverdue(future, PaymentStatus.PENDING)).toBe(false);
    });
  });
});
