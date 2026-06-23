import { ListVehiclesUseCase } from '../../../../application/use-cases/vehicles/list-vehicles.use-case';
import { CreateVehicleUseCase } from '../../../../application/use-cases/vehicles/create-vehicle.use-case';
import { UpdateVehicleUseCase } from '../../../../application/use-cases/vehicles/update-vehicle.use-case';
import { DeleteVehicleUseCase } from '../../../../application/use-cases/vehicles/delete-vehicle.use-case';
import { DecodeVinUseCase } from '../../../../application/use-cases/vehicles/decode-vin.use-case';
import { CheckRecallsUseCase } from '../../../../application/use-cases/vehicles/check-recalls.use-case';
import type { Repos } from '../repositories';
import type { Infra } from '../infra';

export function buildVehicleUseCases(repos: Repos, infra: Infra) {
  const { vehicleRepo, recallChecker } = repos;
  const { vinDecoder } = infra;
  return {
    listVehicles: new ListVehiclesUseCase(vehicleRepo),
    createVehicle: new CreateVehicleUseCase(vehicleRepo),
    updateVehicle: new UpdateVehicleUseCase(vehicleRepo),
    deleteVehicle: new DeleteVehicleUseCase(vehicleRepo),
    decodeVin: new DecodeVinUseCase(vehicleRepo, vinDecoder),
    checkRecalls: new CheckRecallsUseCase(recallChecker),
  };
}
