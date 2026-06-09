import { Quote } from '../../../domain/entities/quote.entity';

export interface QuoteRepository {
  findById(id: string): Promise<Quote | null>;
  findByOrderId(orderId: string): Promise<Quote[]>;
  save(quote: Quote): Promise<void>;
  delete(id: string): Promise<void>;
}
