import { VehicleType } from '../../../domain/enums/vehicle-type.enum';

export interface PriceListEntry {
  id: string;
  name: string;
  description: string | null;
  vehicleType: VehicleType;
  price: number;
  isActive: boolean;
}

export interface PriceListRepository {
  findById(id: string): Promise<PriceListEntry | null>;
  findAll(): Promise<PriceListEntry[]>;
  findByVehicleType(vehicleType: VehicleType): Promise<PriceListEntry[]>;
  save(entry: PriceListEntry): Promise<void>;
  delete(id: string): Promise<void>;
}
