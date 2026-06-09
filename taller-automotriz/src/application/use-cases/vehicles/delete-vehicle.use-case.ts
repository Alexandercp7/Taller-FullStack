import { VehicleRepository } from '../../ports/repositories/vehicle.repository';

export class DeleteVehicleUseCase {
  constructor(private readonly vehicleRepo: VehicleRepository) {}

  async execute(vehicleId: string): Promise<void> {
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) throw new Error('Vehículo no encontrado');
    await this.vehicleRepo.delete(vehicleId);
  }
}
