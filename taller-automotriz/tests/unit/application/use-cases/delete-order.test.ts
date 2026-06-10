import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteOrderUseCase } from '../../../../src/application/use-cases/orders/delete-order.use-case';
import { InMemoryOrderRepository } from '../../../helpers/in-memory-order.repository';
import { createTestOrder } from '../../../helpers/factories';
import { OrderStatus } from '../../../../src/domain/enums/order-status.enum';

describe('DeleteOrderUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let useCase: DeleteOrderUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository([]);
    useCase = new DeleteOrderUseCase(orderRepo);
  });

  it('elimina una orden en estado SCHEDULED', async () => {
    const order = createTestOrder({ id: 'order-1', status: OrderStatus.SCHEDULED });
    orderRepo = new InMemoryOrderRepository([order]);
    useCase = new DeleteOrderUseCase(orderRepo);

    await useCase.execute('order-1');

    expect(await orderRepo.findById('order-1')).toBeNull();
  });

  it('elimina una orden en estado ARCHIVED', async () => {
    const order = createTestOrder({ id: 'order-1', status: OrderStatus.ARCHIVED });
    orderRepo = new InMemoryOrderRepository([order]);
    useCase = new DeleteOrderUseCase(orderRepo);

    await useCase.execute('order-1');

    expect(await orderRepo.findById('order-1')).toBeNull();
  });

  it('lanza error si la orden no existe', async () => {
    await expect(useCase.execute('no-existe')).rejects.toThrow('Orden no encontrada');
  });

  it('lanza error si la orden está en un estado no eliminable', async () => {
    const order = createTestOrder({ id: 'order-1', status: OrderStatus.IN_PROGRESS });
    orderRepo = new InMemoryOrderRepository([order]);
    useCase = new DeleteOrderUseCase(orderRepo);

    await expect(useCase.execute('order-1')).rejects.toThrow(
      "No se puede eliminar una orden con estado 'IN_PROGRESS'",
    );

    expect(await orderRepo.findById('order-1')).not.toBeNull();
  });
});
