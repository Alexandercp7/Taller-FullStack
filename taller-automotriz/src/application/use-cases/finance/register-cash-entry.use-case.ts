import { CashEntryRepository } from '../../ports/repositories/cash-entry.repository';
import { CashEntry } from '../../../domain/entities/cash-entry.entity';
import { CashType } from '../../../domain/enums/cash-type.enum';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';
import { Money } from '../../../domain/value-objects/money.vo';
import { createId } from '../../../shared/identifier';

interface RegisterCashEntryInput {
  type: CashType;
  amount: number;
  description: string;
  method: PaymentMethod;
  orderId?: string;
  userId: string;
  date?: Date;
}

export class RegisterCashEntryUseCase {
  constructor(private readonly cashEntryRepo: CashEntryRepository) {}

  async execute(input: RegisterCashEntryInput): Promise<{ id: string }> {
    const entry = new CashEntry(
      createId(),
      input.type,
      Money.fromAmount(input.amount),
      input.description,
      input.method,
      input.orderId ?? null,
      input.userId,
      input.date ?? new Date(),
    );

    await this.cashEntryRepo.save(entry);
    return { id: entry.id };
  }
}
