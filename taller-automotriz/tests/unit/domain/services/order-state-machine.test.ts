import { describe, it, expect } from 'vitest';
import { OrderStateMachine } from '../../../../src/domain/services/order-state-machine.service';
import { OrderStatus } from '../../../../src/domain/enums/order-status.enum';
import { OrderPhase } from '../../../../src/domain/enums/order-phase.enum';

describe('OrderStateMachine', () => {
  describe('canTransition', () => {
    it('permite SCHEDULED → IN_PROGRESS', () => {
      expect(OrderStateMachine.canTransition(OrderStatus.SCHEDULED, OrderStatus.IN_PROGRESS)).toBe(true);
    });

    it('permite COMPLETED → DELIVERED', () => {
      expect(OrderStateMachine.canTransition(OrderStatus.COMPLETED, OrderStatus.DELIVERED)).toBe(true);
    });

    it('bloquea DELIVERED → IN_PROGRESS', () => {
      expect(OrderStateMachine.canTransition(OrderStatus.DELIVERED, OrderStatus.IN_PROGRESS)).toBe(false);
    });

    it('bloquea ARCHIVED → cualquier estado', () => {
      for (const status of Object.values(OrderStatus)) {
        expect(OrderStateMachine.canTransition(OrderStatus.ARCHIVED, status)).toBe(false);
      }
    });
  });

  describe('getNextPhase', () => {
    it('retorna la siguiente fase correctamente', () => {
      expect(OrderStateMachine.getNextPhase(OrderPhase.DIAGNOSIS)).toBe(OrderPhase.PARTS);
      expect(OrderStateMachine.getNextPhase(OrderPhase.PARTS)).toBe(OrderPhase.APPROVAL);
      expect(OrderStateMachine.getNextPhase(OrderPhase.APPROVAL)).toBe(OrderPhase.REPAIR);
      expect(OrderStateMachine.getNextPhase(OrderPhase.REPAIR)).toBe(OrderPhase.QUALITY_CONTROL);
    });

    it('retorna null en la última fase', () => {
      expect(OrderStateMachine.getNextPhase(OrderPhase.QUALITY_CONTROL)).toBeNull();
    });
  });

  describe('isPhaseBefore', () => {
    it('detecta que DIAGNOSIS está antes que REPAIR', () => {
      expect(OrderStateMachine.isPhaseBefore(OrderPhase.DIAGNOSIS, OrderPhase.REPAIR)).toBe(true);
    });

    it('detecta que REPAIR no está antes que DIAGNOSIS', () => {
      expect(OrderStateMachine.isPhaseBefore(OrderPhase.REPAIR, OrderPhase.DIAGNOSIS)).toBe(false);
    });
  });
});
