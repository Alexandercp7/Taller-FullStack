import { DomainError } from './domain-error';

export class InvalidValueObjectError extends DomainError {
  constructor(type: string, reason: string) {
    super(`${type} inválido: ${reason}`);
  }
}
