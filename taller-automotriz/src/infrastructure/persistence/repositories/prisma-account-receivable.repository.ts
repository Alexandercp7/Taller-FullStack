import { AccountReceivableRepository } from '../../../application/ports/repositories/account-receivable.repository';
import { AccountReceivable } from '../../../domain/entities/account-receivable.entity';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import { Money } from '../../../domain/value-objects/money.vo';
import { createId } from '../../../shared/identifier';
import { PrismaClientProvider } from '../prisma/prisma-client-provider';

export class PrismaAccountReceivableRepository implements AccountReceivableRepository {
  constructor(private readonly provider: PrismaClientProvider) {}

  private get db() {
    return this.provider.getClient();
  }

  private toDomain(raw: any): AccountReceivable {
    return new AccountReceivable(
      raw.id,
      raw.orderId,
      raw.clientId,
      Money.fromAmount(Number(raw.total)),
      Money.fromAmount(Number(raw.paid)),
      Money.fromAmount(Number(raw.balance)),
      raw.status as PaymentStatus,
      raw.dueDate,
    );
  }

  async findById(id: string): Promise<AccountReceivable | null> {
    const raw = await this.db.accountReceivable.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByOrderId(orderId: string): Promise<AccountReceivable | null> {
    const raw = await this.db.accountReceivable.findUnique({ where: { orderId } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByClientId(clientId: string): Promise<AccountReceivable[]> {
    const items = await this.db.accountReceivable.findMany({ where: { clientId } });
    return items.map(this.toDomain.bind(this));
  }

  async findOverdue(): Promise<AccountReceivable[]> {
    const items = await this.db.accountReceivable.findMany({
      where: { status: { in: ['OVERDUE'] } },
    });
    return items.map(this.toDomain.bind(this));
  }

  async save(account: AccountReceivable): Promise<void> {
    await this.db.accountReceivable.upsert({
      where: { id: account.id },
      create: {
        id: account.id,
        orderId: account.orderId,
        clientId: account.clientId,
        total: account.total.amount,
        paid: account.paid.amount,
        balance: account.balance.amount,
        status: account.status,
        dueDate: account.dueDate,
      },
      update: {
        paid: account.paid.amount,
        balance: account.balance.amount,
        status: account.status,
      },
    });
  }

  async savePayment(accountId: string, amount: number, method: string, userId: string): Promise<void> {
    await this.db.payment.create({
      data: {
        id: createId(),
        accountReceivableId: accountId,
        amount,
        method: method as any,
        userId,
      },
    });
  }
}
