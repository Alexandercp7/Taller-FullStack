import { CashEntry } from '../../../domain/entities/cash-entry.entity';
import { CashType } from '../../../domain/enums/cash-type.enum';

export interface CashSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CashEntryRepository {
  save(entry: CashEntry): Promise<void>;
  findByDateRange(from: Date, to: Date): Promise<CashEntry[]>;
  getSummary(from: Date, to: Date): Promise<CashSummary>;
}
