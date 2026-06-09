import { InventoryItem } from '../../../domain/entities/inventory-item.entity';
import { InventoryType } from '../../../domain/enums/inventory-type.enum';

export interface InventoryFilters {
  page: number;
  pageSize: number;
  search?: string;
  type?: InventoryType;
  supplierId?: string;
}

export interface AssignPartData {
  orderId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface InventoryRepository {
  findById(id: string): Promise<InventoryItem | null>;
  findByFilters(filters: InventoryFilters): Promise<{ data: InventoryItem[]; total: number }>;
  findBelowMinStock(): Promise<InventoryItem[]>;
  save(item: InventoryItem): Promise<void>;
  delete(id: string): Promise<void>;
  assignToOrder(data: AssignPartData): Promise<string>;
  updateAssignedPart(assignedPartId: string, data: { quantity?: number; notes?: string }): Promise<void>;
  removeAssignedPart(assignedPartId: string): Promise<void>;
}
