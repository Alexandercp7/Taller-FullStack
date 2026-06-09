import { OrderRepository } from '../../ports/repositories/order.repository';
import { QuoteRepository } from '../../ports/repositories/quote.repository';
import { ClientRepository } from '../../ports/repositories/client.repository';
import { PDFGenerator } from '../../ports/services/pdf-generator.port';
import { FileStorage } from '../../ports/services/file-storage.port';

interface GeneratePDFInput {
  orderId: string;
  quoteId: string;
}

export class GenerateQuotePDFUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly quoteRepo: QuoteRepository,
    private readonly clientRepo: ClientRepository,
    private readonly pdfGenerator: PDFGenerator,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: GeneratePDFInput): Promise<{ pdfUrl: string }> {
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) throw new Error('Orden no encontrada');

    const quote = await this.quoteRepo.findById(input.quoteId);
    if (!quote) throw new Error('Cotización no encontrada');

    const client = await this.clientRepo.findById(order.clientId);
    const clientName = client?.name ?? 'Cliente';

    const pdfBuffer = await this.pdfGenerator.generateQuotePDF(order, quote, clientName);

    const key = `quotes/${order.code}-${Date.now()}.pdf`;
    const uploadUrl = await this.fileStorage.getUploadUrl(key, 'application/pdf');
    const pdfUrl = await this.fileStorage.getDownloadUrl(key);

    quote.attachPdf(pdfUrl);
    await this.quoteRepo.save(quote);

    return { pdfUrl };
  }
}
