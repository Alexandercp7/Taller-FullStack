import { ChecklistItem } from '../../../domain/entities/checklist.entity';

export interface ChecklistRepository {
  findByOrderId(orderId: string): Promise<ChecklistItem[]>;
  save(item: ChecklistItem): Promise<void>;
  saveMany(items: ChecklistItem[]): Promise<void>;
  toggle(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
