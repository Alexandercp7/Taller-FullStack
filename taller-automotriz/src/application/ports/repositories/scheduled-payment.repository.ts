import { ScheduledPayment } from '../../../domain/entities/scheduled-payment.entity';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';

export interface ScheduledPaymentRepository {
  findById(id: string): Promise<ScheduledPayment | null>;
  findAll(page: number, pageSize: number): Promise<{ data: ScheduledPayment[]; total: number }>;
  findDueSoon(daysAhead: number): Promise<ScheduledPayment[]>;
  findByStatus(status: PaymentStatus): Promise<ScheduledPayment[]>;
  save(payment: ScheduledPayment): Promise<void>;
  delete(id: string): Promise<void>;
}
