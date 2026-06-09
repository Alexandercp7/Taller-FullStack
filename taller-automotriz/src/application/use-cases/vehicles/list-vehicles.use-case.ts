import { VehicleRepository } from '../../ports/repositories/vehicle.repository';
import { Vehicle } from '../../../domain/entities/vehicle.entity';

interface ListVehiclesInput {
  clientId?: string;
  page: number;
  pageSize: number;
}

export class ListVehiclesUseCase {
  constructor(private readonly vehicleRepo: VehicleRepository) {}

  async execute(input: ListVehiclesInput): Promise<{ data: Vehicle[]; total: number }> {
    if (input.clientId) {
      const data = await this.vehicleRepo.findByClientId(input.clientId);
      const start = (input.page - 1) * input.pageSize;
      return { data: data.slice(start, start + input.pageSize), total: data.length };
    }
    return this.vehicleRepo.findAll(input.page, input.pageSize);
  }
}
