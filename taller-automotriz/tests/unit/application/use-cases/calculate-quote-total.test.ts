import { describe, it, expect, beforeEach } from 'vitest';
import { CalculateQuoteTotalUseCase } from '../../../../src/application/use-cases/quotation/calculate-quote-total.use-case';
import { InMemoryQuoteRepository } from '../../../helpers/in-memory-quote.repository';
import { InMemoryInventoryRepository } from '../../../helpers/in-memory-inventory.repository';
import { InMemoryPriceListRepository } from '../../../helpers/in-memory-price-list.repository';
import { createTestItem } from '../../../helpers/factories';
import { VehicleType } from '../../../../src/domain/enums/vehicle-type.enum';

describe('CalculateQuoteTotalUseCase', () => {
  let quoteRepo: InMemoryQuoteRepository;
  let inventoryRepo: InMemoryInventoryRepository;
  let priceListRepo: InMemoryPriceListRepository;
  let useCase: CalculateQuoteTotalUseCase;

  beforeEach(() => {
    quoteRepo = new InMemoryQuoteRepository();
    inventoryRepo = new InMemoryInventoryRepository([
      createTestItem({ id: 'item-1' }), // salePrice = 120
    ]);
    priceListRepo = new InMemoryPriceListRepository([
      { id: 'service-1', name: 'Afinación', description: null, vehicleType: VehicleType.CAR, price: 500, isActive: true },
    ]);
    useCase = new CalculateQuoteTotalUseCase(quoteRepo, inventoryRepo, priceListRepo);
  });

  it('crea una nueva cotización calculando subtotal, impuesto y total', async () => {
    const quote = await useCase.execute({
      orderId: 'order-1',
      serviceId: 'service-1',
      assignedPartIds: [{ itemId: 'item-1', quantity: 2 }],
    });

    // partes: 120 * 2 = 240, servicio: 500 -> subtotal = 740
    expect(quote.subtotal.amount).toBeCloseTo(740);
    expect(quote.tax.amount).toBeCloseTo(740 * 0.16);
    expect(quote.total.amount).toBeCloseTo(740 * 1.16);
    expect(quote.serviceId).toBe('service-1');

    const saved = await quoteRepo.findByOrderId('order-1');
    expect(saved).toHaveLength(1);
  });

  it('actualiza una cotización existente para la misma orden en lugar de crear otra', async () => {
    await useCase.execute({
      orderId: 'order-1',
      assignedPartIds: [{ itemId: 'item-1', quantity: 1 }],
    });

    const updated = await useCase.execute({
      orderId: 'order-1',
      assignedPartIds: [{ itemId: 'item-1', quantity: 3 }],
    });

    const all = await quoteRepo.findByOrderId('order-1');
    expect(all).toHaveLength(1);
    expect(updated.subtotal.amount).toBeCloseTo(120 * 3);
  });

  it('ignora ítems de inventario inexistentes', async () => {
    const quote = await useCase.execute({
      orderId: 'order-2',
      assignedPartIds: [{ itemId: 'no-existe', quantity: 5 }],
    });

    expect(quote.subtotal.isZero()).toBe(true);
    expect(quote.total.isZero()).toBe(true);
  });

  it('ignora servicios inexistentes en la lista de precios', async () => {
    const quote = await useCase.execute({
      orderId: 'order-3',
      serviceId: 'no-existe',
      assignedPartIds: [],
    });

    // serviceId se conserva tal cual aunque el servicio no exista en la lista de precios;
    // sólo el cálculo del precio se omite.
    expect(quote.serviceId).toBe('no-existe');
    expect(quote.subtotal.isZero()).toBe(true);
  });
});
