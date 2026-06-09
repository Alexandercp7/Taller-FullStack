import { z } from 'zod';
import { router, requireRole } from '../trpc/trpc';
import {
  dateRangeSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  createKpiSchema,
  updateKpiSchema,
  createKpiActivitySchema,
  updateKpiActivitySchema,
  updateOrganizationSchema,
} from '../validators';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { Container } from '../../infrastructure/di/container';

const MANAGEMENT = [UserRole.ADMIN, UserRole.MANAGER] as const;
const ALL_STAFF = [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.RECEPTIONIST] as const;

export function createKpisRouter(container: Container) {
  return router({
    // ── Financial KPIs (computed from DB) ─────────────────────────────────────
    summary: requireRole(...MANAGEMENT)
      .input(dateRangeSchema)
      .query(({ input }) => container.useCases.getKPIs.execute(input)),

    comparative: requireRole(...MANAGEMENT)
      .input(z.object({ monthsBack: z.number().int().min(1).max(24).default(6) }))
      .query(({ input }) => container.useCases.getComparativeReport.execute(input.monthsBack)),

    // ── Employees ─────────────────────────────────────────────────────────────
    listEmployees: requireRole(...ALL_STAFF)
      .query(() => container.kpiService.listEmployees()),

    createEmployee: requireRole(...MANAGEMENT)
      .input(createEmployeeSchema)
      .mutation(({ input }) => container.kpiService.createEmployee({
        nombre: input.nombre,
        apellido: input.apellido,
        email: input.email,
        telefono: input.telefono ?? '',
        role: input.role as any,
        fotoUrl: input.fotoUrl ?? '',
      })),

    updateEmployee: requireRole(...MANAGEMENT)
      .input(updateEmployeeSchema)
      .mutation(({ input }) => {
        const { id, ...updates } = input;
        const result = container.kpiService.updateEmployee(id, updates as any);
        if (!result) throw new Error('Empleado no encontrado');
        return result;
      }),

    deleteEmployee: requireRole(UserRole.ADMIN)
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => {
        const ok = container.kpiService.deleteEmployee(input.id);
        if (!ok) throw new Error('Empleado no encontrado');
        return { id: input.id };
      }),

    // ── KPI Objectives ────────────────────────────────────────────────────────
    listKpis: requireRole(...ALL_STAFF)
      .query(() => container.kpiService.listKpis()),

    createKpi: requireRole(...MANAGEMENT)
      .input(createKpiSchema)
      .mutation(({ input }) => container.kpiService.createKpi(input as any)),

    updateKpi: requireRole(...MANAGEMENT)
      .input(updateKpiSchema)
      .mutation(({ input }) => {
        const { id, ...updates } = input;
        const result = container.kpiService.updateKpi(id, updates as any);
        if (!result) throw new Error('KPI no encontrado');
        return result;
      }),

    deleteKpi: requireRole(UserRole.ADMIN)
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => {
        container.kpiService.deleteKpi(input.id);
        return { id: input.id };
      }),

    // ── KPI Activities (per-role Kanban) ──────────────────────────────────────
    listKpiActivities: requireRole(...ALL_STAFF)
      .query(() => container.kpiService.listActivities()),

    createKpiActivity: requireRole(...ALL_STAFF)
      .input(createKpiActivitySchema)
      .mutation(({ input }) => container.kpiService.createActivity({
        titulo: input.titulo,
        descripcion: input.descripcion ?? '',
        roleAsignado: input.roleAsignado as any,
        prioridad: input.prioridad as any,
        tags: input.tags,
        empleadoAsignado: input.empleadoAsignado,
        fechaVencimiento: input.fechaVencimiento,
      })),

    updateKpiActivity: requireRole(...ALL_STAFF)
      .input(updateKpiActivitySchema)
      .mutation(({ input }) => {
        const { id, ...updates } = input;
        const result = container.kpiService.updateActivity(id, updates as any);
        if (!result) throw new Error('Actividad no encontrada');
        return result;
      }),

    deleteKpiActivity: requireRole(...MANAGEMENT)
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => {
        container.kpiService.deleteActivity(input.id);
        return { id: input.id };
      }),

    // ── Organization Info ─────────────────────────────────────────────────────
    getOrganization: requireRole(...ALL_STAFF)
      .query(() => container.kpiService.getOrg()),

    updateOrganization: requireRole(...MANAGEMENT)
      .input(updateOrganizationSchema)
      .mutation(({ input }) => container.kpiService.updateOrg(input)),
  });
}
