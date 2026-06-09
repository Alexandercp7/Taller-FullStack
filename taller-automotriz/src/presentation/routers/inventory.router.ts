import { z } from 'zod';
import { router, requireRole } from '../trpc/trpc';
import {
  createInventoryItemSchema,
  assignPartSchema,
  stockMovementSchema,
  updateInventoryItemSchema,
  movementHistorySchema,
} from '../validators';
import { InventoryType } from '../../domain/enums/inventory-type.enum';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { Container } from '../../infrastructure/di/container';

export function createInventoryRouter(container: Container) {
  return router({
    search: requireRole(UserRole.ADMIN, UserRole.TECHNICIAN)
      .input(
        z.object({
          page: z.coerce.number().int().positive().default(1),
          pageSize: z.coerce.number().int().min(1).max(100).default(20),
          search: z.string().optional(),
          type: z.nativeEnum(InventoryType).optional(),
        }),
      )
      .query(({ input }) => container.useCases.searchInventory.execute(input)),

    create: requireRole(UserRole.ADMIN, UserRole.TECHNICIAN)
      .input(createInventoryItemSchema)
      .mutation(({ input }) => container.useCases.createInventoryItem.execute(input)),

    update: requireRole(UserRole.ADMIN, UserRole.TECHNICIAN)
      .input(updateInventoryItemSchema)
      .mutation(({ input }) => container.useCases.updateInventoryItem.execute(input)),

    assignToOrder: requireRole(UserRole.ADMIN, UserRole.TECHNICIAN)
      .input(assignPartSchema)
      .mutation(({ ctx, input }) =>
        container.useCases.assignPartToOrder.execute({ ...input, userId: ctx.user!.id }),
      ),

    registerMovement: requireRole(UserRole.ADMIN, UserRole.TECHNICIAN)
      .input(stockMovementSchema)
      .mutation(({ ctx, input }) =>
        container.useCases.registerStockMovement.execute({ ...input, userId: ctx.user!.id }),
      ),

    movementHistory: requireRole(UserRole.ADMIN, UserRole.TECHNICIAN)
      .input(movementHistorySchema)
      .query(({ input }) => container.useCases.getMovementHistory.execute(input.itemId)),

    delete: requireRole(UserRole.ADMIN)
      .input(z.object({ itemId: z.string() }))
      .mutation(({ input }) => container.useCases.deleteInventoryItem.execute(input.itemId)),
  });
}
