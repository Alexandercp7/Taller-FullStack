import { ScheduledPaymentRepository } from '../../ports/repositories/scheduled-payment.repository';

export class ListScheduledPaymentsUseCase {
  constructor(private readonly repo: ScheduledPaymentRepository) {}

  async execute(page = 1, pageSize = 100) {
    const { data, total } = await this.repo.findAll(page, pageSize);
    return {
      data: data.map((p) => ({
        id: p.id,
        description: p.description,
        amount: p.amount.amount,
        dueDate: p.dueDate,
        status: p.status,
        type: p.type,
        supplierId: p.supplierId,
        clientId: p.clientId,
        notes: p.notes,
      })),
      total,
      page,
      pageSize,
    };
  }
}
