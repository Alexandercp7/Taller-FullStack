import { z } from 'zod';
import { router, requireRole } from '../trpc/trpc';
import { createContactSchema, updateContactSchema } from '../validators';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { Container } from '../../infrastructure/di/container';

const ALL_STAFF = [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.RECEPTIONIST] as const;

export function createContactsRouter(container: Container) {
  return router({
    list: requireRole(...ALL_STAFF)
      .query(() => container.useCases.listContacts.execute()),

    create: requireRole(UserRole.ADMIN, UserRole.MANAGER)
      .input(createContactSchema)
      .mutation(({ input }) => container.useCases.createContact.execute(input)),

    update: requireRole(UserRole.ADMIN, UserRole.MANAGER)
      .input(updateContactSchema)
      .mutation(({ input }) => container.useCases.updateContact.execute(input)),

    delete: requireRole(UserRole.ADMIN)
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => container.useCases.deleteContact.execute(input.id)),
  });
}
