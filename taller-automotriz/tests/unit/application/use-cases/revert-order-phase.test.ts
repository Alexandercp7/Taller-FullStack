import { describe, it, expect, beforeEach } from 'vitest';
import { RevertOrderPhaseUseCase } from '../../../../src/application/use-cases/orders/revert-order-phase.use-case';
import { InMemoryOrderRepository } from '../../../helpers/in-memory-order.repository';
import { FakeTimelineRepository } from '../../../helpers/fakes';
import { createTestOrder } from '../../../helpers/factories';
import { OrderStatus } from '../../../../src/domain/enums/order-status.enum';
import { OrderPhase } from '../../../../src/domain/enums/order-phase.enum';
import { InvalidStateTransitionError } from '../../../../src/domain/errors/invalid-state-transition.error';

describe('RevertOrderPhaseUseCase', () => {
  let useCase: RevertOrderPhaseUseCase;
  let orderRepo: InMemoryOrderRepository;
  let timelineRepo: FakeTimelineRepository;

  beforeEach(() => {
    const order = createTestOrder({ id: 'order-1', status: OrderStatus.IN_PROGRESS, phase: OrderPhase.REPAIR });
    orderRepo = new InMemoryOrderRepository([order]);
    timelineRepo = new FakeTimelineRepository();

    useCase = new RevertOrderPhaseUseCase(orderRepo, timelineRepo);
  });

  it('revierte la orden a una fase anterior y persiste el cambio', async () => {
    await useCase.execute({ orderId: 'order-1', targetPhase: OrderPhase.DIAGNOSIS, userId: 'user-1' });

    const order = await orderRepo.findById('order-1');
    expect(order?.phase).toBe(OrderPhase.DIAGNOSIS);
  });

  it('registra el evento phase_reverted en la línea de tiempo', async () => {
    await useCase.execute({ orderId: 'order-1', targetPhase: OrderPhase.DIAGNOSIS, userId: 'user-1' });

    expect(timelineRepo.entries).toHaveLength(1);
    expect(timelineRepo.entries[0].event).toBe('phase_reverted');
    expect(timelineRepo.entries[0].detail).toEqual({ targetPhase: OrderPhase.DIAGNOSIS });
  });

  it('lanza error si la orden no existe', async () => {
    await expect(
      useCase.execute({ orderId: 'no-existe', targetPhase: OrderPhase.DIAGNOSIS, userId: 'user-1' }),
    ).rejects.toThrow('Orden no encontrada');
  });

  it('lanza error si se intenta revertir a una fase posterior', async () => {
    await expect(
      useCase.execute({ orderId: 'order-1', targetPhase: OrderPhase.QUALITY_CONTROL, userId: 'user-1' }),
    ).rejects.toThrow(InvalidStateTransitionError);
  });
});
