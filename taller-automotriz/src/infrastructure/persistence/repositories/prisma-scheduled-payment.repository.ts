import { PrismaClient } from '@prisma/client';
import { ScheduledPaymentRepository } from '../../../application/ports/repositories/scheduled-payment.repository';
import { ScheduledPayment } from '../../../domain/entities/scheduled-payment.entity';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import { CashType } from '../../../domain/enums/cash-type.enum';
import { Money } from '../../../domain/value-objects/money.vo';

export class PrismaScheduledPaymentRepository implements ScheduledPaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(raw: any): ScheduledPayment {
    return new ScheduledPayment(
      raw.id,
      raw.description,
      Money.fromAmount(Number(raw.amount)),
      raw.dueDate,
      raw.status as PaymentStatus,
      raw.type as CashType,
      raw.supplierId ?? null,
      raw.clientId ?? null,
      raw.calendarEventId ?? null,
      raw.notes ?? null,
    );
  }

  async findById(id: string): Promise<ScheduledPayment | null> {
    const raw = await this.prisma.scheduledPayment.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findAll(page: number, pageSize: number): Promise<{ data: ScheduledPayment[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.scheduledPayment.findMany({
        orderBy: { dueDate: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.scheduledPayment.count(),
    ]);
    return { data: items.map(this.toDomain.bind(this)), total };
  }

  async findDueSoon(daysAhead: number): Promise<ScheduledPayment[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);
    const items = await this.prisma.scheduledPayment.findMany({
      where: {
        dueDate: { lte: cutoff },
        status: { in: ['PENDING', 'PARTIAL'] },
      },
      orderBy: { dueDate: 'asc' },
    });
    return items.map(this.toDomain.bind(this));
  }

  async findByStatus(status: PaymentStatus): Promise<ScheduledPayment[]> {
    const items = await this.prisma.scheduledPayment.findMany({
      where: { status: status as any },
      orderBy: { dueDate: 'asc' },
    });
    return items.map(this.toDomain.bind(this));
  }

  async save(payment: ScheduledPayment): Promise<void> {
    await this.prisma.scheduledPayment.upsert({
      where: { id: payment.id },
      create: {
        id: payment.id,
        description: payment.description,
        amount: payment.amount.amount,
        dueDate: payment.dueDate,
        status: payment.status as any,
        type: payment.type as any,
        supplierId: payment.supplierId,
        clientId: payment.clientId,
        calendarEventId: payment.calendarEventId,
        notes: payment.notes,
      },
      update: {
        description: payment.description,
        amount: payment.amount.amount,
        dueDate: payment.dueDate,
        status: payment.status as any,
        notes: payment.notes,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.scheduledPayment.delete({ where: { id } });
  }
}
