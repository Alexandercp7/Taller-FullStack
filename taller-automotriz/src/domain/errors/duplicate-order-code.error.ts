import { DomainError } from './domain-error';

export class DuplicateOrderCodeError extends DomainError {
  constructor(public readonly code: string) {
    super(`El código de OT "${code}" ya existe`);
  }
}
