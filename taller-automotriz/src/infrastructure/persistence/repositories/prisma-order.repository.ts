import { Prisma } from '@prisma/client';
import { OrderRepository } from '../../../application/ports/repositories/order.repository';
import { WorkOrder } from '../../../domain/entities/work-order.entity';
import { OrderMapper } from '../prisma/mappers/order.mapper';
import { OrderFilters } from '../../../domain/types/order-filters.type';
import { PaginatedResult } from '../../../domain/types/paginated-result.type';
import { PrismaClientProvider } from '../prisma/prisma-client-provider';

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
    await this.db.workOrder.upsert({
      where: { id: order.id },
      create: data,
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.workOrder.delete({ where: { id } });
  }

  async getNextCode(): Promise<string> {
    const last = await this.db.workOrder.findFirst({
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const match = last?.code.match(/(\d+)$/);
    const lastNumber = match ? parseInt(match[1], 10) : 0;
    return `OT-${String(lastNumber + 1).padStart(4, '0')}`;
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
