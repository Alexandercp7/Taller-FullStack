import { PrismaClient, Prisma } from '@prisma/client';
import { ClientRepository } from '../../../application/ports/repositories/client.repository';
import { Client } from '../../../domain/entities/client.entity';
import { ClientMapper } from '../prisma/mappers/client.mapper';

export class PrismaClientRepository implements ClientRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Client | null> {
    const raw = await this.prisma.client.findUnique({ where: { id } });
    return raw ? ClientMapper.toDomain(raw) : null;
  }

  async findByPhone(phone: string): Promise<Client | null> {
    const raw = await this.prisma.client.findUnique({ where: { phone } });
    return raw ? ClientMapper.toDomain(raw) : null;
  }

  async findByNameOrPhone(
    query: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Client[]; total: number }> {
    const where: Prisma.ClientWhereInput = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
      ],
    };

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data: items.map(ClientMapper.toDomain), total };
  }

  async save(client: Client): Promise<void> {
    const data = ClientMapper.toPersistence(client);
    await this.prisma.client.upsert({
      where: { id: client.id },
      create: { ...data, createdAt: new Date() },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.client.delete({ where: { id } });
  }

  async hasActiveOrders(clientId: string): Promise<boolean> {
    const count = await this.prisma.workOrder.count({
      where: { clientId, status: { notIn: ['DELIVERED', 'ARCHIVED'] } },
    });
    return count > 0;
  }

  async countOrders(clientId: string): Promise<number> {
    return this.prisma.workOrder.count({ where: { clientId } });
  }

  async hasPendingDebt(clientId: string): Promise<boolean> {
    const count = await this.prisma.accountReceivable.count({
      where: { clientId, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
    });
    return count > 0;
  }
}
