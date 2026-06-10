import { describe, it, expect, beforeEach } from 'vitest';
import { CloseOrderUseCase } from '../../../../src/application/use-cases/orders/close-order.use-case';
import { InMemoryOrderRepository } from '../../../helpers/in-memory-order.repository';
import { InMemoryClientRepository } from '../../../helpers/in-memory-client.repository';
import { InMemoryAccountReceivableRepository } from '../../../helpers/in-memory-account-receivable.repository';
import { FakeUnitOfWork, FakeTimelineRepository } from '../../../helpers/fakes';
import { createTestOrder, createTestClient } from '../../../helpers/factories';
import { OrderStatus } from '../../../../src/domain/enums/order-status.enum';
import { ClientTag } from '../../../../src/domain/enums/client-tag.enum';
import { PaymentStatus } from '../../../../src/domain/enums/payment-status.enum';
import { OrderAlreadyClosedError } from '../../../../src/domain/errors/order-already-closed.error';

describe('CloseOrderUseCase', () => {
  let useCase: CloseOrderUseCase;
  let orderRepo: InMemoryOrderRepository;
  let clientRepo: InMemoryClientRepository;
  let arRepo: InMemoryAccountReceivableRepository;
  let timelineRepo: FakeTimelineRepository;

  beforeEach(() => {
    const order = createTestOrder({ id: 'order-1', status: OrderStatus.COMPLETED });
    const client = createTestClient({ id: order.clientId, tag: ClientTag.NEW });

    orderRepo = new InMemoryOrderRepository([order]);
    clientRepo = new InMemoryClientRepository([client]);
    arRepo = new InMemoryAccountReceivableRepository([]);
    timelineRepo = new FakeTimelineRepository();

    useCase = new CloseOrderUseCase(orderRepo, clientRepo, arRepo, timelineRepo, new FakeUnitOfWork());
  });

  it('cierra la orden y la mueve a DELIVERED', async () => {
    await useCase.execute({ orderId: 'order-1', userId: 'user-1', totalAmount: 1500 });

    const order = await orderRepo.findById('order-1');
    expect(order?.status).toBe(OrderStatus.DELIVERED);
    expect(order?.closedAt).toBeInstanceOf(Date);
  });

  it('crea una cuenta por cobrar pendiente con el monto total', async () => {
    const order = await orderRepo.findById('order-1');

    await useCase.execute({ orderId: 'order-1', userId: 'user-1', totalAmount: 1500 });

    const ar = await arRepo.findByOrderId('order-1');
    expect(ar).not.toBeNull();
    expect(ar?.total.amount).toBe(1500);
    expect(ar?.balance.amount).toBe(1500);
    expect(ar?.status).toBe(PaymentStatus.PENDING);
    expect(ar?.clientId).toBe(order?.clientId);
  });

  it('registra una entrada en la línea de tiempo', async () => {
    await useCase.execute({ orderId: 'order-1', userId: 'user-1', totalAmount: 1500 });

    expect(timelineRepo.entries).toHaveLength(1);
    expect(timelineRepo.entries[0].event).toBe('order_closed');
  });

  it('actualiza la etiqueta del cliente según su historial', async () => {
    const order = createTestOrder({ id: 'order-1', status: OrderStatus.COMPLETED });
    const client = createTestClient({ id: order.clientId, tag: ClientTag.NEW });
    clientRepo = new InMemoryClientRepository([client]);
    clientRepo.ordersCountByClient.set(client.id, 5);
    clientRepo.pendingDebtByClient.set(client.id, false);

    orderRepo = new InMemoryOrderRepository([order]);
    useCase = new CloseOrderUseCase(orderRepo, clientRepo, arRepo, timelineRepo, new FakeUnitOfWork());

    await useCase.execute({ orderId: 'order-1', userId: 'user-1', totalAmount: 1500 });

    const updatedClient = await clientRepo.findById(client.id);
    expect(updatedClient?.tag).toBe(ClientTag.FREQUENT);
  });

  it('lanza error si la orden no existe', async () => {
    await expect(useCase.execute({ orderId: 'no-existe', userId: 'user-1', totalAmount: 100 })).rejects.toThrow(
      'Orden no encontrada',
    );
  });

  it('lanza error si la orden ya fue cerrada', async () => {
    await useCase.execute({ orderId: 'order-1', userId: 'user-1', totalAmount: 1500 });

    await expect(useCase.execute({ orderId: 'order-1', userId: 'user-1', totalAmount: 1500 })).rejects.toThrow(
      OrderAlreadyClosedError,
    );
  });
});
