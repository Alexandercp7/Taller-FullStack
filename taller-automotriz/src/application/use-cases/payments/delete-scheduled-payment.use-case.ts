import { ScheduledPaymentRepository } from '../../ports/repositories/scheduled-payment.repository';

export class DeleteScheduledPaymentUseCase {
  constructor(private readonly repo: ScheduledPaymentRepository) {}

  async execute(id: string): Promise<void> {
    const payment = await this.repo.findById(id);
    if (!payment) throw new Error('Pago programado no encontrado');
    await this.repo.delete(id);
  }
}
