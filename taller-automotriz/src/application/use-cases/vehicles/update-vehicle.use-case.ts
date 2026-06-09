import { VehicleRepository } from '../../ports/repositories/vehicle.repository';
import { VehicleType } from '../../../domain/enums/vehicle-type.enum';

interface UpdateVehicleInput {
  vehicleId: string;
  plates?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string | null;
  type?: VehicleType;
}

export class UpdateVehicleUseCase {
  constructor(private readonly vehicleRepo: VehicleRepository) {}

  async execute(input: UpdateVehicleInput): Promise<void> {
    const { vehicleId, ...fields } = input;
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) throw new Error('Vehículo no encontrado');

    if (fields.plates && fields.plates !== vehicle.plates) {
      const conflict = await this.vehicleRepo.findByPlates(fields.plates);
      if (conflict) throw new Error('Ya existe un vehículo con esas placas');
    }

    vehicle.updateInfo(fields);
    await this.vehicleRepo.save(vehicle);
  }
}
