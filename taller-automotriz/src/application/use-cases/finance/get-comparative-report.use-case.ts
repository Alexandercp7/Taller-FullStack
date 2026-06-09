import { CashEntryRepository } from '../../ports/repositories/cash-entry.repository';

export class GetComparativeReportUseCase {
  constructor(private readonly cashEntryRepo: CashEntryRepository) {}

  async execute(monthsBack = 6) {
    const results: Array<{ mes: string; label: string; ingresos: number; egresos: number }> = [];
    const now = new Date();

    for (let i = monthsBack - 1; i >= 0; i--) {
      const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const summary = await this.cashEntryRepo.getSummary(from, to);
      const label = from.toLocaleString('es-MX', { month: 'short', year: 'numeric' });
      results.push({
        mes: from.toISOString().slice(0, 7),
        label,
        ingresos: summary.totalIncome,
        egresos: summary.totalExpense,
      });
    }

    return results;
  }
}
