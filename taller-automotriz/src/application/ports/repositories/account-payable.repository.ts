import { AccountPayable } from '../../../domain/entities/account-payable.entity';

export interface AccountPayableRepository {
  findById(id: string): Promise<AccountPayable | null>;
  findBySupplierId(supplierId: string): Promise<AccountPayable[]>;
  findOverdue(): Promise<AccountPayable[]>;
  save(account: AccountPayable): Promise<void>;
  savePayment(accountId: string, amount: number, method: string, userId: string): Promise<void>;
}
