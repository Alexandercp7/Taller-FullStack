import { DomainError } from './domain-error';

export class InvalidStateTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Transición inválida: no se puede pasar de '${from}' a '${to}'`);
  }
}
