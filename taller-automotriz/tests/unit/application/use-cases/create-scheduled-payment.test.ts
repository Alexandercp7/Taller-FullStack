import { describe, it, expect, beforeEach } from 'vitest';
import { CreateScheduledPaymentUseCase } from '../../../../src/application/use-cases/payments/create-scheduled-payment.use-case';
import { InMemoryScheduledPaymentRepository } from '../../../helpers/in-memory-scheduled-payment.repository';
import { CashType } from '../../../../src/domain/enums/cash-type.enum';
import { PaymentStatus } from '../../../../src/domain/enums/payment-status.enum';

describe('CreateScheduledPaymentUseCase', () => {
  let repo: InMemoryScheduledPaymentRepository;
  let useCase: CreateScheduledPaymentUseCase;

  beforeEach(() => {
    repo = new InMemoryScheduledPaymentRepository();
    useCase = new CreateScheduledPaymentUseCase(repo);
  });

  it('crea un pago programado con estado PENDING', async () => {
    const result = await useCase.execute({
      description: 'Pago a proveedor',
      amount: 1500,
      dueDate: new Date('2026-07-01'),
      type: CashType.EXPENSE,
      supplierId: 'supplier-1',
    });

    const saved = await repo.findById(result.id);
    expect(saved).not.toBeNull();
    expect(saved?.status).toBe(PaymentStatus.PENDING);
    expect(saved?.description).toBe('Pago a proveedor');
    expect(saved?.amount.amount).toBe(1500);
    expect(saved?.supplierId).toBe('supplier-1');
    expect(saved?.clientId).toBeNull();
  });

  it('asigna clientId y notas cuando se proporcionan', async () => {
    const result = await useCase.execute({
      description: 'Cobro a cliente',
      amount: 800,
      dueDate: new Date('2026-08-01'),
      type: CashType.INCOME,
      clientId: 'client-1',
      notes: 'Pago en abonos',
    });

    const saved = await repo.findById(result.id);
    expect(saved?.clientId).toBe('client-1');
    expect(saved?.supplierId).toBeNull();
    expect(saved?.notes).toBe('Pago en abonos');
  });
});
