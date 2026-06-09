import { PrismaClient } from '@prisma/client';
import { PhotoRepository, PhotoRecord } from '../../../application/ports/repositories/photo.repository';
import { PhotoPhase } from '../../../domain/enums/photo-phase.enum';
import { createId } from '../../../shared/identifier';

export class PrismaPhotoRepository implements PhotoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(photo: Omit<PhotoRecord, 'id' | 'createdAt'>): Promise<PhotoRecord> {
    const record = await this.prisma.photo.create({
      data: {
        id: createId(),
        orderId: photo.orderId,
        phase: photo.phase as any,
        url: photo.url,
        key: photo.key,
        caption: photo.caption,
        uploadedBy: photo.uploadedBy,
      },
    });

    return {
      id: record.id,
      orderId: record.orderId,
      phase: record.phase as PhotoPhase,
      url: record.url,
      key: record.key,
      caption: record.caption,
      uploadedBy: record.uploadedBy,
      createdAt: record.createdAt,
    };
  }

  async findByOrderId(orderId: string, phase?: PhotoPhase): Promise<PhotoRecord[]> {
    const items = await this.prisma.photo.findMany({
      where: { orderId, ...(phase ? { phase: phase as any } : {}) },
      orderBy: { createdAt: 'asc' },
    });

    return items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      phase: item.phase as PhotoPhase,
      url: item.url,
      key: item.key,
      caption: item.caption,
      uploadedBy: item.uploadedBy,
      createdAt: item.createdAt,
    }));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.photo.delete({ where: { id } });
  }
}
