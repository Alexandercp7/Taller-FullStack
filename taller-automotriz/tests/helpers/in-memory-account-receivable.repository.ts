import { AccountReceivableRepository } from '../../src/application/ports/repositories/account-receivable.repository';
import { AccountReceivable } from '../../src/domain/entities/account-receivable.entity';

export class InMemoryAccountReceivableRepository implements AccountReceivableRepository {
  private store: AccountReceivable[];
  payments: Array<{ accountId: string; amount: number; method: string; userId: string }> = [];

  constructor(initial: AccountReceivable[] = []) {
    this.store = [...initial];
  }

  async findById(id: string): Promise<AccountReceivable | null> {
    return this.store.find((a) => a.id === id) ?? null;
  }

  async findByOrderId(orderId: string): Promise<AccountReceivable | null> {
    return this.store.find((a) => a.orderId === orderId) ?? null;
  }

  async findByClientId(clientId: string): Promise<AccountReceivable[]> {
    return this.store.filter((a) => a.clientId === clientId);
  }

  async findOverdue(): Promise<AccountReceivable[]> {
    return this.store.filter((a) => a.dueDate !== null && a.dueDate < new Date());
  }

  async save(account: AccountReceivable): Promise<void> {
    const idx = this.store.findIndex((a) => a.id === account.id);
    if (idx >= 0) this.store[idx] = account;
    else this.store.push(account);
  }

  async savePayment(accountId: string, amount: number, method: string, userId: string): Promise<void> {
    this.payments.push({ accountId, amount, method, userId });
  }
}
