import { CashEntryRepository } from '../../ports/repositories/cash-entry.repository';

interface ListCashEntriesInput {
  from: Date;
  to: Date;
}

export class ListCashEntriesUseCase {
  constructor(private readonly repo: CashEntryRepository) {}

  async execute(input: ListCashEntriesInput) {
    const entries = await this.repo.findByDateRange(input.from, input.to);
    return entries.map((e) => ({
      id: e.id,
      type: e.type,
      amount: e.amount.amount,
      description: e.description,
      method: e.method,
      orderId: e.orderId,
      userId: e.userId,
      date: e.date,
    }));
  }
}
