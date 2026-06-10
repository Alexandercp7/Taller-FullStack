import { describe, it, expect, vi, afterEach } from 'vitest';
import { ScheduledPayment } from '../../../../src/domain/entities/scheduled-payment.entity';
import { Money } from '../../../../src/domain/value-objects/money.vo';
import { PaymentStatus } from '../../../../src/domain/enums/payment-status.enum';
import { CashType } from '../../../../src/domain/enums/cash-type.enum';

function buildPayment(overrides: Partial<{ status: PaymentStatus; dueDate: Date }> = {}): ScheduledPayment {
  return new ScheduledPayment(
    'payment-1',
    'Pago a proveedor',
    Money.fromAmount(500),
    overrides.dueDate ?? new Date('2026-06-15'),
    overrides.status ?? PaymentStatus.PENDING,
    CashType.EXPENSE,
    'supplier-1',
    null,
    null,
    null,
  );
}

describe('ScheduledPayment', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('expone los datos iniciales mediante getters', () => {
    const payment = buildPayment();

    expect(payment.description).toBe('Pago a proveedor');
    expect(payment.amount.amount).toBe(500);
    expect(payment.dueDate).toEqual(new Date('2026-06-15'));
    expect(payment.status).toBe(PaymentStatus.PENDING);
    expect(payment.supplierId).toBe('supplier-1');
    expect(payment.clientId).toBeNull();
    expect(payment.calendarEventId).toBeNull();
    expect(payment.notes).toBeNull();
  });

  it('markPaid cambia el estatus a PAID', () => {
    const payment = buildPayment();

    payment.markPaid();

    expect(payment.status).toBe(PaymentStatus.PAID);
  });

  describe('detectOverdue', () => {
    it('retorna false y no cambia estatus si ya está pagado', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-01'));

      const payment = buildPayment({ status: PaymentStatus.PAID, dueDate: new Date('2026-06-01') });

      expect(payment.detectOverdue()).toBe(false);
      expect(payment.status).toBe(PaymentStatus.PAID);
    });

    it('retorna true y marca OVERDUE si la fecha límite ya pasó', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-01'));

      const payment = buildPayment({ status: PaymentStatus.PENDING, dueDate: new Date('2026-06-01') });

      expect(payment.detectOverdue()).toBe(true);
      expect(payment.status).toBe(PaymentStatus.OVERDUE);
    });

    it('retorna false si la fecha límite no ha pasado', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-01'));

      const payment = buildPayment({ status: PaymentStatus.PENDING, dueDate: new Date('2026-07-01') });

      expect(payment.detectOverdue()).toBe(false);
      expect(payment.status).toBe(PaymentStatus.PENDING);
    });
  });

  it('attachCalendarEvent asigna el id del evento de calendario', () => {
    const payment = buildPayment();

    payment.attachCalendarEvent('cal-event-1');

    expect(payment.calendarEventId).toBe('cal-event-1');
  });

  describe('update', () => {
    it('actualiza solo los campos provistos', () => {
      const payment = buildPayment();

      payment.update({ description: 'Pago actualizado', amount: Money.fromAmount(750) });

      expect(payment.description).toBe('Pago actualizado');
      expect(payment.amount.amount).toBe(750);
      expect(payment.dueDate).toEqual(new Date('2026-06-15'));
    });

    it('permite actualizar la fecha límite y notas', () => {
      const payment = buildPayment();
      const newDate = new Date('2026-08-01');

      payment.update({ dueDate: newDate, notes: 'Pago reagendado' });

      expect(payment.dueDate).toBe(newDate);
      expect(payment.notes).toBe('Pago reagendado');
    });
  });
});
