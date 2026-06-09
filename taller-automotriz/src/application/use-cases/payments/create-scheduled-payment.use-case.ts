import { ScheduledPaymentRepository } from '../../ports/repositories/scheduled-payment.repository';
import { ScheduledPayment } from '../../../domain/entities/scheduled-payment.entity';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import { CashType } from '../../../domain/enums/cash-type.enum';
import { Money } from '../../../domain/value-objects/money.vo';
import { createId } from '../../../shared/identifier';

interface CreateScheduledPaymentInput {
  description: string;
  amount: number;
  dueDate: Date;
  type: CashType;
  supplierId?: string;
  clientId?: string;
  notes?: string;
}

export class CreateScheduledPaymentUseCase {
  constructor(private readonly repo: ScheduledPaymentRepository) {}

  async execute(input: CreateScheduledPaymentInput): Promise<{ id: string }> {
    const payment = new ScheduledPayment(
      createId(),
      input.description,
      Money.fromAmount(input.amount),
      input.dueDate,
      PaymentStatus.PENDING,
      input.type,
      input.supplierId ?? null,
      input.clientId ?? null,
      null,
      input.notes ?? null,
    );
    await this.repo.save(payment);
    return { id: payment.id };
  }
}
