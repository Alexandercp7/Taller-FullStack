import { AccountReceivableRepository } from '../../ports/repositories/account-receivable.repository';

export class ListAccountsReceivableUseCase {
  constructor(private readonly repo: AccountReceivableRepository) {}

  async execute() {
    const overdue = await this.repo.findOverdue();
    return overdue.map((a) => ({
      id: a.id,
      orderId: a.orderId,
      clientId: a.clientId,
      total: a.total.amount,
      paid: a.paid.amount,
      balance: a.balance.amount,
      status: a.status,
      dueDate: a.dueDate,
    }));
  }
}
