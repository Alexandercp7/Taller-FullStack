import { OrderStatus } from '../enums/order-status.enum';
import { Priority } from '../enums/priority.enum';

export interface OrderFilters {
  page: number;
  pageSize: number;
  status?: OrderStatus;
  technicianId?: string;
  clientId?: string;
  priority?: Priority;
  search?: string;
  scheduledFrom?: Date;
  scheduledTo?: Date;
}
