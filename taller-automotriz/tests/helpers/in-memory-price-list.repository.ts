import { PriceListRepository, PriceListEntry } from '../../src/application/ports/repositories/price-list.repository';
import { VehicleType } from '../../src/domain/enums/vehicle-type.enum';

export class InMemoryPriceListRepository implements PriceListRepository {
  private store: PriceListEntry[];

  constructor(initial: PriceListEntry[] = []) {
    this.store = [...initial];
  }

  async findById(id: string): Promise<PriceListEntry | null> {
    return this.store.find((e) => e.id === id) ?? null;
  }

  async findAll(): Promise<PriceListEntry[]> {
    return [...this.store];
  }

  async findByVehicleType(vehicleType: VehicleType): Promise<PriceListEntry[]> {
    return this.store.filter((e) => e.vehicleType === vehicleType);
  }

  async save(entry: PriceListEntry): Promise<void> {
    const idx = this.store.findIndex((e) => e.id === entry.id);
    if (idx >= 0) this.store[idx] = entry;
    else this.store.push(entry);
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((e) => e.id !== id);
  }
}
