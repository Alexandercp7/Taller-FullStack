import { ClientRepository } from '../../ports/repositories/client.repository';
import { VehicleRepository } from '../../ports/repositories/vehicle.repository';
import { OrderRepository } from '../../ports/repositories/order.repository';

export class GetClientDetailUseCase {
  constructor(
    private readonly clientRepo: ClientRepository,
    private readonly vehicleRepo: VehicleRepository,
    private readonly orderRepo: OrderRepository,
  ) {}

  async execute(clientId: string) {
    const client = await this.clientRepo.findById(clientId);
    if (!client) throw new Error('Cliente no encontrado');

    const [vehicles, orders] = await Promise.all([
      this.vehicleRepo.findByClientId(clientId),
      this.orderRepo.findByClientId(clientId),
    ]);

    return {
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      tag: client.tag,
      notes: client.notes,
      vehicles: vehicles.map((v) => ({
        id: v.id,
        brand: v.brand,
        model: v.model,
        year: v.year,
        plates: v.plates,
        vin: v.vin,
        type: v.type,
        color: v.color,
      })),
      recentOrders: orders.slice(0, 20).map((o) => ({
        id: o.id,
        code: o.code,
        status: o.status,
        priority: o.priority,
        scheduledAt: o.scheduledAt,
        vehicleId: o.vehicleId,
      })),
    };
  }
}
