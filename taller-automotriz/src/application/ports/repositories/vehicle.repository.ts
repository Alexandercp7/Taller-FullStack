import { Vehicle } from '../../../domain/entities/vehicle.entity';

export interface VehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  findByPlates(plates: string): Promise<Vehicle | null>;
  findByVin(vin: string): Promise<Vehicle | null>;
  findByClientId(clientId: string): Promise<Vehicle[]>;
  findAll(page: number, pageSize: number): Promise<{ data: Vehicle[]; total: number }>;
  save(vehicle: Vehicle): Promise<void>;
  delete(id: string): Promise<void>;
}
