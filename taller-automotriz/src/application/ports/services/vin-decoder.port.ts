export interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  trim?: string;
  bodyType?: string;
}

export interface VinDecoder {
  decode(vin: string): Promise<VehicleInfo | null>;
}
