import { OrderRepository } from '../../src/application/ports/repositories/order.repository';
import { WorkOrder } from '../../src/domain/entities/work-order.entity';
import { OrderFilters } from '../../src/domain/types/order-filters.type';
import { PaginatedResult } from '../../src/domain/types/paginated-result.type';

export class InMemoryOrderRepository implements OrderRepository {
  private store: WorkOrder[];
  private codeSeq = 1;

  constructor(initial: WorkOrder[] = []) {
    this.store = [...initial];
  }

  async findById(id: string): Promise<WorkOrder | null> {
    return this.store.find((o) => o.id === id) ?? null;
  }

  async findByCode(code: string): Promise<WorkOrder | null> {
    return this.store.find((o) => o.code === code) ?? null;
  }

  async findByPortalToken(token: string): Promise<WorkOrder | null> {
    return this.store.find((o) => o.portalToken === token) ?? null;
  }

  async findByFilters(filters: OrderFilters): Promise<PaginatedResult<WorkOrder>> {
    let data = [...this.store];
    if (filters.status) data = data.filter((o) => o.status === filters.status);
    const total = data.length;
    const start = (filters.page - 1) * filters.pageSize;
    return {
      data: data.slice(start, start + filters.pageSize),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  }

  async findByClientId(clientId: string): Promise<WorkOrder[]> {
    return this.store.filter((o) => o.clientId === clientId);
  }

  async findByTechnicianId(technicianId: string): Promise<WorkOrder[]> {
    return this.store.filter((o) => o.technicianId === technicianId);
  }

  async save(order: WorkOrder): Promise<void> {
    const idx = this.store.findIndex((o) => o.id === order.id);
    if (idx >= 0) this.store[idx] = order;
    else this.store.push(order);
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((o) => o.id !== id);
  }

  async getNextCode(): Promise<string> {
    return `WO-${String(this.codeSeq++).padStart(4, '0')}`;
  }

  async countActiveByClientId(clientId: string): Promise<number> {
    return this.store.filter(
      (o) => o.clientId === clientId && !['DELIVERED', 'ARCHIVED'].includes(o.status),
    ).length;
  }
}
