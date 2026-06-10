import { describe, it, expect } from 'vitest';
import { DeleteClientUseCase } from '../../../../src/application/use-cases/clients/delete-client.use-case';
import { InMemoryClientRepository } from '../../../helpers/in-memory-client.repository';
import { createTestClient } from '../../../helpers/factories';
import { ClientHasActiveOrdersError } from '../../../../src/domain/errors/client-has-active-orders.error';

describe('DeleteClientUseCase', () => {
  it('elimina un cliente sin órdenes activas', async () => {
    const client = createTestClient({ id: 'client-1' });
    const repo = new InMemoryClientRepository([client]);
    const useCase = new DeleteClientUseCase(repo);

    await useCase.execute('client-1');

    expect(await repo.findById('client-1')).toBeNull();
  });

  it('lanza error si el cliente no existe', async () => {
    const repo = new InMemoryClientRepository([]);
    const useCase = new DeleteClientUseCase(repo);

    await expect(useCase.execute('no-existe')).rejects.toThrow('Cliente no encontrado');
  });

  it('lanza error si el cliente tiene órdenes activas', async () => {
    const client = createTestClient({ id: 'client-1' });
    const repo = new InMemoryClientRepository([client]);
    repo.activeOrdersByClient.set('client-1', true);
    const useCase = new DeleteClientUseCase(repo);

    await expect(useCase.execute('client-1')).rejects.toThrow(ClientHasActiveOrdersError);
    expect(await repo.findById('client-1')).not.toBeNull();
  });
});
