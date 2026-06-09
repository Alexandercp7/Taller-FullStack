import { z } from 'zod';
import { router, requireRole } from '../trpc/trpc';
import {
  createOrderSchema,
  orderFiltersSchema,
  changeOrderStatusSchema,
  revertPhaseSchema,
  closeOrderSchema,
  addNoteSchema,
} from '../validators';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { Container } from '../../infrastructure/di/container';

const ALL_STAFF = [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.RECEPTIONIST] as const;

export function createOrdersRouter(container: Container) {
  return router({
    list: requireRole(...ALL_STAFF)
      .input(orderFiltersSchema)
      .query(({ input }) => container.useCases.listOrders.execute(input)),

    detail: requireRole(...ALL_STAFF)
      .input(z.object({ orderId: z.string() }))
      .query(({ input }) => container.useCases.getOrderDetail.execute(input.orderId)),

    sharePortal: requireRole(...ALL_STAFF)
      .input(z.object({ orderId: z.string() }))
      .query(({ input }) => container.useCases.shareOrderPortal.execute(input.orderId)),

    create: requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST)
      .input(createOrderSchema)
      .mutation(({ ctx, input }) =>
        container.useCases.createOrder.execute({ ...input, createdById: ctx.user!.id }),
      ),

    changeStatus: requireRole(UserRole.ADMIN, UserRole.TECHNICIAN)
      .input(changeOrderStatusSchema)
      .mutation(({ ctx, input }) =>
        container.useCases.changeOrderStatus.execute({ ...input, userId: ctx.user!.id }),
      ),

    close: requireRole(UserRole.ADMIN, UserRole.TECHNICIAN)
      .input(closeOrderSchema)
      .mutation(({ ctx, input }) =>
        container.useCases.closeOrder.execute({ ...input, userId: ctx.user!.id }),
      ),

    revertPhase: requireRole(UserRole.ADMIN, UserRole.TECHNICIAN)
      .input(revertPhaseSchema)
      .mutation(({ ctx, input }) =>
        container.useCases.revertOrderPhase.execute({ ...input, userId: ctx.user!.id }),
      ),

    addNote: requireRole(UserRole.ADMIN, UserRole.TECHNICIAN)
      .input(addNoteSchema)
      .mutation(({ ctx, input }) =>
        container.useCases.addNoteToOrder.execute({ ...input, userId: ctx.user!.id }),
      ),

    delete: requireRole(UserRole.ADMIN)
      .input(z.object({ orderId: z.string() }))
      .mutation(({ input }) => container.useCases.deleteOrder.execute(input.orderId)),
  });
}
