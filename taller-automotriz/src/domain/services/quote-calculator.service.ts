import { Money } from '../value-objects/money.vo';
import { VehicleType } from '../enums/vehicle-type.enum';

const TAX_RATE = 0.16;

export interface QuoteLineItem {
  unitPrice: number;
  quantity: number;
}

export interface ServicePricing {
  vehicleType: VehicleType;
  basePrice: number;
}

export interface QuoteCalculationResult {
  subtotal: Money;
  tax: Money;
  total: Money;
}

export class QuoteCalculator {
  static calculateFromLines(lines: QuoteLineItem[]): QuoteCalculationResult {
    const subtotal = lines.reduce((acc, line) => {
      return acc.add(Money.fromAmount(line.unitPrice).multiply(line.quantity));
    }, Money.zero());

    const tax = subtotal.applyTax(TAX_RATE * 100).subtract(subtotal);
    const total = subtotal.add(tax);

    return { subtotal, tax, total };
  }

  static calculateTotal(partsSubtotal: Money, servicePrice: Money): QuoteCalculationResult {
    const subtotal = partsSubtotal.add(servicePrice);
    const taxAmount = Money.fromCents(Math.round(subtotal.cents * TAX_RATE));
    const total = subtotal.add(taxAmount);

    return { subtotal, tax: taxAmount, total };
  }
}
