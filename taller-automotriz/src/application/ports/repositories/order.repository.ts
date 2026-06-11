import { WorkOrder } from '../../../domain/entities/work-order.entity';
import { OrderFilters } from '../../../domain/types/order-filters.type';
import { PaginatedResult } from '../../../domain/types/paginated-result.type';

export interface OrderRepository {
  findById(id: string): Promise<WorkOrder | null>;
  findByCode(code: string): Promise<WorkOrder | null>;
  findByPortalToken(token: string): Promise<WorkOrder | null>;
  findByFilters(filters: OrderFilters): Promise<PaginatedResult<WorkOrder>>;
  findByClientId(clientId: string): Promise<WorkOrder[]>;
  findByTechnicianId(technicianId: string): Promise<WorkOrder[]>;
  save(order: WorkOrder): Promise<void>;
  delete(id: string): Promise<void>;
  getNextCode(offset?: number): Promise<string>;
  countActiveByClientId(clientId: string): Promise<number>;
}
