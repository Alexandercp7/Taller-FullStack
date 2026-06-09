import type { WorkOrder as PrismaWorkOrder } from '@prisma/client';
import { WorkOrder } from '../../../../domain/entities/work-order.entity';
import { OrderStatus } from '../../../../domain/enums/order-status.enum';
import { OrderPhase } from '../../../../domain/enums/order-phase.enum';
import { Priority } from '../../../../domain/enums/priority.enum';
import { OrderType } from '../../../../domain/enums/order-type.enum';

export class OrderMapper {
  static toDomain(raw: PrismaWorkOrder): WorkOrder {
    return WorkOrder.reconstitute({
      id: raw.id,
      code: raw.code,
      status: raw.status as OrderStatus,
      phase: raw.phase as OrderPhase | null,
      priority: raw.priority as Priority,
      type: raw.type as OrderType,
      clientId: raw.clientId,
      vehicleId: raw.vehicleId,
      technicianId: raw.technicianId,
      createdById: raw.createdById,
      problem: raw.problem,
      mileageIn: raw.mileageIn,
      mileageOut: raw.mileageOut,
      portalToken: raw.portalToken,
      scheduledAt: raw.scheduledAt,
      closedAt: raw.closedAt,
      needsDiagnosis: raw.needsDiagnosis,
      intakeCauses: raw.intakeCauses,
      discoveredFaults: raw.discoveredFaults,
      repairNotes: raw.repairNotes,
    });
  }

  static toPersistence(entity: WorkOrder): Omit<PrismaWorkOrder, 'createdAt' | 'updatedAt'> {
    return {
      id: entity.id,
      code: entity.code,
      status: entity.status,
      phase: entity.phase,
      priority: entity.priority,
      type: entity.type,
      clientId: entity.clientId,
      vehicleId: entity.vehicleId,
      technicianId: entity.technicianId,
      createdById: entity.createdById,
      problem: entity.problem,
      mileageIn: entity.mileageIn,
      mileageOut: entity.mileageOut,
      portalToken: entity.portalToken,
      scheduledAt: entity.scheduledAt,
      closedAt: entity.closedAt,
      needsDiagnosis: entity.needsDiagnosis,
      intakeCauses: entity.intakeCauses,
      discoveredFaults: entity.discoveredFaults,
      repairNotes: entity.repairNotes,
      exitKm: entity.mileageOut,
      exitDate: entity.closedAt,
      fuelLevel: null,
    };
  }
}
