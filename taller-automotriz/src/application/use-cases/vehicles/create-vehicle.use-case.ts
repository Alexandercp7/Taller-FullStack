import { VehicleRepository } from '../../ports/repositories/vehicle.repository';
import { Vehicle } from '../../../domain/entities/vehicle.entity';
import { VehicleType } from '../../../domain/enums/vehicle-type.enum';
import { createId } from '../../../shared/identifier';

interface CreateVehicleInput {
  clientId: string;
  plates: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  vin?: string;
  type?: VehicleType;
}

export class CreateVehicleUseCase {
  constructor(private readonly vehicleRepo: VehicleRepository) {}

  async execute(input: CreateVehicleInput): Promise<{ id: string }> {
    const existing = await this.vehicleRepo.findByPlates(input.plates);
    if (existing) throw new Error('Ya existe un vehículo con esas placas');

    const vehicle = new Vehicle(
      createId(),
      input.clientId,
      input.plates,
      input.vin ?? null,
      input.brand,
      input.model,
      input.year,
      input.color ?? null,
      input.type ?? VehicleType.CAR,
      null,
    );

    await this.vehicleRepo.save(vehicle);
    return { id: vehicle.id };
  }
}
