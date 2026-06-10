import { describe, it, expect } from 'vitest';
import { UpsertClientUseCase } from '../../../../src/application/use-cases/clients/upsert-client.use-case';
import { InMemoryClientRepository } from '../../../helpers/in-memory-client.repository';
import { createTestClient } from '../../../helpers/factories';

describe('UpsertClientUseCase', () => {
  it('crea un nuevo cliente si el teléfono no existe', async () => {
    const repo = new InMemoryClientRepository([]);
    const useCase = new UpsertClientUseCase(repo);

    const result = await useCase.execute({ phone: '5512345678', name: 'Juan Pérez' });

    expect(result.isNew).toBe(true);
    const client = await repo.findById(result.id);
    expect(client?.name).toBe('Juan Pérez');
  });

  it('actualiza un cliente existente si el teléfono ya existe', async () => {
    const existing = createTestClient({ id: 'client-1' });
    const repo = new InMemoryClientRepository([existing]);
    const useCase = new UpsertClientUseCase(repo);

    const result = await useCase.execute({
      phone: existing.phone,
      name: 'Nombre Actualizado',
      email: 'nuevo@example.com',
      notes: 'Nota nueva',
    });

    expect(result.isNew).toBe(false);
    expect(result.id).toBe('client-1');

    const client = await repo.findById('client-1');
    expect(client?.name).toBe('Nombre Actualizado');
    expect(client?.email).toBe('nuevo@example.com');
    expect(client?.notes).toBe('Nota nueva');
  });

  it('limpia email y notas a null si no se proveen al actualizar', async () => {
    const existing = createTestClient({ id: 'client-1' });
    existing.updateInfo({ email: 'viejo@example.com', notes: 'Nota vieja' });
    const repo = new InMemoryClientRepository([existing]);
    const useCase = new UpsertClientUseCase(repo);

    await useCase.execute({ phone: existing.phone, name: 'Nombre' });

    const client = await repo.findById('client-1');
    expect(client?.email).toBeNull();
    expect(client?.notes).toBeNull();
  });
});
