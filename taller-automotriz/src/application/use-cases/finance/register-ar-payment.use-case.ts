import { AccountReceivableRepository } from '../../ports/repositories/account-receivable.repository';
import { CashEntryRepository } from '../../ports/repositories/cash-entry.repository';
import { UnitOfWork } from '../../ports/unit-of-work.port';
import { Money } from '../../../domain/value-objects/money.vo';
import { CashEntry } from '../../../domain/entities/cash-entry.entity';
import { CashType } from '../../../domain/enums/cash-type.enum';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';
import { createId } from '../../../shared/identifier';

interface RegisterARPaymentInput {
  accountId: string;
  amount: number;
  method: PaymentMethod;
  userId: string;
  notes?: string;
}

export class RegisterARPaymentUseCase {
  constructor(
    private readonly arRepo: AccountReceivableRepository,
    private readonly cashEntryRepo: CashEntryRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: RegisterARPaymentInput): Promise<void> {
    const account = await this.arRepo.findById(input.accountId);
    if (!account) throw new Error('Cuenta por cobrar no encontrada');

    const amount = Money.fromAmount(input.amount);
    account.registerPayment(amount, account.clientId);

    const cashEntry = new CashEntry(
      createId(),
      CashType.INCOME,
      amount,
      `Pago CxC - Orden ${account.orderId}`,
      input.method,
      account.orderId,
      input.userId,
      new Date(),
    );

    await this.unitOfWork.execute(async () => {
      await this.arRepo.save(account);
      await this.arRepo.savePayment(input.accountId, input.amount, input.method, input.userId);
      await this.cashEntryRepo.save(cashEntry);
    }, [account]);
  }
}
