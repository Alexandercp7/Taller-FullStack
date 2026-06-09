import { z } from 'zod';
import { router, requireRole } from '../trpc/trpc';
import { cashEntrySchema, arPaymentSchema, dateRangeSchema } from '../validators';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { Container } from '../../infrastructure/di/container';

const MANAGEMENT = [UserRole.ADMIN, UserRole.MANAGER] as const;

export function createFinanceRouter(container: Container) {
  return router({
    // ── Cash Entries ──────────────────────────────────────────────────────────
    registerCashEntry: requireRole(...MANAGEMENT)
      .input(cashEntrySchema)
      .mutation(({ ctx, input }) =>
        container.useCases.registerCashEntry.execute({ ...input, userId: ctx.user!.id }),
      ),

    listCashEntries: requireRole(...MANAGEMENT)
      .input(dateRangeSchema)
      .query(({ input }) => container.useCases.listCashEntries.execute(input)),

    // ── Accounts Receivable ───────────────────────────────────────────────────
    registerARPayment: requireRole(...MANAGEMENT)
      .input(arPaymentSchema)
      .mutation(({ ctx, input }) =>
        container.useCases.registerARPayment.execute({ ...input, userId: ctx.user!.id }),
      ),

    listReceivable: requireRole(...MANAGEMENT)
      .query(() => container.useCases.listAccountsReceivable.execute()),

    listReceivableByClient: requireRole(...MANAGEMENT)
      .input(z.object({ clientId: z.string() }))
      .query(({ input }) =>
        container.useCases.listAccountsReceivable
          .execute()
          .then(items => items.filter(a => a.clientId === input.clientId)),
      ),

    // ── Reports ───────────────────────────────────────────────────────────────
    reports: requireRole(...MANAGEMENT)
      .input(dateRangeSchema)
      .query(({ input }) => container.useCases.getFinancialReports.execute(input)),

    comparative: requireRole(...MANAGEMENT)
      .input(z.object({ monthsBack: z.number().int().min(1).max(24).default(6) }))
      .query(({ input }) => container.useCases.getComparativeReport.execute(input.monthsBack)),

    kpis: requireRole(...MANAGEMENT)
      .input(dateRangeSchema)
      .query(({ input }) => container.useCases.getKPIs.execute(input)),
  });
}
