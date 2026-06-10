import { VehicleRepository } from '../../src/application/ports/repositories/vehicle.repository';
import { Vehicle } from '../../src/domain/entities/vehicle.entity';

export class InMemoryVehicleRepository implements VehicleRepository {
  private store: Vehicle[];

  constructor(initial: Vehicle[] = []) {
    this.store = [...initial];
  }

  async findById(id: string): Promise<Vehicle | null> {
    return this.store.find((v) => v.id === id) ?? null;
  }

  async findByPlates(plates: string): Promise<Vehicle | null> {
    return this.store.find((v) => v.plates === plates) ?? null;
  }

  async findByVin(vin: string): Promise<Vehicle | null> {
    return this.store.find((v) => v.vin === vin) ?? null;
  }

  async findByClientId(clientId: string): Promise<Vehicle[]> {
    return this.store.filter((v) => v.clientId === clientId);
  }

  async findAll(page: number, pageSize: number): Promise<{ data: Vehicle[]; total: number }> {
    const start = (page - 1) * pageSize;
    return { data: this.store.slice(start, start + pageSize), total: this.store.length };
  }

  async save(vehicle: Vehicle): Promise<void> {
    const idx = this.store.findIndex((v) => v.id === vehicle.id);
    if (idx >= 0) this.store[idx] = vehicle;
    else this.store.push(vehicle);
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((v) => v.id !== id);
  }
}
