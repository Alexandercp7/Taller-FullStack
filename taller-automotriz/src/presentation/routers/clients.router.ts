import { z } from 'zod';
import { router, requireRole } from '../trpc/trpc';
import { createClientSchema, clientListSchema } from '../validators';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { Container } from '../../infrastructure/di/container';

const ALL_STAFF = [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.RECEPTIONIST] as const;

export function createClientsRouter(container: Container) {
  return router({
    list: requireRole(...ALL_STAFF)
      .input(clientListSchema)
      .query(({ input }) => container.useCases.listClients.execute(input)),

    detail: requireRole(...ALL_STAFF)
      .input(z.object({ clientId: z.string() }))
      .query(({ input }) => container.useCases.getClientDetail.execute(input.clientId)),

    create: requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST)
      .input(createClientSchema)
      .mutation(({ input }) => container.useCases.createClient.execute(input)),

    update: requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST)
      .input(createClientSchema.extend({ clientId: z.string() }))
      .mutation(({ input }) => container.useCases.upsertClient.execute(input)),

    upsert: requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST)
      .input(createClientSchema)
      .mutation(({ input }) => container.useCases.upsertClient.execute(input)),

    delete: requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST)
      .input(z.object({ clientId: z.string() }))
      .mutation(({ input }) => container.useCases.deleteClient.execute(input.clientId)),
  });
}
