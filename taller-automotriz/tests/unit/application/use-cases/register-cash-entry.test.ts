import { describe, it, expect } from 'vitest';
import { RegisterCashEntryUseCase } from '../../../../src/application/use-cases/finance/register-cash-entry.use-case';
import { InMemoryCashEntryRepository } from '../../../helpers/in-memory-cash-entry.repository';
import { CashType } from '../../../../src/domain/enums/cash-type.enum';
import { PaymentMethod } from '../../../../src/domain/enums/payment-method.enum';

describe('RegisterCashEntryUseCase', () => {
  it('registra un ingreso en caja', async () => {
    const repo = new InMemoryCashEntryRepository();
    const useCase = new RegisterCashEntryUseCase(repo);

    const result = await useCase.execute({
      type: CashType.INCOME,
      amount: 500,
      description: 'Pago de servicio',
      method: PaymentMethod.CASH,
      userId: 'user-1',
    });

    expect(result.id).toBeTruthy();
    expect(repo.store).toHaveLength(1);
    expect(repo.store[0].amount.amount).toBe(500);
    expect(repo.store[0].type).toBe(CashType.INCOME);
    expect(repo.store[0].orderId).toBeNull();
  });

  it('registra un egreso asociado a una orden', async () => {
    const repo = new InMemoryCashEntryRepository();
    const useCase = new RegisterCashEntryUseCase(repo);

    await useCase.execute({
      type: CashType.EXPENSE,
      amount: 200,
      description: 'Compra de refacciones',
      method: PaymentMethod.TRANSFER,
      orderId: 'order-1',
      userId: 'user-1',
    });

    expect(repo.store[0].type).toBe(CashType.EXPENSE);
    expect(repo.store[0].orderId).toBe('order-1');
  });

  it('usa la fecha provista si se especifica', async () => {
    const repo = new InMemoryCashEntryRepository();
    const useCase = new RegisterCashEntryUseCase(repo);
    const date = new Date('2026-01-15');

    await useCase.execute({
      type: CashType.INCOME,
      amount: 100,
      description: 'Ingreso',
      method: PaymentMethod.CASH,
      userId: 'user-1',
      date,
    });

    expect(repo.store[0].date).toBe(date);
  });
});
