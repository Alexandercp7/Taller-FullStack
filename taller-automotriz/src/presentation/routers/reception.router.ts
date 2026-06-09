import { z } from 'zod';
import { router, requireRole } from '../trpc/trpc';
import { uploadPhotoSchema } from '../validators';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { Container } from '../../infrastructure/di/container';

export function createReceptionRouter(container: Container) {
  return router({
    registerIntakeCauses: requireRole(UserRole.ADMIN, UserRole.TECHNICIAN)
      .input(
        z.object({
          orderId: z.string(),
          causes: z.array(z.string()).min(1),
        }),
      )
      .mutation(({ ctx, input }) =>
        container.useCases.registerIntakeCauses.execute({ ...input, userId: ctx.user!.id }),
      ),

    uploadPhoto: requireRole(UserRole.ADMIN, UserRole.TECHNICIAN)
      .input(uploadPhotoSchema)
      .mutation(({ ctx, input }) =>
        container.useCases.uploadPhotos.execute({ ...input, uploadedBy: ctx.user!.id }),
      ),
  });
}
