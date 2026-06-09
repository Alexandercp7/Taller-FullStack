import { DomainError } from './domain-error';

export class OrderAlreadyClosedError extends DomainError {
  constructor(orderId: string) {
    super(`La orden '${orderId}' ya fue cerrada`);
  }
}
