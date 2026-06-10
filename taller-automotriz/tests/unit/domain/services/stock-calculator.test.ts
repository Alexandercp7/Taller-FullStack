import { describe, it, expect } from 'vitest';
import { StockCalculator } from '../../../../src/domain/services/stock-calculator.service';
import { InsufficientStockError } from '../../../../src/domain/errors/insufficient-stock.error';

describe('StockCalculator', () => {
  describe('validateAndDeduct', () => {
    it('descuenta el stock solicitado', () => {
      const result = StockCalculator.validateAndDeduct(10, 3, 2);

      expect(result.newStock).toBe(7);
      expect(result.isBelowMinimum).toBe(false);
    });

    it('marca isBelowMinimum cuando el stock resultante queda por debajo del mínimo', () => {
      const result = StockCalculator.validateAndDeduct(5, 4, 2);

      expect(result.newStock).toBe(1);
      expect(result.isBelowMinimum).toBe(true);
    });

    it('permite que el stock resultante llegue exactamente a 0', () => {
      const result = StockCalculator.validateAndDeduct(5, 5, 0);

      expect(result.newStock).toBe(0);
      expect(result.isBelowMinimum).toBe(false);
    });

    it('lanza error si se solicita más de lo disponible', () => {
      expect(() => StockCalculator.validateAndDeduct(2, 5, 1)).toThrow(InsufficientStockError);
    });
  });

  describe('calculateAfterAdjustment', () => {
    it('suma un ajuste positivo al stock actual', () => {
      expect(StockCalculator.calculateAfterAdjustment(10, 5)).toBe(15);
    });

    it('resta un ajuste negativo al stock actual', () => {
      expect(StockCalculator.calculateAfterAdjustment(10, -4)).toBe(6);
    });

    it('permite que el resultado sea exactamente 0', () => {
      expect(StockCalculator.calculateAfterAdjustment(5, -5)).toBe(0);
    });

    it('lanza error si el ajuste deja el stock en negativo', () => {
      expect(() => StockCalculator.calculateAfterAdjustment(5, -10)).toThrow(InsufficientStockError);
    });
  });
});
