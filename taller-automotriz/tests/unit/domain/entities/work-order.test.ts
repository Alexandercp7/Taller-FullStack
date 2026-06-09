import { describe, it, expect } from 'vitest';
import { createTestOrder } from '../../../helpers/factories';
import { OrderStatus } from '../../../../src/domain/enums/order-status.enum';
import { OrderPhase } from '../../../../src/domain/enums/order-phase.enum';
import { InvalidStateTransitionError } from '../../../../src/domain/errors/invalid-state-transition.error';
import { OrderAlreadyClosedError } from '../../../../src/domain/errors/order-already-closed.error';
import { OrderClosed } from '../../../../src/domain/events/order-closed.event';
import { OrderStatusChanged } from '../../../../src/domain/events/order-status-changed.event';

describe('WorkOrder', () => {
  describe('changeStatus', () => {
    it('transiciona de SCHEDULED a IN_PROGRESS y asigna fase DIAGNOSIS', () => {
      const order = createTestOrder({ status: OrderStatus.SCHEDULED });

      order.changeStatus(OrderStatus.IN_PROGRESS, 'user-1');

      expect(order.status).toBe(OrderStatus.IN_PROGRESS);
      expect(order.phase).toBe(OrderPhase.DIAGNOSIS);
    });

    it('emite evento OrderStatusChanged al transicionar', () => {
      const order = createTestOrder({ status: OrderStatus.SCHEDULED });

      order.changeStatus(OrderStatus.IN_PROGRESS, 'user-1');

      expect(order.domainEvents).toHaveLength(1);
      expect(order.domainEvents[0]).toBeInstanceOf(OrderStatusChanged);
    });

    it('lanza error en transición inválida DELIVERED → IN_PROGRESS', () => {
      const order = createTestOrder({ status: OrderStatus.DELIVERED });

      expect(() => order.changeStatus(OrderStatus.IN_PROGRESS, 'user-1')).toThrow(
        InvalidStateTransitionError,
      );
    });

    it('lanza error en transición inválida ARCHIVED → SCHEDULED', () => {
      const order = createTestOrder({ status: OrderStatus.ARCHIVED });

      expect(() => order.changeStatus(OrderStatus.SCHEDULED, 'user-1')).toThrow(
        InvalidStateTransitionError,
      );
    });
  });

  describe('close', () => {
    it('cierra una orden en COMPLETED y la lleva a DELIVERED', () => {
      const order = createTestOrder({ status: OrderStatus.COMPLETED });

      order.close('user-1');

      expect(order.status).toBe(OrderStatus.DELIVERED);
      expect(order.closedAt).toBeInstanceOf(Date);
    });

    it('emite evento OrderClosed al cerrar', () => {
      const order = createTestOrder({ status: OrderStatus.COMPLETED });

      order.close('user-1');

      const closedEvents = order.domainEvents.filter((e) => e instanceof OrderClosed);
      expect(closedEvents).toHaveLength(1);
    });

    it('lanza error si se intenta cerrar dos veces', () => {
      const order = createTestOrder({ status: OrderStatus.COMPLETED });
      order.close('user-1');

      expect(() => order.close('user-1')).toThrow(OrderAlreadyClosedError);
    });

    it('lanza error si la orden no está en COMPLETED', () => {
      const order = createTestOrder({ status: OrderStatus.IN_PROGRESS });

      expect(() => order.close('user-1')).toThrow(InvalidStateTransitionError);
    });
  });

  describe('revertToPhase', () => {
    it('revierte la fase a una anterior', () => {
      const order = createTestOrder({
        status: OrderStatus.IN_PROGRESS,
        phase: OrderPhase.REPAIR,
      });

      order.revertToPhase(OrderPhase.DIAGNOSIS, 'user-1');

      expect(order.phase).toBe(OrderPhase.DIAGNOSIS);
    });

    it('lanza error si se intenta revertir a una fase posterior', () => {
      const order = createTestOrder({
        status: OrderStatus.IN_PROGRESS,
        phase: OrderPhase.DIAGNOSIS,
      });

      expect(() => order.revertToPhase(OrderPhase.REPAIR, 'user-1')).toThrow(
        InvalidStateTransitionError,
      );
    });
  });
});
