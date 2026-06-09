import { DomainError } from './domain-error';

export class PaymentExceedsBalanceError extends DomainError {
  constructor(payment: number, balance: number) {
    super(`El pago ($${payment}) excede el saldo pendiente ($${balance})`);
  }
}
