import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateScheduledPaymentUseCase } from '../../../../src/application/use-cases/payments/update-scheduled-payment.use-case';
import { InMemoryScheduledPaymentRepository } from '../../../helpers/in-memory-scheduled-payment.repository';
import { ScheduledPayment } from '../../../../src/domain/entities/scheduled-payment.entity';
import { PaymentStatus } from '../../../../src/domain/enums/payment-status.enum';
import { CashType } from '../../../../src/domain/enums/cash-type.enum';
import { Money } from '../../../../src/domain/value-objects/money.vo';

describe('UpdateScheduledPaymentUseCase', () => {
  let repo: InMemoryScheduledPaymentRepository;
  let useCase: UpdateScheduledPaymentUseCase;

  beforeEach(() => {
    const payment = new ScheduledPayment(
      'payment-1',
      'Pago original',
      Money.fromAmount(1000),
      new Date('2026-07-01'),
      PaymentStatus.PENDING,
      CashType.EXPENSE,
      'supplier-1',
      null,
      null,
      'nota original',
    );
    repo = new InMemoryScheduledPaymentRepository([payment]);
    useCase = new UpdateScheduledPaymentUseCase(repo);
  });

  it('actualiza la descripción, monto, fecha y notas', async () => {
    await useCase.execute({
      id: 'payment-1',
      description: 'Pago actualizado',
      amount: 2000,
      dueDate: new Date('2026-08-01'),
      notes: 'nota nueva',
    });

    const saved = await repo.findById('payment-1');
    expect(saved?.description).toBe('Pago actualizado');
    expect(saved?.amount.amount).toBe(2000);
    expect(saved?.dueDate).toEqual(new Date('2026-08-01'));
    expect(saved?.notes).toBe('nota nueva');
  });

  it('mantiene los valores originales para campos no proporcionados', async () => {
    await useCase.execute({ id: 'payment-1', description: 'Solo descripción' });

    const saved = await repo.findById('payment-1');
    expect(saved?.description).toBe('Solo descripción');
    expect(saved?.amount.amount).toBe(1000);
    expect(saved?.notes).toBe('nota original');
  });

  it('lanza error si el pago programado no existe', async () => {
    await expect(useCase.execute({ id: 'no-existe', description: 'X' })).rejects.toThrow(
      'Pago programado no encontrado',
    );
  });
});
