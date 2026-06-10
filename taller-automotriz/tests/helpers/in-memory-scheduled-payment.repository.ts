import { ScheduledPaymentRepository } from '../../src/application/ports/repositories/scheduled-payment.repository';
import { ScheduledPayment } from '../../src/domain/entities/scheduled-payment.entity';
import { PaymentStatus } from '../../src/domain/enums/payment-status.enum';

export class InMemoryScheduledPaymentRepository implements ScheduledPaymentRepository {
  private store: ScheduledPayment[];

  constructor(initial: ScheduledPayment[] = []) {
    this.store = [...initial];
  }

  async findById(id: string): Promise<ScheduledPayment | null> {
    return this.store.find((p) => p.id === id) ?? null;
  }

  async findAll(page: number, pageSize: number): Promise<{ data: ScheduledPayment[]; total: number }> {
    const total = this.store.length;
    const start = (page - 1) * pageSize;
    return { data: this.store.slice(start, start + pageSize), total };
  }

  async findDueSoon(daysAhead: number): Promise<ScheduledPayment[]> {
    const limit = new Date();
    limit.setDate(limit.getDate() + daysAhead);
    return this.store.filter((p) => p.dueDate <= limit && p.status === PaymentStatus.PENDING);
  }

  async findByStatus(status: PaymentStatus): Promise<ScheduledPayment[]> {
    return this.store.filter((p) => p.status === status);
  }

  async save(payment: ScheduledPayment): Promise<void> {
    const idx = this.store.findIndex((p) => p.id === payment.id);
    if (idx >= 0) this.store[idx] = payment;
    else this.store.push(payment);
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((p) => p.id !== id);
  }
}
