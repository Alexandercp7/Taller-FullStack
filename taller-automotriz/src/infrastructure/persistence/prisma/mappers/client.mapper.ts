import type { Client as PrismaClient } from '@prisma/client';
import { Client } from '../../../../domain/entities/client.entity';
import { ClientTag } from '../../../../domain/enums/client-tag.enum';

export class ClientMapper {
  static toDomain(raw: PrismaClient): Client {
    return new Client(
      raw.id,
      raw.name,
      raw.phone,
      raw.email,
      raw.tag as ClientTag,
      raw.notes,
      raw.createdAt,
    );
  }

  static toPersistence(entity: Client): Omit<PrismaClient, 'createdAt' | 'updatedAt'> {
    return {
      id: entity.id,
      name: entity.name,
      phone: entity.phone,
      email: entity.email,
      tag: entity.tag,
      notes: entity.notes,
    };
  }
}
