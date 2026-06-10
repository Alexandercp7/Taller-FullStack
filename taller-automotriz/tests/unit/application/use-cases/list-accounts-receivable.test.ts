import { describe, it, expect } from 'vitest';
import { ListAccountsReceivableUseCase } from '../../../../src/application/use-cases/finance/list-accounts-receivable.use-case';
import { InMemoryAccountReceivableRepository } from '../../../helpers/in-memory-account-receivable.repository';
import { AccountReceivable } from '../../../../src/domain/entities/account-receivable.entity';
import { Money } from '../../../../src/domain/value-objects/money.vo';
import { PaymentStatus } from '../../../../src/domain/enums/payment-status.enum';

function buildAccount(overrides: Partial<{ id: string; dueDate: Date | null; status: PaymentStatus }> = {}): AccountReceivable {
  return new AccountReceivable(
    overrides.id ?? 'ar-1',
    'order-1',
    'client-1',
    Money.fromAmount(1000),
    Money.fromAmount(200),
    Money.fromAmount(800),
    overrides.status ?? PaymentStatus.OVERDUE,
    overrides.dueDate ?? new Date('2020-01-01'),
  );
}

describe('ListAccountsReceivableUseCase', () => {
  it('mapea las cuentas vencidas a un DTO plano', async () => {
    const repo = new InMemoryAccountReceivableRepository([buildAccount()]);
    const useCase = new ListAccountsReceivableUseCase(repo);

    const result = await useCase.execute();

    expect(result).toEqual([
      {
        id: 'ar-1',
        orderId: 'order-1',
        clientId: 'client-1',
        total: 1000,
        paid: 200,
        balance: 800,
        status: PaymentStatus.OVERDUE,
        dueDate: new Date('2020-01-01'),
      },
    ]);
  });

  it('retorna un arreglo vacío si no hay cuentas vencidas', async () => {
    const repo = new InMemoryAccountReceivableRepository([]);
    const useCase = new ListAccountsReceivableUseCase(repo);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
