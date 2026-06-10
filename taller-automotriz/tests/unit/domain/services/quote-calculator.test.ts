import { describe, it, expect } from 'vitest';
import { QuoteCalculator } from '../../../../src/domain/services/quote-calculator.service';
import { Money } from '../../../../src/domain/value-objects/money.vo';

describe('QuoteCalculator', () => {
  describe('calculateFromLines', () => {
    it('calcula subtotal, impuesto (16%) y total para una línea', () => {
      const result = QuoteCalculator.calculateFromLines([{ unitPrice: 100, quantity: 1 }]);

      expect(result.subtotal.amount).toBe(100);
      expect(result.tax.amount).toBe(16);
      expect(result.total.amount).toBe(116);
    });

    it('suma múltiples líneas con cantidades distintas', () => {
      const result = QuoteCalculator.calculateFromLines([
        { unitPrice: 50, quantity: 2 },
        { unitPrice: 30, quantity: 1 },
      ]);

      expect(result.subtotal.amount).toBe(130);
      expect(result.total.amount).toBe(150.8);
    });

    it('retorna ceros si no hay líneas', () => {
      const result = QuoteCalculator.calculateFromLines([]);

      expect(result.subtotal.amount).toBe(0);
      expect(result.tax.amount).toBe(0);
      expect(result.total.amount).toBe(0);
    });
  });

  describe('calculateTotal', () => {
    it('suma refacciones y servicio, y aplica 16% de impuesto', () => {
      const result = QuoteCalculator.calculateTotal(Money.fromAmount(200), Money.fromAmount(300));

      expect(result.subtotal.amount).toBe(500);
      expect(result.tax.amount).toBe(80);
      expect(result.total.amount).toBe(580);
    });

    it('funciona cuando una de las partes es cero', () => {
      const result = QuoteCalculator.calculateTotal(Money.zero(), Money.fromAmount(100));

      expect(result.subtotal.amount).toBe(100);
      expect(result.tax.amount).toBe(16);
      expect(result.total.amount).toBe(116);
    });
  });
});
