import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../trpc';

export function requirePermission(permission: string) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    const user = ctx.user!;

    if (user.role === 'ADMIN') return next({ ctx });

    const dbUser = await ctx.container.useCases.listUsers.execute();
    const fullUser = dbUser.find((u) => u.id === user.id);

    if (!fullUser?.permissions.includes(permission)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Permiso requerido: ${permission}`,
      });
    }

    return next({ ctx });
  });
}
