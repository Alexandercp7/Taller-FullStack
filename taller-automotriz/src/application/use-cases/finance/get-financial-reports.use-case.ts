import { CashEntryRepository } from '../../ports/repositories/cash-entry.repository';
import { AccountReceivableRepository } from '../../ports/repositories/account-receivable.repository';
import { AccountPayableRepository } from '../../ports/repositories/account-payable.repository';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';

interface GetReportsInput {
  from: Date;
  to: Date;
}

export class GetFinancialReportsUseCase {
  constructor(
    private readonly cashEntryRepo: CashEntryRepository,
    private readonly arRepo: AccountReceivableRepository,
    private readonly apRepo: AccountPayableRepository,
  ) {}

  async execute(input: GetReportsInput) {
    const [cashSummary, overdueAR, overdueAP] = await Promise.all([
      this.cashEntryRepo.getSummary(input.from, input.to),
      this.arRepo.findOverdue(),
      this.apRepo.findOverdue(),
    ]);

    return {
      cashSummary,
      overdueReceivables: overdueAR.map((ar) => ({
        id: ar.id,
        orderId: ar.orderId,
        clientId: ar.clientId,
        balance: ar.balance.amount,
        dueDate: ar.dueDate,
      })),
      overduePayables: overdueAP.map((ap) => ({
        id: ap.id,
        supplierId: ap.supplierId,
        description: ap.description,
        balance: ap.balance.amount,
        dueDate: ap.dueDate,
      })),
    };
  }
}
