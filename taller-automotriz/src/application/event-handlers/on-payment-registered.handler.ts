import { PaymentRegistered } from '../../domain/events/payment-registered.event';
import { ClientRepository } from '../ports/repositories/client.repository';
import { ClientTagger } from '../../domain/services/client-tagger.service';

export class OnPaymentRegisteredHandler {
  constructor(private readonly clientRepo: ClientRepository) {}

  async handle(event: PaymentRegistered): Promise<void> {
    const client = await this.clientRepo.findById(event.clientId);
    if (!client) return;

    const totalOrders = await this.clientRepo.countOrders(event.clientId);
    const hasPendingDebt = !event.isPaid;
    const tag = ClientTagger.determineTag({ totalOrders, hasPendingDebt });
    client.updateTag(tag);
    await this.clientRepo.save(client);
  }
}
