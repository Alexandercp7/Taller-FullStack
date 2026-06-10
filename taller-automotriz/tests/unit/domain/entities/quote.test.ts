import { describe, it, expect } from 'vitest';
import { Quote } from '../../../../src/domain/entities/quote.entity';
import { Money } from '../../../../src/domain/value-objects/money.vo';

function buildQuote(overrides: Partial<{ serviceId: string | null; isApproved: boolean; approvedAt: Date | null; pdfUrl: string | null }> = {}): Quote {
  return new Quote(
    'quote-1',
    'order-1',
    overrides.serviceId ?? null,
    Money.fromAmount(100),
    Money.fromAmount(16),
    Money.fromAmount(116),
    overrides.isApproved ?? false,
    overrides.approvedAt ?? null,
    overrides.pdfUrl ?? null,
  );
}

describe('Quote', () => {
  it('expone los datos iniciales mediante getters', () => {
    const quote = buildQuote({ serviceId: 'service-1' });

    expect(quote.serviceId).toBe('service-1');
    expect(quote.subtotal.amount).toBe(100);
    expect(quote.tax.amount).toBe(16);
    expect(quote.total.amount).toBe(116);
    expect(quote.isApproved).toBe(false);
    expect(quote.approvedAt).toBeNull();
    expect(quote.pdfUrl).toBeNull();
  });

  describe('approve', () => {
    it('marca la cotización como aprobada y registra la fecha', () => {
      const quote = buildQuote();

      quote.approve();

      expect(quote.isApproved).toBe(true);
      expect(quote.approvedAt).toBeInstanceOf(Date);
    });
  });

  it('updateTotals reemplaza subtotal, impuesto y total', () => {
    const quote = buildQuote();

    quote.updateTotals(Money.fromAmount(200), Money.fromAmount(32), Money.fromAmount(232));

    expect(quote.subtotal.amount).toBe(200);
    expect(quote.tax.amount).toBe(32);
    expect(quote.total.amount).toBe(232);
  });

  it('attachPdf asigna la URL del PDF', () => {
    const quote = buildQuote();

    quote.attachPdf('https://example.com/quote.pdf');

    expect(quote.pdfUrl).toBe('https://example.com/quote.pdf');
  });

  it('assignService asigna el servicio asociado', () => {
    const quote = buildQuote({ serviceId: null });

    quote.assignService('service-2');

    expect(quote.serviceId).toBe('service-2');
  });
});
