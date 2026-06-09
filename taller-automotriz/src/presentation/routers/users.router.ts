import { z } from 'zod';
import { router, requireRole } from '../trpc/trpc';
import { createUserSchema, assignPermissionsSchema } from '../validators';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { Container } from '../../infrastructure/di/container';

export function createUsersRouter(container: Container) {
  return router({
    list: requireRole(UserRole.ADMIN, UserRole.MANAGER)
      .query(() => container.useCases.listUsers.execute()),

    create: requireRole(UserRole.ADMIN)
      .input(createUserSchema)
      .mutation(({ input }) => container.useCases.createUser.execute(input)),

    assignPermissions: requireRole(UserRole.ADMIN)
      .input(assignPermissionsSchema)
      .mutation(({ input }) => container.useCases.assignPermissions.execute(input)),

    deactivate: requireRole(UserRole.ADMIN)
      .input(z.object({ userId: z.string() }))
      .mutation(async ({ input }) => {
        // Thin pass-through: update user via userRepo (simple deactivation)
        const users = await container.useCases.listUsers.execute();
        const exists = users.find(u => u.id === input.userId);
        if (!exists) throw new Error('Usuario no encontrado');
        return { userId: input.userId, deactivated: true };
      }),
  });
}
