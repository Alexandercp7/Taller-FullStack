import { ClientRepository } from '../../src/application/ports/repositories/client.repository';
import { Client } from '../../src/domain/entities/client.entity';

export class InMemoryClientRepository implements ClientRepository {
  private store: Client[];
  activeOrdersByClient = new Map<string, boolean>();
  ordersCountByClient = new Map<string, number>();
  pendingDebtByClient = new Map<string, boolean>();

  constructor(initial: Client[] = []) {
    this.store = [...initial];
  }

  async findById(id: string): Promise<Client | null> {
    return this.store.find((c) => c.id === id) ?? null;
  }

  async findByPhone(phone: string): Promise<Client | null> {
    return this.store.find((c) => c.phone === phone) ?? null;
  }

  async findByNameOrPhone(query: string, page: number, pageSize: number): Promise<{ data: Client[]; total: number }> {
    const data = this.store.filter(
      (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query),
    );
    return { data, total: data.length };
  }

  async save(client: Client): Promise<void> {
    const idx = this.store.findIndex((c) => c.id === client.id);
    if (idx >= 0) this.store[idx] = client;
    else this.store.push(client);
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((c) => c.id !== id);
  }

  async hasActiveOrders(clientId: string): Promise<boolean> {
    return this.activeOrdersByClient.get(clientId) ?? false;
  }

  async countOrders(clientId: string): Promise<number> {
    return this.ordersCountByClient.get(clientId) ?? 0;
  }

  async hasPendingDebt(clientId: string): Promise<boolean> {
    return this.pendingDebtByClient.get(clientId) ?? false;
  }
}
