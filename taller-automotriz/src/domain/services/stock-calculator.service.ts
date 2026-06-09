import { InsufficientStockError } from '../errors/insufficient-stock.error';

export interface StockDeductionResult {
  newStock: number;
  isBelowMinimum: boolean;
}

export class StockCalculator {
  static validateAndDeduct(
    currentStock: number,
    requested: number,
    minStock: number,
  ): StockDeductionResult {
    if (currentStock < requested) {
      throw new InsufficientStockError(currentStock, requested);
    }

    const newStock = currentStock - requested;
    return {
      newStock,
      isBelowMinimum: newStock < minStock,
    };
  }

  static calculateAfterAdjustment(currentStock: number, adjustment: number): number {
    const result = currentStock + adjustment;
    if (result < 0) throw new InsufficientStockError(currentStock, Math.abs(adjustment));
    return result;
  }
}
