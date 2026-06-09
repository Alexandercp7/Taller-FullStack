import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../../../application/ports/repositories/user.repository';
import { User } from '../../../domain/entities/user.entity';
import { UserMapper } from '../prisma/mappers/user.mapper';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { id } });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { email } });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findAll(): Promise<User[]> {
    const items = await this.prisma.user.findMany({ orderBy: { name: 'asc' } });
    return items.map(UserMapper.toDomain);
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: { ...data, createdAt: new Date() },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
