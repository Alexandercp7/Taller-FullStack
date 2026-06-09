import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { createTaskSchema, taskFiltersSchema } from '../validators';
import { TaskStatus } from '../../domain/enums/task-status.enum';
import type { Container } from '../../infrastructure/di/container';

export function createTasksRouter(container: Container) {
  return router({
    create: protectedProcedure
      .input(createTaskSchema)
      .mutation(({ ctx, input }) =>
        container.useCases.manageTasks.create({ ...input, createdById: ctx.user!.id }),
      ),

    list: protectedProcedure
      .input(taskFiltersSchema)
      .query(({ input }) => container.useCases.manageTasks.list(input)),

    changeStatus: protectedProcedure
      .input(z.object({ taskId: z.string(), status: z.nativeEnum(TaskStatus) }))
      .mutation(({ input }) =>
        container.useCases.manageTasks.changeStatus(input.taskId, input.status),
      ),

    delete: protectedProcedure
      .input(z.object({ taskId: z.string() }))
      .mutation(({ input }) => container.useCases.manageTasks.delete(input.taskId)),
  });
}
