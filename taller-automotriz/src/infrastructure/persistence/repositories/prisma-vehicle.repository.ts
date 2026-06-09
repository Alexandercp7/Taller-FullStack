import { PrismaClient } from '@prisma/client';
import { VehicleRepository } from '../../../application/ports/repositories/vehicle.repository';
import { Vehicle } from '../../../domain/entities/vehicle.entity';
import { VehicleType } from '../../../domain/enums/vehicle-type.enum';

export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(raw: any): Vehicle {
    return new Vehicle(
      raw.id,
      raw.clientId,
      raw.plates,
      raw.vin,
      raw.brand,
      raw.model,
      raw.year,
      raw.color,
      raw.type as VehicleType,
      raw.mileage,
    );
  }

  async findById(id: string): Promise<Vehicle | null> {
    const raw = await this.prisma.vehicle.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByPlates(plates: string): Promise<Vehicle | null> {
    const raw = await this.prisma.vehicle.findUnique({ where: { plates } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByVin(vin: string): Promise<Vehicle | null> {
    const raw = await this.prisma.vehicle.findFirst({ where: { vin } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByClientId(clientId: string): Promise<Vehicle[]> {
    const items = await this.prisma.vehicle.findMany({ where: { clientId } });
    return items.map(this.toDomain.bind(this));
  }

  async findAll(page: number, pageSize: number): Promise<{ data: Vehicle[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        orderBy: { brand: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.vehicle.count(),
    ]);
    return { data: items.map(this.toDomain.bind(this)), total };
  }

  async save(vehicle: Vehicle): Promise<void> {
    const data = {
      id: vehicle.id,
      clientId: vehicle.clientId,
      plates: vehicle.plates,
      vin: vehicle.vin,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      type: vehicle.type as any,
      mileage: vehicle.mileage,
    };

    await this.prisma.vehicle.upsert({
      where: { id: vehicle.id },
      create: data,
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.vehicle.delete({ where: { id } });
  }
}
