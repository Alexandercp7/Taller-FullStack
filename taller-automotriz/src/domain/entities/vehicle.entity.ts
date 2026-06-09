import { VehicleType } from '../enums/vehicle-type.enum';

export class Vehicle {
  constructor(
    public readonly id: string,
    public readonly clientId: string,
    private _plates: string,
    private _vin: string | null,
    private _brand: string,
    private _model: string,
    private _year: number,
    private _color: string | null,
    private _type: VehicleType,
    private _mileage: number | null,
  ) {}

  get plates(): string { return this._plates; }
  get vin(): string | null { return this._vin; }
  get brand(): string { return this._brand; }
  get model(): string { return this._model; }
  get year(): number { return this._year; }
  get color(): string | null { return this._color; }
  get type(): VehicleType { return this._type; }
  get mileage(): number | null { return this._mileage; }

  associateVin(vin: string): void {
    this._vin = vin;
  }

  updateMileage(km: number): void {
    this._mileage = km;
  }

  updateInfo(data: {
    plates?: string;
    brand?: string;
    model?: string;
    year?: number;
    color?: string | null;
    type?: VehicleType;
  }): void {
    if (data.plates !== undefined) this._plates = data.plates;
    if (data.brand !== undefined) this._brand = data.brand;
    if (data.model !== undefined) this._model = data.model;
    if (data.year !== undefined) this._year = data.year;
    if (data.color !== undefined) this._color = data.color;
    if (data.type !== undefined) this._type = data.type;
  }
}
