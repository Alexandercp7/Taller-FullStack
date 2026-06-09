import { PrismaClient } from '@prisma/client';
import { NoteRepository, NoteRecord } from '../../../application/ports/repositories/note.repository';
import { createId } from '../../../shared/identifier';

export class PrismaNoteRepository implements NoteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(note: Omit<NoteRecord, 'id' | 'createdAt'>): Promise<NoteRecord> {
    const record = await this.prisma.note.create({
      data: { id: createId(), ...note },
    });
    return { ...record };
  }

  async findByOrderId(orderId: string): Promise<NoteRecord[]> {
    const items = await this.prisma.note.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item) => ({ ...item }));
  }

  async update(id: string, content: string): Promise<void> {
    await this.prisma.note.update({ where: { id }, data: { content } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.note.delete({ where: { id } });
  }
}
