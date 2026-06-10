import { QuoteRepository } from '../../src/application/ports/repositories/quote.repository';
import { Quote } from '../../src/domain/entities/quote.entity';

export class InMemoryQuoteRepository implements QuoteRepository {
  private store: Quote[];

  constructor(initial: Quote[] = []) {
    this.store = [...initial];
  }

  async findById(id: string): Promise<Quote | null> {
    return this.store.find((q) => q.id === id) ?? null;
  }

  async findByOrderId(orderId: string): Promise<Quote[]> {
    return this.store.filter((q) => q.orderId === orderId);
  }

  async save(quote: Quote): Promise<void> {
    const idx = this.store.findIndex((q) => q.id === quote.id);
    if (idx >= 0) this.store[idx] = quote;
    else this.store.push(quote);
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((q) => q.id !== id);
  }
}
