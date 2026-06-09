import { QuoteRepository } from '../../ports/repositories/quote.repository';
import { InventoryRepository } from '../../ports/repositories/inventory.repository';
import { PriceListRepository } from '../../ports/repositories/price-list.repository';
import { Quote } from '../../../domain/entities/quote.entity';
import { QuoteCalculator } from '../../../domain/services/quote-calculator.service';
import { Money } from '../../../domain/value-objects/money.vo';
import { createId } from '../../../shared/identifier';

interface CalculateQuoteInput {
  orderId: string;
  serviceId?: string;
  assignedPartIds: Array<{ itemId: string; quantity: number }>;
}

export class CalculateQuoteTotalUseCase {
  constructor(
    private readonly quoteRepo: QuoteRepository,
    private readonly inventoryRepo: InventoryRepository,
    private readonly priceListRepo: PriceListRepository,
  ) {}

  async execute(input: CalculateQuoteInput): Promise<Quote> {
    let partsSubtotal = Money.zero();

    for (const part of input.assignedPartIds) {
      const item = await this.inventoryRepo.findById(part.itemId);
      if (item) {
        partsSubtotal = partsSubtotal.add(item.salePrice.multiply(part.quantity));
      }
    }

    let servicePrice = Money.zero();
    if (input.serviceId) {
      const service = await this.priceListRepo.findById(input.serviceId);
      if (service) servicePrice = Money.fromAmount(service.price);
    }

    const { subtotal, tax, total } = QuoteCalculator.calculateTotal(partsSubtotal, servicePrice);

    const existingQuotes = await this.quoteRepo.findByOrderId(input.orderId);
    const existing = existingQuotes[0];

    if (existing) {
      existing.updateTotals(subtotal, tax, total);
      if (input.serviceId) existing.assignService(input.serviceId);
      await this.quoteRepo.save(existing);
      return existing;
    }

    const quote = new Quote(
      createId(),
      input.orderId,
      input.serviceId ?? null,
      subtotal,
      tax,
      total,
      false,
      null,
      null,
    );

    await this.quoteRepo.save(quote);
    return quote;
  }
}
