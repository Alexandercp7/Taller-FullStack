import { describe, it, expect, beforeEach } from 'vitest';
import { AssignPartToOrderUseCase } from '../../../../src/application/use-cases/inventory/assign-part-to-order.use-case';
import { InMemoryOrderRepository } from '../../../helpers/in-memory-order.repository';
import { InMemoryInventoryRepository } from '../../../helpers/in-memory-inventory.repository';
import { FakeUnitOfWork, FakeJobQueue, FakeTimelineRepository, FakeStockMovementRepository } from '../../../helpers/fakes';
import { createTestOrder, createTestItem } from '../../../helpers/factories';
import { OrderStatus } from '../../../../src/domain/enums/order-status.enum';
import { InsufficientStockError } from '../../../../src/domain/errors/insufficient-stock.error';

describe('AssignPartToOrderUseCase', () => {
  let useCase: AssignPartToOrderUseCase;
  let orderRepo: InMemoryOrderRepository;
  let inventoryRepo: InMemoryInventoryRepository;
  let jobQueue: FakeJobQueue;

  beforeEach(() => {
    const order = createTestOrder({ status: OrderStatus.IN_PROGRESS });
    const item = createTestItem({ stock: 5, minStock: 5 });

    orderRepo = new InMemoryOrderRepository([order]);
    inventoryRepo = new InMemoryInventoryRepository([item]);
    jobQueue = new FakeJobQueue();

    useCase = new AssignPartToOrderUseCase(
      orderRepo,
      inventoryRepo,
      new FakeStockMovementRepository(),
      new FakeTimelineRepository(),
      new FakeUnitOfWork(),
      jobQueue,
    );
  });

  it('descuenta stock y retorna el nuevo nivel', async () => {
    const orders = await orderRepo.findByFilters({ page: 1, pageSize: 10 });
    const items = await inventoryRepo.findByFilters({ page: 1, pageSize: 10 });
    const order = orders.data[0];
    const item = items.data[0];

    const result = await useCase.execute({
      orderId: order.id,
      itemId: item.id,
      quantity: 2,
      userId: 'user-1',
    });

    expect(result.newStock).toBe(3);
    expect(result.isBelowMinimum).toBe(true);
  });

  it('encola alerta de stock cuando cae bajo el mínimo', async () => {
    const orders = await orderRepo.findByFilters({ page: 1, pageSize: 10 });
    const items = await inventoryRepo.findByFilters({ page: 1, pageSize: 10 });

    await useCase.execute({
      orderId: orders.data[0].id,
      itemId: items.data[0].id,
      quantity: 2,
      userId: 'user-1',
    });

    expect(jobQueue.jobs).toHaveLength(1);
    expect(jobQueue.jobs[0].name).toBe('stock-alert');
  });

  it('lanza error si el stock es insuficiente', async () => {
    const orders = await orderRepo.findByFilters({ page: 1, pageSize: 10 });
    const items = await inventoryRepo.findByFilters({ page: 1, pageSize: 10 });

    await expect(
      useCase.execute({
        orderId: orders.data[0].id,
        itemId: items.data[0].id,
        quantity: 10,
        userId: 'user-1',
      }),
    ).rejects.toThrow(InsufficientStockError);
  });

  it('lanza error si la orden no existe', async () => {
    const items = await inventoryRepo.findByFilters({ page: 1, pageSize: 10 });

    await expect(
      useCase.execute({
        orderId: 'no-existe',
        itemId: items.data[0].id,
        quantity: 1,
        userId: 'user-1',
      }),
    ).rejects.toThrow('Orden no encontrada');
  });
});
