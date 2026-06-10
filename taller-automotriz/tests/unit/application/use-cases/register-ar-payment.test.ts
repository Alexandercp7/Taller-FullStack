import { describe, it, expect, beforeEach } from 'vitest';
import { RegisterARPaymentUseCase } from '../../../../src/application/use-cases/finance/register-ar-payment.use-case';
import { InMemoryAccountReceivableRepository } from '../../../helpers/in-memory-account-receivable.repository';
import { InMemoryCashEntryRepository } from '../../../helpers/in-memory-cash-entry.repository';
import { FakeUnitOfWork } from '../../../helpers/fakes';
import { AccountReceivable } from '../../../../src/domain/entities/account-receivable.entity';
import { Money } from '../../../../src/domain/value-objects/money.vo';
import { PaymentStatus } from '../../../../src/domain/enums/payment-status.enum';
import { PaymentMethod } from '../../../../src/domain/enums/payment-method.enum';
import { CashType } from '../../../../src/domain/enums/cash-type.enum';
import { PaymentExceedsBalanceError } from '../../../../src/domain/errors/payment-exceeds-balance.error';

function buildAccount(): AccountReceivable {
  return new AccountReceivable(
    'ar-1',
    'order-1',
    'client-1',
    Money.fromAmount(1000),
    Money.zero(),
    Money.fromAmount(1000),
    PaymentStatus.PENDING,
    null,
  );
}

describe('RegisterARPaymentUseCase', () => {
  let arRepo: InMemoryAccountReceivableRepository;
  let cashEntryRepo: InMemoryCashEntryRepository;
  let useCase: RegisterARPaymentUseCase;

  beforeEach(() => {
    arRepo = new InMemoryAccountReceivableRepository([buildAccount()]);
    cashEntryRepo = new InMemoryCashEntryRepository();
    useCase = new RegisterARPaymentUseCase(arRepo, cashEntryRepo, new FakeUnitOfWork());
  });

  it('registra un pago parcial y actualiza la cuenta por cobrar', async () => {
    await useCase.execute({ accountId: 'ar-1', amount: 400, method: PaymentMethod.CASH, userId: 'user-1' });

    const account = await arRepo.findById('ar-1');
    expect(account?.paid.amount).toBe(400);
    expect(account?.balance.amount).toBe(600);
    expect(account?.status).toBe(PaymentStatus.PARTIAL);
  });

  it('registra el pago en el historial del repositorio', async () => {
    await useCase.execute({ accountId: 'ar-1', amount: 400, method: PaymentMethod.CASH, userId: 'user-1' });

    expect(arRepo.payments).toHaveLength(1);
    expect(arRepo.payments[0]).toEqual({ accountId: 'ar-1', amount: 400, method: PaymentMethod.CASH, userId: 'user-1' });
  });

  it('crea una entrada de caja de tipo ingreso por el pago', async () => {
    await useCase.execute({ accountId: 'ar-1', amount: 400, method: PaymentMethod.TRANSFER, userId: 'user-1' });

    expect(cashEntryRepo.store).toHaveLength(1);
    expect(cashEntryRepo.store[0].type).toBe(CashType.INCOME);
    expect(cashEntryRepo.store[0].amount.amount).toBe(400);
    expect(cashEntryRepo.store[0].orderId).toBe('order-1');
  });

  it('lanza error si la cuenta no existe', async () => {
    await expect(
      useCase.execute({ accountId: 'no-existe', amount: 100, method: PaymentMethod.CASH, userId: 'user-1' }),
    ).rejects.toThrow('Cuenta por cobrar no encontrada');
  });

  it('lanza error si el pago excede el saldo pendiente', async () => {
    await expect(
      useCase.execute({ accountId: 'ar-1', amount: 1500, method: PaymentMethod.CASH, userId: 'user-1' }),
    ).rejects.toThrow(PaymentExceedsBalanceError);
  });
});
