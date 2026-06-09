import { DomainError } from './domain-error';

export class ClientHasActiveOrdersError extends DomainError {
  constructor(clientId: string) {
    super(`No se puede eliminar el cliente '${clientId}': tiene órdenes activas`);
  }
}
