import {
  InventoryRepository,
  InventoryFilters,
  AssignPartData,
} from '../../src/application/ports/repositories/inventory.repository';
import { InventoryItem } from '../../src/domain/entities/inventory-item.entity';

export class InMemoryInventoryRepository implements InventoryRepository {
  private store: InventoryItem[];
  private partSeq = 1;

  constructor(initial: InventoryItem[] = []) {
    this.store = [...initial];
  }

  async findById(id: string): Promise<InventoryItem | null> {
    return this.store.find((i) => i.id === id) ?? null;
  }

  async findByFilters(filters: InventoryFilters): Promise<{ data: InventoryItem[]; total: number }> {
    const data = this.store.filter((i) => i.isActive);
    return { data, total: data.length };
  }

  async findBelowMinStock(): Promise<InventoryItem[]> {
    return this.store.filter((i) => i.stock < i.minStock && i.isActive);
  }

  async save(item: InventoryItem): Promise<void> {
    const idx = this.store.findIndex((i) => i.id === item.id);
    if (idx >= 0) this.store[idx] = item;
    else this.store.push(item);
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((i) => i.id !== id);
  }

  async assignToOrder(data: AssignPartData): Promise<string> {
    return `assigned-part-${this.partSeq++}`;
  }

  async updateAssignedPart(): Promise<void> {}
  async removeAssignedPart(): Promise<void> {}
}
