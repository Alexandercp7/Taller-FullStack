import { ScheduledPaymentRepository } from '../../ports/repositories/scheduled-payment.repository';
import { Money } from '../../../domain/value-objects/money.vo';

interface UpdateScheduledPaymentInput {
  id: string;
  description?: string;
  amount?: number;
  dueDate?: Date;
  notes?: string;
}

export class UpdateScheduledPaymentUseCase {
  constructor(private readonly repo: ScheduledPaymentRepository) {}

  async execute(input: UpdateScheduledPaymentInput): Promise<void> {
    const payment = await this.repo.findById(input.id);
    if (!payment) throw new Error('Pago programado no encontrado');
    payment.update({
      description: input.description,
      amount: input.amount !== undefined ? Money.fromAmount(input.amount) : undefined,
      dueDate: input.dueDate,
      notes: input.notes,
    });
    await this.repo.save(payment);
  }
}
