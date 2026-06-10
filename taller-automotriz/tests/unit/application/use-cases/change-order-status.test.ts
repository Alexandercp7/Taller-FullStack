import { describe, it, expect, beforeEach } from 'vitest';
import { ChangeOrderStatusUseCase } from '../../../../src/application/use-cases/orders/change-order-status.use-case';
import { InMemoryOrderRepository } from '../../../helpers/in-memory-order.repository';
import { FakeTimelineRepository, FakeDomainEventDispatcher } from '../../../helpers/fakes';
import { createTestOrder } from '../../../helpers/factories';
import { OrderStatus } from '../../../../src/domain/enums/order-status.enum';
import { OrderPhase } from '../../../../src/domain/enums/order-phase.enum';
import { InvalidStateTransitionError } from '../../../../src/domain/errors/invalid-state-transition.error';

describe('ChangeOrderStatusUseCase', () => {
  let useCase: ChangeOrderStatusUseCase;
  let orderRepo: InMemoryOrderRepository;
  let timelineRepo: FakeTimelineRepository;
  let dispatcher: FakeDomainEventDispatcher;

  beforeEach(() => {
    const order = createTestOrder({ id: 'order-1', status: OrderStatus.SCHEDULED });
    orderRepo = new InMemoryOrderRepository([order]);
    timelineRepo = new FakeTimelineRepository();
    dispatcher = new FakeDomainEventDispatcher();

    useCase = new ChangeOrderStatusUseCase(orderRepo, timelineRepo, dispatcher);
  });

  it('cambia el estatus de la orden y persiste el cambio', async () => {
    await useCase.execute({ orderId: 'order-1', newStatus: OrderStatus.IN_PROGRESS, userId: 'user-1' });

    const order = await orderRepo.findById('order-1');
    expect(order?.status).toBe(OrderStatus.IN_PROGRESS);
    expect(order?.phase).toBe(OrderPhase.DIAGNOSIS);
  });

  it('registra el cambio en la línea de tiempo', async () => {
    await useCase.execute({ orderId: 'order-1', newStatus: OrderStatus.IN_PROGRESS, userId: 'user-1' });

    expect(timelineRepo.entries).toHaveLength(1);
    expect(timelineRepo.entries[0].event).toBe('status_changed');
    expect(timelineRepo.entries[0].detail).toEqual({ newStatus: OrderStatus.IN_PROGRESS });
  });

  it('despacha los eventos de dominio y los limpia de la orden', async () => {
    await useCase.execute({ orderId: 'order-1', newStatus: OrderStatus.IN_PROGRESS, userId: 'user-1' });

    expect(dispatcher.dispatched).toHaveLength(1);

    const order = await orderRepo.findById('order-1');
    expect(order?.domainEvents).toHaveLength(0);
  });

  it('lanza error si la orden no existe', async () => {
    await expect(
      useCase.execute({ orderId: 'no-existe', newStatus: OrderStatus.IN_PROGRESS, userId: 'user-1' }),
    ).rejects.toThrow('Orden no encontrada');
  });

  it('lanza error en una transición inválida', async () => {
    const deliveredOrder = createTestOrder({ id: 'order-2', status: OrderStatus.DELIVERED });
    orderRepo = new InMemoryOrderRepository([deliveredOrder]);
    useCase = new ChangeOrderStatusUseCase(orderRepo, timelineRepo, dispatcher);

    await expect(
      useCase.execute({ orderId: 'order-2', newStatus: OrderStatus.IN_PROGRESS, userId: 'user-1' }),
    ).rejects.toThrow(InvalidStateTransitionError);
  });
});
