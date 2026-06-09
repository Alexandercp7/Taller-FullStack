import { describe, it, expect } from 'vitest';
import { createTestItem } from '../../../helpers/factories';
import { InsufficientStockError } from '../../../../src/domain/errors/insufficient-stock.error';
import { StockBelowMinimum } from '../../../../src/domain/events/stock-below-minimum.event';

describe('InventoryItem', () => {
  describe('deductStock', () => {
    it('descuenta stock correctamente', () => {
      const item = createTestItem({ stock: 10, minStock: 2 });

      item.deductStock(3, 'user-1', 'order-1');

      expect(item.stock).toBe(7);
    });

    it('lanza error si stock es insuficiente', () => {
      const item = createTestItem({ stock: 2, minStock: 0 });

      expect(() => item.deductStock(5, 'user-1', 'order-1')).toThrow(InsufficientStockError);
    });

    it('emite evento StockBelowMinimum cuando stock cae por debajo del mínimo', () => {
      const item = createTestItem({ stock: 5, minStock: 5 });

      item.deductStock(2, 'user-1', 'order-1');

      const events = item.domainEvents.filter((e) => e instanceof StockBelowMinimum);
      expect(events).toHaveLength(1);
    });

    it('no emite evento si stock se mantiene sobre mínimo', () => {
      const item = createTestItem({ stock: 10, minStock: 2 });

      item.deductStock(3, 'user-1', 'order-1');

      expect(item.domainEvents).toHaveLength(0);
    });

    it('retorna isBelowMinimum=true cuando corresponde', () => {
      const item = createTestItem({ stock: 5, minStock: 5 });

      const result = item.deductStock(2, 'user-1', 'order-1');

      expect(result.isBelowMinimum).toBe(true);
      expect(item.stock).toBe(3);
    });
  });
});
