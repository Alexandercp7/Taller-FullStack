import { z } from 'zod';
import { router, requireRole } from '../trpc/trpc';
import { createActivitySchema, updateActivitySchema, addCommentSchema } from '../validators';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { Container } from '../../infrastructure/di/container';

const ALL_STAFF = [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.RECEPTIONIST] as const;

export function createActivitiesRouter(container: Container) {
  return router({
    list: requireRole(...ALL_STAFF)
      .query(() => container.activityService.list()),

    create: requireRole(...ALL_STAFF)
      .input(createActivitySchema)
      .mutation(({ input }) =>
        container.activityService.create({
          titulo: input.titulo,
          descripcion: input.descripcion ?? '',
          estado: input.estado as any,
          prioridad: input.prioridad as any,
          etiqueta: input.etiqueta ?? '',
          fechaLimite: input.fechaLimite,
          asignadoA: input.asignadoA,
        }),
      ),

    update: requireRole(...ALL_STAFF)
      .input(updateActivitySchema)
      .mutation(({ input }) => {
        const { id, ...updates } = input;
        const result = container.activityService.update(id, updates as any);
        if (!result) throw new Error('Actividad no encontrada');
        return result;
      }),

    delete: requireRole(UserRole.ADMIN, UserRole.MANAGER)
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => {
        const ok = container.activityService.delete(input.id);
        if (!ok) throw new Error('Actividad no encontrada');
        return { id: input.id };
      }),

    addComment: requireRole(...ALL_STAFF)
      .input(addCommentSchema)
      .mutation(({ ctx, input }) => {
        const comment = container.activityService.addComment(
          input.activityId,
          input.texto,
          ctx.user!.id,
        );
        if (!comment) throw new Error('Actividad no encontrada');
        return comment;
      }),

    deleteComment: requireRole(...ALL_STAFF)
      .input(z.object({ activityId: z.string(), commentId: z.string() }))
      .mutation(({ input }) => {
        container.activityService.deleteComment(input.activityId, input.commentId);
        return { commentId: input.commentId };
      }),
  });
}
