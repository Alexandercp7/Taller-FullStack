import { ClientRepository } from '../../ports/repositories/client.repository';
import { Client } from '../../../domain/entities/client.entity';
import { ClientTag } from '../../../domain/enums/client-tag.enum';
import { createId } from '../../../shared/identifier';

interface CreateClientInput {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export class CreateClientUseCase {
  constructor(private readonly clientRepo: ClientRepository) {}

  async execute(input: CreateClientInput): Promise<{ id: string }> {
    const existing = await this.clientRepo.findByPhone(input.phone);
    if (existing) throw new Error('Ya existe un cliente con ese teléfono');

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
    return { id: client.id };
  }
}
