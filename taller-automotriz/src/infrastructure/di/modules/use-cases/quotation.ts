import { CalculateQuoteTotalUseCase } from '../../../../application/use-cases/quotation/calculate-quote-total.use-case';
import { GenerateQuotePDFUseCase } from '../../../../application/use-cases/quotation/generate-quote-pdf.use-case';
import type { Repos } from '../repositories';
import type { Infra } from '../infra';

export function buildQuotationUseCases(repos: Repos, infra: Infra) {
  const { orderRepo, clientRepo, quoteRepo, inventoryRepo, priceListRepo } = repos;
  const { pdfGenerator, fileStorage } = infra;
  return {
    calculateQuoteTotal: new CalculateQuoteTotalUseCase(quoteRepo, inventoryRepo, priceListRepo),
    generateQuotePDF: new GenerateQuotePDFUseCase(orderRepo, quoteRepo, clientRepo, pdfGenerator, fileStorage),
  };
}
