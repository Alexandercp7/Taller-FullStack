import { z } from 'zod';
import { router, requireRole } from '../trpc/trpc';
import { createScheduledPaymentSchema, updateScheduledPaymentSchema } from '../validators';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { Container } from '../../infrastructure/di/container';

const MANAGEMENT = [UserRole.ADMIN, UserRole.MANAGER] as const;

export function createPaymentsAgendaRouter(container: Container) {
  return router({
    list: requireRole(...MANAGEMENT)
      .input(
        z.object({
          page: z.coerce.number().int().positive().default(1),
          pageSize: z.coerce.number().int().min(1).max(200).default(100),
        }),
      )
      .query(({ input }) =>
        container.useCases.listScheduledPayments.execute(input.page, input.pageSize),
      ),

    create: requireRole(...MANAGEMENT)
      .input(createScheduledPaymentSchema)
      .mutation(({ input }) => container.useCases.createScheduledPayment.execute(input)),

    update: requireRole(...MANAGEMENT)
      .input(updateScheduledPaymentSchema)
      .mutation(({ input }) => container.useCases.updateScheduledPayment.execute(input)),

    delete: requireRole(UserRole.ADMIN)
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => container.useCases.deleteScheduledPayment.execute(input.id)),

    dueSoon: requireRole(...MANAGEMENT)
      .input(z.object({ daysAhead: z.number().int().min(1).max(90).default(7) }))
      .query(({ input }) =>
        container.useCases.listScheduledPayments
          .execute(1, 200)
          .then(result =>
            result.data.filter(p => {
              const due = new Date(p.dueDate);
              const cutoff = new Date();
              cutoff.setDate(cutoff.getDate() + input.daysAhead);
              return due <= cutoff && p.status !== 'PAID';
            }),
          ),
      ),
  });
}
