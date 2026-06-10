import { describe, it, expect } from 'vitest';
import { CreateVehicleUseCase } from '../../../../src/application/use-cases/vehicles/create-vehicle.use-case';
import { InMemoryVehicleRepository } from '../../../helpers/in-memory-vehicle.repository';
import { createTestVehicle } from '../../../helpers/factories';
import { VehicleType } from '../../../../src/domain/enums/vehicle-type.enum';

describe('CreateVehicleUseCase', () => {
  it('crea un vehículo con tipo CAR por defecto', async () => {
    const repo = new InMemoryVehicleRepository([]);
    const useCase = new CreateVehicleUseCase(repo);

    const result = await useCase.execute({
      clientId: 'client-1',
      plates: 'ABC-123',
      brand: 'Nissan',
      model: 'Sentra',
      year: 2020,
    });

    const vehicle = await repo.findById(result.id);
    expect(vehicle?.plates).toBe('ABC-123');
    expect(vehicle?.type).toBe(VehicleType.CAR);
    expect(vehicle?.color).toBeNull();
    expect(vehicle?.vin).toBeNull();
    expect(vehicle?.mileage).toBeNull();
  });

  it('crea un vehículo con campos opcionales', async () => {
    const repo = new InMemoryVehicleRepository([]);
    const useCase = new CreateVehicleUseCase(repo);

    const result = await useCase.execute({
      clientId: 'client-1',
      plates: 'XYZ-789',
      brand: 'Volvo',
      model: 'FH16',
      year: 2018,
      color: 'Blanco',
      vin: '1HGCM82633A004352',
      type: VehicleType.HEAVY_TRUCK,
    });

    const vehicle = await repo.findById(result.id);
    expect(vehicle?.color).toBe('Blanco');
    expect(vehicle?.vin).toBe('1HGCM82633A004352');
    expect(vehicle?.type).toBe(VehicleType.HEAVY_TRUCK);
  });

  it('lanza error si ya existe un vehículo con esas placas', async () => {
    const existing = createTestVehicle({ plates: 'ABC-123' });
    const repo = new InMemoryVehicleRepository([existing]);
    const useCase = new CreateVehicleUseCase(repo);

    await expect(
      useCase.execute({ clientId: 'client-1', plates: 'ABC-123', brand: 'Nissan', model: 'Versa', year: 2021 }),
    ).rejects.toThrow('Ya existe un vehículo con esas placas');
  });
});
