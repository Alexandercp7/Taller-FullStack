import { OrderRepository } from '../../ports/repositories/order.repository';
import { OrderFilters } from '../../../domain/types/order-filters.type';
import { PaginatedResult } from '../../../domain/types/paginated-result.type';
import { WorkOrder } from '../../../domain/entities/work-order.entity';

export class ListOrdersUseCase {
  constructor(private readonly orderRepo: OrderRepository) {}

  async execute(filters: OrderFilters): Promise<PaginatedResult<WorkOrder>> {
    return this.orderRepo.findByFilters(filters);
  }
}
