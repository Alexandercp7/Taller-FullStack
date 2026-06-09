import { OrderRepository } from '../../ports/repositories/order.repository';
import { ClientRepository } from '../../ports/repositories/client.repository';
import { VehicleRepository } from '../../ports/repositories/vehicle.repository';
import { TimelineRepository } from '../../ports/repositories/timeline.repository';
import { UnitOfWork } from '../../ports/unit-of-work.port';
import { WorkOrder } from '../../../domain/entities/work-order.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { OrderType } from '../../../domain/enums/order-type.enum';
import { Priority } from '../../../domain/enums/priority.enum';
import { createId } from '../../../shared/identifier';

interface CreateOrderInput {
  clientId: string;
  vehicleId: string;
  technicianId: string;
  createdById: string;
  problem: string;
  priority?: Priority;
  type?: OrderType;
  scheduledAt: Date;
  mileageIn?: number;
}

interface CreateOrderOutput {
  id: string;
  code: string;
}

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly clientRepo: ClientRepository,
    private readonly vehicleRepo: VehicleRepository,
    private readonly timelineRepo: TimelineRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    const client = await this.clientRepo.findById(input.clientId);
    if (!client) throw new Error('Cliente no encontrado');

    const vehicle = await this.vehicleRepo.findById(input.vehicleId);
    if (!vehicle) throw new Error('Vehículo no encontrado');
    if (vehicle.clientId !== input.clientId) throw new Error('El vehículo no pertenece al cliente');

    const code = await this.orderRepo.getNextCode();
    const id = createId();
    const portalToken = createId();

    const order = WorkOrder.create({
      id,
      code,
      status: OrderStatus.SCHEDULED,
      phase: null,
      priority: input.priority ?? Priority.MEDIUM,
      type: input.type ?? OrderType.NORMAL,
      clientId: input.clientId,
      vehicleId: input.vehicleId,
      technicianId: input.technicianId,
      createdById: input.createdById,
      problem: input.problem,
      mileageIn: input.mileageIn ?? null,
      mileageOut: null,
      portalToken,
      scheduledAt: input.scheduledAt,
      closedAt: null,
      needsDiagnosis: false,
      intakeCauses: [],
      discoveredFaults: [],
      repairNotes: null,
    });

    await this.unitOfWork.execute(async () => {
      await this.orderRepo.save(order);
      await this.timelineRepo.save({
        orderId: id,
        userId: input.createdById,
        event: 'order_created',
        detail: { code, clientId: input.clientId, vehicleId: input.vehicleId },
      });
    }, [order]);

    return { id, code };
  }
}
