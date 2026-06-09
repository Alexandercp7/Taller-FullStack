import { z } from 'zod';
import { router, publicProcedure, requireRole } from '../trpc/trpc';
import { createVehicleSchema, vehicleFiltersSchema, updateVehicleSchema } from '../validators';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { Container } from '../../infrastructure/di/container';

const ALL_STAFF = [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.RECEPTIONIST] as const;

export function createVehiclesRouter(container: Container) {
  return router({
    list: requireRole(...ALL_STAFF)
      .input(vehicleFiltersSchema)
      .query(({ input }) => container.useCases.listVehicles.execute(input)),

    create: requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST)
      .input(createVehicleSchema)
      .mutation(({ input }) => container.useCases.createVehicle.execute(input)),

    update: requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST)
      .input(updateVehicleSchema)
      .mutation(({ input }) => container.useCases.updateVehicle.execute(input)),

    delete: requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST)
      .input(z.object({ vehicleId: z.string() }))
      .mutation(({ input }) => container.useCases.deleteVehicle.execute(input.vehicleId)),

    decodeVin: publicProcedure
      .input(z.object({ vin: z.string().min(6), vehicleId: z.string().optional() }))
      .query(({ input }) => container.useCases.decodeVin.execute(input)),
  });
}
