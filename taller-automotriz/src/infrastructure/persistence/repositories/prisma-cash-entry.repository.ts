import { PrismaClient } from '@prisma/client';
import { CashEntryRepository, CashSummary } from '../../../application/ports/repositories/cash-entry.repository';
import { CashEntry } from '../../../domain/entities/cash-entry.entity';
import { CashType } from '../../../domain/enums/cash-type.enum';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';
import { Money } from '../../../domain/value-objects/money.vo';

export class PrismaCashEntryRepository implements CashEntryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(entry: CashEntry): Promise<void> {
    await this.prisma.cashEntry.create({
      data: {
        id: entry.id,
        type: entry.type as any,
        amount: entry.amount.amount,
        description: entry.description,
        method: entry.method as any,
        orderId: entry.orderId,
        userId: entry.userId,
        date: entry.date,
      },
    });
  }

  async findByDateRange(from: Date, to: Date): Promise<CashEntry[]> {
    const items = await this.prisma.cashEntry.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: { date: 'desc' },
    });

    return items.map(
      (item) =>
        new CashEntry(
          item.id,
          item.type as CashType,
          Money.fromAmount(Number(item.amount)),
          item.description,
          item.method as PaymentMethod,
          item.orderId,
          item.userId,
          item.date,
        ),
    );
  }

  async getSummary(from: Date, to: Date): Promise<CashSummary> {
    const [income, expense] = await Promise.all([
      this.prisma.cashEntry.aggregate({
        where: { date: { gte: from, lte: to }, type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.cashEntry.aggregate({
        where: { date: { gte: from, lte: to }, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(income._sum.amount ?? 0);
    const totalExpense = Number(expense._sum.amount ?? 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }
}
