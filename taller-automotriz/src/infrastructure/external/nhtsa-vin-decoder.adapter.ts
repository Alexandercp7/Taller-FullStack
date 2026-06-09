import { VinDecoder, VehicleInfo } from '../../application/ports/services/vin-decoder.port';
import { Cache } from '../../application/ports/services/cache.port';

export class NHTSAVinDecoderAdapter implements VinDecoder {
  constructor(private readonly cache: Cache) {}

  async decode(vin: string): Promise<VehicleInfo | null> {
    const cacheKey = `vin:${vin}`;
    const cached = await this.cache.get<VehicleInfo>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`,
      );
      const data = (await response.json()) as { Results: Array<{ Variable: string; Value: string }> };

      const get = (variable: string) =>
        data.Results.find((r) => r.Variable === variable)?.Value ?? '';

      const make = get('Make');
      const model = get('Model');
      const yearStr = get('Model Year');
      const year = parseInt(yearStr, 10);

      if (!make || !model || isNaN(year)) return null;

      const info: VehicleInfo = { make, model, year, trim: get('Trim'), bodyType: get('Body Class') };
      await this.cache.set(cacheKey, info, 86400);
      return info;
    } catch {
      return null;
    }
  }
}
