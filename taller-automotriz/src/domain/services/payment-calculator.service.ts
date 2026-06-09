import { Money } from '../value-objects/money.vo';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentExceedsBalanceError } from '../errors/payment-exceeds-balance.error';

export interface PaymentCalculationResult {
  newPaid: Money;
  newBalance: Money;
  newStatus: PaymentStatus;
}

export class PaymentCalculator {
  static applyPayment(
    totalAmount: Money,
    currentPaid: Money,
    paymentAmount: Money,
  ): PaymentCalculationResult {
    const currentBalance = totalAmount.subtract(currentPaid);

    if (paymentAmount.isGreaterThan(currentBalance)) {
      throw new PaymentExceedsBalanceError(paymentAmount.amount, currentBalance.amount);
    }

    const newPaid = currentPaid.add(paymentAmount);
    const newBalance = totalAmount.subtract(newPaid);
    const newStatus = newBalance.isZero() ? PaymentStatus.PAID : PaymentStatus.PARTIAL;

    return { newPaid, newBalance, newStatus };
  }

  static isOverdue(dueDate: Date | null, status: PaymentStatus): boolean {
    if (!dueDate || status === PaymentStatus.PAID) return false;
    return new Date() > dueDate;
  }
}
