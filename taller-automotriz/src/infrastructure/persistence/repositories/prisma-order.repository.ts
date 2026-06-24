import { Prisma } from '@prisma/client';
import { OrderRepository } from '../../../application/ports/repositories/order.repository';
import { WorkOrder } from '../../../domain/entities/work-order.entity';
import { OrderMapper } from '../prisma/mappers/order.mapper';
import { OrderFilters } from '../../../domain/types/order-filters.type';
import { PaginatedResult } from '../../../domain/types/paginated-result.type';
import { PrismaClientProvider } from '../prisma/prisma-client-provider';
import { DuplicateOrderCodeError } from '../../../domain/errors/duplicate-order-code.error';

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly provider: PrismaClientProvider) {}

  private get db() {
    return this.provider.getClient();
  }

  async findById(id: string): Promise<WorkOrder | null> {
    const raw = await this.db.workOrder.findUnique({ where: { id } });
    return raw ? OrderMapper.toDomain(raw) : null;
  }

  async findByCode(code: string): Promise<WorkOrder | null> {
    const raw = await this.db.workOrder.findUnique({ where: { code } });
    return raw ? OrderMapper.toDomain(raw) : null;
  }

  async findByPortalToken(token: string): Promise<WorkOrder | null> {
    const raw = await this.db.workOrder.findUnique({ where: { portalToken: token } });
    return raw ? OrderMapper.toDomain(raw) : null;
  }

  async findByFilters(filters: OrderFilters): Promise<PaginatedResult<WorkOrder>> {
    const where: Prisma.WorkOrderWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.technicianId) where.technicianId = filters.technicianId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.priority) where.priority = filters.priority;
    if (filters.scheduledFrom || filters.scheduledTo) {
      where.scheduledAt = {};
      if (filters.scheduledFrom) where.scheduledAt.gte = filters.scheduledFrom;
      if (filters.scheduledTo) where.scheduledAt.lte = filters.scheduledTo;
    }
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { problem: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.workOrder.findMany({
        where,
        orderBy: { scheduledAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.db.workOrder.count({ where }),
    ]);

    return {
      data: items.map(OrderMapper.toDomain),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  }

  async findByClientId(clientId: string): Promise<WorkOrder[]> {
    const items = await this.db.workOrder.findMany({ where: { clientId } });
    return items.map(OrderMapper.toDomain);
  }

  async findByTechnicianId(technicianId: string): Promise<WorkOrder[]> {
    const items = await this.db.workOrder.findMany({ where: { technicianId } });
    return items.map(OrderMapper.toDomain);
  }

  async save(order: WorkOrder): Promise<void> {
    const data = OrderMapper.toPersistence(order);
    try {
      await this.db.workOrder.upsert({
        where: { id: order.id },
        create: data,
        update: data,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError
        && err.code === 'P2002'
        && (err.meta?.target as string[] | undefined)?.includes('code')
      ) {
        throw new DuplicateOrderCodeError(order.code);
      }
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    await this.db.workOrder.delete({ where: { id } });
  }

  async getNextCode(offset = 0): Promise<string> {
    const orders = await this.db.workOrder.findMany({ select: { code: true } });
    // Find the highest number from codes matching OT-NNNN or WO-NNNN (4-digit sequential codes).
    // Alphabetical sort is unreliable because WO-* sorts after OT-* and inflates the base.
    const maxNum = orders.reduce((max, o) => {
      const m = o.code.match(/^(?:OT|WO)-(\d{4})$/);
      const n = m ? parseInt(m[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return `OT-${String(maxNum + 1 + offset).padStart(4, '0')}`;
  }

  async countActiveByClientId(clientId: string): Promise<number> {
    return this.db.workOrder.count({
      where: {
        clientId,
        status: { notIn: ['DELIVERED', 'ARCHIVED', 'CANCELLED'] },
      },
    });
  }
}
