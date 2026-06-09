import { OrderStatus } from '../enums/order-status.enum';
import { OrderPhase } from '../enums/order-phase.enum';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.SCHEDULED]:   [OrderStatus.IN_PROGRESS, OrderStatus.ON_HOLD, OrderStatus.ARCHIVED, OrderStatus.CANCELLED],
  [OrderStatus.ON_HOLD]:     [OrderStatus.IN_PROGRESS, OrderStatus.SCHEDULED, OrderStatus.ARCHIVED, OrderStatus.CANCELLED],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.ON_HOLD, OrderStatus.DELAYED, OrderStatus.WARRANTY, OrderStatus.CANCELLED],
  [OrderStatus.DELAYED]:     [OrderStatus.IN_PROGRESS, OrderStatus.ON_HOLD, OrderStatus.ARCHIVED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]:   [OrderStatus.DELIVERED, OrderStatus.WARRANTY],
  [OrderStatus.WARRANTY]:    [OrderStatus.IN_PROGRESS, OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]:   [OrderStatus.ARCHIVED],
  [OrderStatus.ARCHIVED]:    [],
  [OrderStatus.CANCELLED]:   [],
};

const PHASE_ORDER: OrderPhase[] = [
  OrderPhase.DIAGNOSIS,
  OrderPhase.PARTS,
  OrderPhase.APPROVAL,
  OrderPhase.REPAIR,
  OrderPhase.QUALITY_CONTROL,
];

export class OrderStateMachine {
  static canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  static getNextPhase(current: OrderPhase): OrderPhase | null {
    const idx = PHASE_ORDER.indexOf(current);
    if (idx === -1 || idx === PHASE_ORDER.length - 1) return null;
    return PHASE_ORDER[idx + 1];
  }

  static isPhaseBefore(target: OrderPhase, current: OrderPhase): boolean {
    return PHASE_ORDER.indexOf(target) < PHASE_ORDER.indexOf(current);
  }

  static getPhaseIndex(phase: OrderPhase): number {
    return PHASE_ORDER.indexOf(phase);
  }
}
