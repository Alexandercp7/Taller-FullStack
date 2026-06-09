import { VehicleRepository } from '../../ports/repositories/vehicle.repository';
import { VinDecoder, VehicleInfo } from '../../ports/services/vin-decoder.port';

interface DecodeVinInput {
  vin: string;
  vehicleId?: string;
}

export class DecodeVinUseCase {
  constructor(
    private readonly vehicleRepo: VehicleRepository,
    private readonly vinDecoder: VinDecoder,
  ) {}

  async execute(input: DecodeVinInput): Promise<VehicleInfo | null> {
    const info = await this.vinDecoder.decode(input.vin);

    if (info && input.vehicleId) {
      const vehicle = await this.vehicleRepo.findById(input.vehicleId);
      if (vehicle) {
        vehicle.associateVin(input.vin);
        await this.vehicleRepo.save(vehicle);
      }
    }

    return info;
  }
}
