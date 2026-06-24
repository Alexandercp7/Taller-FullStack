import { ListClientsUseCase } from '../../../../application/use-cases/clients/list-clients.use-case';
import { CreateClientUseCase } from '../../../../application/use-cases/clients/create-client.use-case';
import { DeleteClientUseCase } from '../../../../application/use-cases/clients/delete-client.use-case';
import { UpsertClientUseCase } from '../../../../application/use-cases/clients/upsert-client.use-case';
import { GetClientDetailUseCase } from '../../../../application/use-cases/clients/get-client-detail.use-case';
import type { Repos } from '../repositories';

export function buildClientUseCases(repos: Repos) {
  const { clientRepo, vehicleRepo, orderRepo } = repos;
  return {
    listClients: new ListClientsUseCase(clientRepo),
    createClient: new CreateClientUseCase(clientRepo),
    deleteClient: new DeleteClientUseCase(clientRepo),
    upsertClient: new UpsertClientUseCase(clientRepo),
    getClientDetail: new GetClientDetailUseCase(clientRepo, vehicleRepo, orderRepo),
  };
}
