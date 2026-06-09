import { PrismaClient } from '@prisma/client';
import { StockMovementRepository } from '../../../application/ports/repositories/stock-movement.repository';
import { StockMovementRecord } from '../../../domain/entities/inventory-item.entity';
import { MovementType } from '../../../domain/enums/movement-type.enum';
import { createId } from '../../../shared/identifier';

export class PrismaStockMovementRepository implements StockMovementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(movement: Omit<StockMovementRecord, 'id'>): Promise<void> {
    await this.prisma.stockMovement.create({
      data: {
        id: createId(),
        itemId: movement.itemId,
        type: movement.type as any,
        quantity: movement.quantity,
        reason: movement.reason,
        orderId: movement.orderId,
        userId: movement.userId,
      },
    });
  }

  async findByItemId(itemId: string): Promise<StockMovementRecord[]> {
    const items = await this.prisma.stockMovement.findMany({
      where: { itemId },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      id: item.id,
      itemId: item.itemId,
      type: item.type as MovementType,
      quantity: item.quantity,
      reason: item.reason,
      orderId: item.orderId,
      userId: item.userId,
    }));
  }
}
