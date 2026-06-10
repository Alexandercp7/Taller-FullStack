import { CashEntryRepository, CashSummary } from '../../src/application/ports/repositories/cash-entry.repository';
import { CashEntry } from '../../src/domain/entities/cash-entry.entity';
import { CashType } from '../../src/domain/enums/cash-type.enum';

export class InMemoryCashEntryRepository implements CashEntryRepository {
  store: CashEntry[] = [];

  async save(entry: CashEntry): Promise<void> {
    this.store.push(entry);
  }

  async findByDateRange(from: Date, to: Date): Promise<CashEntry[]> {
    return this.store.filter((e) => e.date >= from && e.date <= to);
  }

  async getSummary(from: Date, to: Date): Promise<CashSummary> {
    const entries = await this.findByDateRange(from, to);
    const totalIncome = entries.filter((e) => e.type === CashType.INCOME).reduce((sum, e) => sum + e.amount.amount, 0);
    const totalExpense = entries.filter((e) => e.type === CashType.EXPENSE).reduce((sum, e) => sum + e.amount.amount, 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }
}
