import { ClientRepository } from '../../ports/repositories/client.repository';
import { ClientHasActiveOrdersError } from '../../../domain/errors/client-has-active-orders.error';

export class DeleteClientUseCase {
  constructor(private readonly clientRepo: ClientRepository) {}

  async execute(clientId: string): Promise<void> {
    const client = await this.clientRepo.findById(clientId);
    if (!client) throw new Error('Cliente no encontrado');

    const hasActive = await this.clientRepo.hasActiveOrders(clientId);
    if (hasActive) throw new ClientHasActiveOrdersError(clientId);

    await this.clientRepo.delete(clientId);
  }
}
