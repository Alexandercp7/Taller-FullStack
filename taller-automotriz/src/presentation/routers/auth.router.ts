import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc/trpc';
import { loginSchema, changePasswordSchema } from '../validators';
import type { Container } from '../../infrastructure/di/container';

export function createAuthRouter(container: Container) {
  return router({
    login: publicProcedure
      .input(loginSchema)
      .mutation(({ input }) => container.useCases.login.execute(input)),

    refresh: publicProcedure
      .input(z.object({ refreshToken: z.string() }))
      .mutation(({ input }) => container.useCases.refreshToken.execute(input.refreshToken)),

    changePassword: protectedProcedure
      .input(changePasswordSchema)
      .mutation(({ ctx, input }) =>
        container.useCases.changePassword.execute({
          ...input,
          userId: ctx.user!.id,
        }),
      ),
  });
}
