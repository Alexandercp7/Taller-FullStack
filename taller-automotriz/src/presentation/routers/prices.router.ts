import { z } from 'zod';
import { router, requireRole } from '../trpc/trpc';
import { createPriceItemSchema, updatePriceItemSchema } from '../validators';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { Container } from '../../infrastructure/di/container';

const ALL_STAFF = [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.RECEPTIONIST] as const;

export function createPricesRouter(container: Container) {
  return router({
    list: requireRole(...ALL_STAFF)
      .query(() => container.priceService.list()),

    create: requireRole(UserRole.ADMIN, UserRole.MANAGER)
      .input(createPriceItemSchema)
      .mutation(({ input }) => container.priceService.create(input)),

    update: requireRole(UserRole.ADMIN, UserRole.MANAGER)
      .input(updatePriceItemSchema)
      .mutation(({ input }) => {
        const { id, ...updates } = input;
        const result = container.priceService.update(id, updates);
        if (!result) throw new Error('Precio no encontrado');
        return result;
      }),

    delete: requireRole(UserRole.ADMIN)
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => {
        const ok = container.priceService.delete(input.id);
        if (!ok) throw new Error('Precio no encontrado');
        return { id: input.id };
      }),
  });
}
