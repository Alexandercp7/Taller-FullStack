import type { User as PrismaUser } from '@prisma/client';
import { User } from '../../../../domain/entities/user.entity';
import { UserRole } from '../../../../domain/enums/user-role.enum';

export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    return new User(
      raw.id,
      raw.name,
      raw.email,
      raw.passwordHash,
      raw.role as UserRole,
      raw.permissions,
      raw.isActive,
    );
  }

  static toPersistence(entity: User): Omit<PrismaUser, 'createdAt' | 'updatedAt' | 'kpiRole'> {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      passwordHash: entity.passwordHash,
      role: entity.role as PrismaUser['role'],
      permissions: entity.permissions,
      isActive: entity.isActive,
    };
  }
}
