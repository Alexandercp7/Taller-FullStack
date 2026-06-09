import { DomainError } from './domain-error';

export class InsufficientStockError extends DomainError {
  constructor(available: number, requested: number) {
    super(`Stock insuficiente: disponible ${available}, solicitado ${requested}`);
  }
}
