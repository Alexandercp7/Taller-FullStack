import { ListScheduledPaymentsUseCase } from '../../../../application/use-cases/payments/list-scheduled-payments.use-case';
import { CreateScheduledPaymentUseCase } from '../../../../application/use-cases/payments/create-scheduled-payment.use-case';
import { UpdateScheduledPaymentUseCase } from '../../../../application/use-cases/payments/update-scheduled-payment.use-case';
import { DeleteScheduledPaymentUseCase } from '../../../../application/use-cases/payments/delete-scheduled-payment.use-case';
import type { Repos } from '../repositories';

export function buildPaymentUseCases(repos: Repos) {
  const { scheduledPaymentRepo } = repos;
  return {
    listScheduledPayments: new ListScheduledPaymentsUseCase(scheduledPaymentRepo),
    createScheduledPayment: new CreateScheduledPaymentUseCase(scheduledPaymentRepo),
    updateScheduledPayment: new UpdateScheduledPaymentUseCase(scheduledPaymentRepo),
    deleteScheduledPayment: new DeleteScheduledPaymentUseCase(scheduledPaymentRepo),
  };
}
