import { StockMovementRecord } from '../../../domain/entities/inventory-item.entity';

export interface StockMovementRepository {
  save(movement: Omit<StockMovementRecord, 'id'>): Promise<void>;
  findByItemId(itemId: string): Promise<StockMovementRecord[]>;
}
