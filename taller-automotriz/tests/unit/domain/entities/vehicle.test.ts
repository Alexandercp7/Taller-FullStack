import { describe, it, expect } from 'vitest';
import { Vehicle } from '../../../../src/domain/entities/vehicle.entity';
import { VehicleType } from '../../../../src/domain/enums/vehicle-type.enum';

function buildVehicle(overrides: Partial<{ vin: string | null; mileage: number | null }> = {}): Vehicle {
  return new Vehicle(
    'vehicle-1',
    'client-1',
    'ABC-123',
    overrides.vin ?? null,
    'Nissan',
    'Sentra',
    2020,
    'Rojo',
    VehicleType.CAR,
    overrides.mileage ?? 50000,
  );
}

describe('Vehicle', () => {
  it('expone los datos iniciales mediante getters', () => {
    const vehicle = buildVehicle({ vin: '1HGCM82633A004352', mileage: 12345 });

    expect(vehicle.plates).toBe('ABC-123');
    expect(vehicle.vin).toBe('1HGCM82633A004352');
    expect(vehicle.brand).toBe('Nissan');
    expect(vehicle.model).toBe('Sentra');
    expect(vehicle.year).toBe(2020);
    expect(vehicle.color).toBe('Rojo');
    expect(vehicle.type).toBe(VehicleType.CAR);
    expect(vehicle.mileage).toBe(12345);
  });

  it('associateVin asigna el VIN del vehículo', () => {
    const vehicle = buildVehicle({ vin: null });

    vehicle.associateVin('1HGCM82633A004352');

    expect(vehicle.vin).toBe('1HGCM82633A004352');
  });

  it('updateMileage actualiza el kilometraje', () => {
    const vehicle = buildVehicle({ mileage: 1000 });

    vehicle.updateMileage(2000);

    expect(vehicle.mileage).toBe(2000);
  });

  describe('updateInfo', () => {
    it('actualiza solo los campos provistos', () => {
      const vehicle = buildVehicle();

      vehicle.updateInfo({ brand: 'Toyota', year: 2022 });

      expect(vehicle.brand).toBe('Toyota');
      expect(vehicle.year).toBe(2022);
      expect(vehicle.model).toBe('Sentra');
      expect(vehicle.plates).toBe('ABC-123');
    });

    it('permite cambiar el color a null', () => {
      const vehicle = buildVehicle();

      vehicle.updateInfo({ color: null });

      expect(vehicle.color).toBeNull();
    });

    it('permite cambiar el tipo de vehículo', () => {
      const vehicle = buildVehicle();

      vehicle.updateInfo({ type: VehicleType.HEAVY_TRUCK });

      expect(vehicle.type).toBe(VehicleType.HEAVY_TRUCK);
    });

    it('no modifica nada si no se pasan campos', () => {
      const vehicle = buildVehicle();

      vehicle.updateInfo({});

      expect(vehicle.brand).toBe('Nissan');
      expect(vehicle.model).toBe('Sentra');
      expect(vehicle.year).toBe(2020);
    });
  });
});
