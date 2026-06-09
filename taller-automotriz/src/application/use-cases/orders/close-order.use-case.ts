import { OrderRepository } from '../../ports/repositories/order.repository';
import { ClientRepository } from '../../ports/repositories/client.repository';
import { AccountReceivableRepository } from '../../ports/repositories/account-receivable.repository';
import { TimelineRepository } from '../../ports/repositories/timeline.repository';
import { UnitOfWork } from '../../ports/unit-of-work.port';
import { AccountReceivable } from '../../../domain/entities/account-receivable.entity';
import { Money } from '../../../domain/value-objects/money.vo';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import { ClientTagger } from '../../../domain/services/client-tagger.service';
import { createId } from '../../../shared/identifier';

interface CloseOrderInput {
  orderId: string;
  userId: string;
  totalAmount: number;
  dueDate?: Date;
}

export class CloseOrderUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly clientRepo: ClientRepository,
    private readonly arRepo: AccountReceivableRepository,
    private readonly timelineRepo: TimelineRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: CloseOrderInput): Promise<void> {
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) throw new Error('Orden no encontrada');

    order.close(input.userId);

    const total = Money.fromAmount(input.totalAmount);
    const ar = new AccountReceivable(
      createId(),
      order.id,
      order.clientId,
      total,
      Money.zero(),
      total,
      PaymentStatus.PENDING,
      input.dueDate ?? null,
    );

    await this.unitOfWork.execute(async () => {
      await this.orderRepo.save(order);
      await this.arRepo.save(ar);
      await this.timelineRepo.save({
        orderId: input.orderId,
        userId: input.userId,
        event: 'order_closed',
        detail: { totalAmount: input.totalAmount },
      });
    }, [order]);

    const client = await this.clientRepo.findById(order.clientId);
    if (client) {
      const totalOrders = await this.clientRepo.countOrders(order.clientId);
      const hasPendingDebt = await this.clientRepo.hasPendingDebt(order.clientId);
      const tag = ClientTagger.determineTag({ totalOrders, hasPendingDebt });
      client.updateTag(tag);
      await this.clientRepo.save(client);
    }
  }
}
