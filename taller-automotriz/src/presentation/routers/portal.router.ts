import { z } from 'zod';
import { router, publicProcedure } from '../trpc/trpc';
import { surveySchema } from '../validators';
import type { Container } from '../../infrastructure/di/container';

export function createPortalRouter(container: Container) {
  return router({
    getOrderByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(({ input }) => container.useCases.getOrderByToken.execute(input.token)),

    submitSurvey: publicProcedure
      .input(surveySchema.extend({ token: z.string() }))
      .mutation(({ input }) =>
        container.useCases.submitSurvey.execute(input),
      ),
  });
}
