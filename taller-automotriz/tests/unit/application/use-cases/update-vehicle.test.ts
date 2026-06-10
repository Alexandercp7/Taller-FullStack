import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateVehicleUseCase } from '../../../../src/application/use-cases/vehicles/update-vehicle.use-case';
import { InMemoryVehicleRepository } from '../../../helpers/in-memory-vehicle.repository';
import { createTestVehicle } from '../../../helpers/factories';

describe('UpdateVehicleUseCase', () => {
  let repo: InMemoryVehicleRepository;
  let useCase: UpdateVehicleUseCase;

  beforeEach(() => {
    const vehicle = createTestVehicle({ id: 'vehicle-1', plates: 'ABC-123' });
    repo = new InMemoryVehicleRepository([vehicle]);
    useCase = new UpdateVehicleUseCase(repo);
  });

  it('actualiza los campos provistos', async () => {
    await useCase.execute({ vehicleId: 'vehicle-1', brand: 'Toyota', year: 2022 });

    const vehicle = await repo.findById('vehicle-1');
    expect(vehicle?.brand).toBe('Toyota');
    expect(vehicle?.year).toBe(2022);
  });

  it('permite mantener las mismas placas sin conflicto', async () => {
    await useCase.execute({ vehicleId: 'vehicle-1', plates: 'ABC-123', brand: 'Toyota' });

    const vehicle = await repo.findById('vehicle-1');
    expect(vehicle?.plates).toBe('ABC-123');
    expect(vehicle?.brand).toBe('Toyota');
  });

  it('lanza error si el vehículo no existe', async () => {
    await expect(useCase.execute({ vehicleId: 'no-existe', brand: 'Toyota' })).rejects.toThrow('Vehículo no encontrado');
  });

  it('lanza error si las nuevas placas ya pertenecen a otro vehículo', async () => {
    const other = createTestVehicle({ id: 'vehicle-2', plates: 'XYZ-999' });
    repo = new InMemoryVehicleRepository([await repo.findById('vehicle-1') as any, other]);
    useCase = new UpdateVehicleUseCase(repo);

    await expect(useCase.execute({ vehicleId: 'vehicle-1', plates: 'XYZ-999' })).rejects.toThrow(
      'Ya existe un vehículo con esas placas',
    );
  });
});
