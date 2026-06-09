import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context';
import { UserRole } from '../../domain/enums/user-role.enum';

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        domainError: error.cause?.constructor?.name ?? null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);

export function requireRole(...roles: UserRole[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!roles.includes(ctx.user!.role as UserRole))
      throw new TRPCError({ code: 'FORBIDDEN', message: `Rol requerido: ${roles.join(' | ')}` });
    return next({ ctx });
  });
}
