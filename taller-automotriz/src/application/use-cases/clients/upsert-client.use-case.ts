import { ClientRepository } from '../../ports/repositories/client.repository';
import { Client } from '../../../domain/entities/client.entity';
import { ClientTag } from '../../../domain/enums/client-tag.enum';
import { createId } from '../../../shared/identifier';

interface UpsertClientInput {
  phone: string;
  name: string;
  email?: string;
  notes?: string;
}

export class UpsertClientUseCase {
  constructor(private readonly clientRepo: ClientRepository) {}

  async execute(input: UpsertClientInput): Promise<{ id: string; isNew: boolean }> {
    const existing = await this.clientRepo.findByPhone(input.phone);

    if (existing) {
      existing.updateInfo({ name: input.name, email: input.email ?? null, notes: input.notes ?? null });
      await this.clientRepo.save(existing);
      return { id: existing.id, isNew: false };
    }

    const client = new Client(
      createId(),
      input.name,
      input.phone,
      input.email ?? null,
      ClientTag.NEW,
      input.notes ?? null,
      new Date(),
    );

    await this.clientRepo.save(client);
    return { id: client.id, isNew: true };
  }
}
