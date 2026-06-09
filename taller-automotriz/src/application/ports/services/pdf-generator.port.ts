import { WorkOrder } from '../../../domain/entities/work-order.entity';
import { Quote } from '../../../domain/entities/quote.entity';

export interface PDFGenerator {
  generateQuotePDF(order: WorkOrder, quote: Quote, clientName: string): Promise<Buffer>;
}
