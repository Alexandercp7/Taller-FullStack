import { AccountReceivable } from '../../../domain/entities/account-receivable.entity';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';

export interface AccountReceivableRepository {
  findById(id: string): Promise<AccountReceivable | null>;
  findByOrderId(orderId: string): Promise<AccountReceivable | null>;
  findByClientId(clientId: string): Promise<AccountReceivable[]>;
  findOverdue(): Promise<AccountReceivable[]>;
  save(account: AccountReceivable): Promise<void>;
  savePayment(accountId: string, amount: number, method: string, userId: string): Promise<void>;
}
