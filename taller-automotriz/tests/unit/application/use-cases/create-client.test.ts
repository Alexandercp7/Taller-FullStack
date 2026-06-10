import { describe, it, expect } from 'vitest';
import { CreateClientUseCase } from '../../../../src/application/use-cases/clients/create-client.use-case';
import { InMemoryClientRepository } from '../../../helpers/in-memory-client.repository';
import { createTestClient } from '../../../helpers/factories';
import { ClientTag } from '../../../../src/domain/enums/client-tag.enum';

describe('CreateClientUseCase', () => {
  it('crea un cliente nuevo con etiqueta NEW', async () => {
    const repo = new InMemoryClientRepository([]);
    const useCase = new CreateClientUseCase(repo);

    const result = await useCase.execute({ name: 'Juan Pérez', phone: '5512345678' });

    const client = await repo.findById(result.id);
    expect(client?.name).toBe('Juan Pérez');
    expect(client?.phone).toBe('5512345678');
    expect(client?.tag).toBe(ClientTag.NEW);
    expect(client?.email).toBeNull();
    expect(client?.notes).toBeNull();
  });

  it('crea un cliente con email y notas opcionales', async () => {
    const repo = new InMemoryClientRepository([]);
    const useCase = new CreateClientUseCase(repo);

    const result = await useCase.execute({ name: 'Ana López', phone: '5599998888', email: 'ana@example.com', notes: 'VIP' });

    const client = await repo.findById(result.id);
    expect(client?.email).toBe('ana@example.com');
    expect(client?.notes).toBe('VIP');
  });

  it('lanza error si ya existe un cliente con ese teléfono', async () => {
    const existing = createTestClient();
    const repo = new InMemoryClientRepository([existing]);
    const useCase = new CreateClientUseCase(repo);

    await expect(useCase.execute({ name: 'Otro', phone: existing.phone })).rejects.toThrow(
      'Ya existe un cliente con ese teléfono',
    );
  });
});
