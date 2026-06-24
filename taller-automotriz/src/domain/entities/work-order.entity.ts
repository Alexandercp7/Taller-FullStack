import { OrderStatus } from '../enums/order-status.enum';
import { OrderPhase } from '../enums/order-phase.enum';
import { Priority } from '../enums/priority.enum';
import { OrderType } from '../enums/order-type.enum';
import { OrderStateMachine } from '../services/order-state-machine.service';
import { InvalidStateTransitionError } from '../errors/invalid-state-transition.error';
import { OrderAlreadyClosedError } from '../errors/order-already-closed.error';
import { OrderStatusChanged } from '../events/order-status-changed.event';
import { OrderClosed } from '../events/order-closed.event';
import { OrderCreated } from '../events/order-created.event';
import { OrderCancelled } from '../events/order-cancelled.event';
import { DomainEvent } from '../events/domain-event';

interface WorkOrderProps {
  id: string;
  code: string;
  status: OrderStatus;
  phase: OrderPhase | null;
  priority: Priority;
  type: OrderType;
  clientId: string;
  vehicleId: string;
  technicianId: string;
  createdById: string;
  problem: string;
  mileageIn: number | null;
  diagnostico: string | null;
  portalToken: string;
  scheduledAt: Date;
  closedAt: Date | null;
  needsDiagnosis: boolean;
  intakeCauses: string[];
  discoveredFaults: string[];
}

export class WorkOrder {
  private _domainEvents: DomainEvent[] = [];

  // Private constructor — use WorkOrder.create() or WorkOrder.reconstitute()
  private constructor(
    public readonly id: string,
    public readonly code: string,
    private _status: OrderStatus,
    private _phase: OrderPhase | null,
    private _priority: Priority,
    public readonly type: OrderType,
    public readonly clientId: string,
    public readonly vehicleId: string,
    private _technicianId: string,
    public readonly createdById: string,
    public readonly problem: string,
    private _mileageIn: number | null,
    private _diagnostico: string | null,
    public readonly portalToken: string,
    public readonly scheduledAt: Date,
    private _closedAt: Date | null,
    private _needsDiagnosis: boolean,
    private _intakeCauses: string[],
    private _discoveredFaults: string[],
  ) {}

  // ─── Factory: nueva orden (emite OrderCreated) ───────────────────────────

  static create(props: WorkOrderProps): WorkOrder {
    const order = WorkOrder._build(props);
    order._domainEvents.push(
      new OrderCreated(props.id, props.clientId, props.technicianId, props.createdById),
    );
    return order;
  }

  // ─── Factory: rehidratación desde BD (sin eventos) ───────────────────────

  static reconstitute(props: WorkOrderProps): WorkOrder {
    return WorkOrder._build(props);
  }

  private static _build(props: WorkOrderProps): WorkOrder {
    return new WorkOrder(
      props.id,
      props.code,
      props.status,
      props.phase,
      props.priority,
      props.type,
      props.clientId,
      props.vehicleId,
      props.technicianId,
      props.createdById,
      props.problem,
      props.mileageIn,
      props.diagnostico,
      props.portalToken,
      props.scheduledAt,
      props.closedAt,
      props.needsDiagnosis,
      props.intakeCauses,
      props.discoveredFaults,
    );
  }

  // ─── Getters ──────────────────────────────────────────────────────────────

  get status(): OrderStatus { return this._status; }
  get phase(): OrderPhase | null { return this._phase; }
  get priority(): Priority { return this._priority; }
  get technicianId(): string { return this._technicianId; }
  get closedAt(): Date | null { return this._closedAt; }
  get mileageIn(): number | null { return this._mileageIn; }
  get diagnostico(): string | null { return this._diagnostico; }
  get needsDiagnosis(): boolean { return this._needsDiagnosis; }
  get intakeCauses(): string[] { return [...this._intakeCauses]; }
  get discoveredFaults(): string[] { return [...this._discoveredFaults]; }
  get domainEvents(): ReadonlyArray<DomainEvent> { return this._domainEvents; }

  // ─── Comportamiento ───────────────────────────────────────────────────────

  changeStatus(newStatus: OrderStatus, userId: string): void {
    if (!OrderStateMachine.canTransition(this._status, newStatus)) {
      throw new InvalidStateTransitionError(this._status, newStatus);
    }

    const previousStatus = this._status;
    this._status = newStatus;

    if (newStatus === OrderStatus.IN_PROGRESS && !this._phase) {
      this._phase = OrderPhase.DIAGNOSIS;
    }

    this._domainEvents.push(
      new OrderStatusChanged(this.id, previousStatus, newStatus, userId),
    );
  }

  cancel(userId: string, reason: string): void {
    if (!OrderStateMachine.canTransition(this._status, OrderStatus.CANCELLED)) {
      throw new InvalidStateTransitionError(this._status, OrderStatus.CANCELLED);
    }
    this._status = OrderStatus.CANCELLED;
    this._domainEvents.push(new OrderCancelled(this.id, userId, reason));
  }

  advancePhase(userId: string): void {
    if (this._status !== OrderStatus.IN_PROGRESS) {
      throw new InvalidStateTransitionError(this._status, 'next phase');
    }

    const nextPhase = OrderStateMachine.getNextPhase(this._phase!);
    if (!nextPhase) {
      throw new InvalidStateTransitionError(this._phase!, 'no more phases');
    }

    const prev = this._phase!;
    this._phase = nextPhase;
    this._domainEvents.push(new OrderStatusChanged(this.id, prev, nextPhase, userId));
  }

  revertToPhase(targetPhase: OrderPhase, userId: string): void {
    if (this._status !== OrderStatus.IN_PROGRESS) {
      throw new InvalidStateTransitionError(this._status, 'revert phase');
    }
    if (!OrderStateMachine.isPhaseBefore(targetPhase, this._phase!)) {
      throw new InvalidStateTransitionError(this._phase!, targetPhase);
    }
    const prev = this._phase!;
    this._phase = targetPhase;
    this._domainEvents.push(new OrderStatusChanged(this.id, prev, targetPhase, userId));
  }

  close(userId: string): void {
    if (this._closedAt) {
      throw new OrderAlreadyClosedError(this.id);
    }
    if (this._status !== OrderStatus.COMPLETED) {
      throw new InvalidStateTransitionError(this._status, OrderStatus.DELIVERED);
    }

    this._status = OrderStatus.DELIVERED;
    this._closedAt = new Date();
    this._domainEvents.push(new OrderClosed(this.id, userId));
  }

  reassignTechnician(technicianId: string): void {
    this._technicianId = technicianId;
  }

  changePriority(priority: Priority): void {
    this._priority = priority;
  }

  registerMileageIn(km: number): void {
    this._mileageIn = km;
  }

  setIntakeCauses(causes: string[]): void {
    this._intakeCauses = causes;
  }

  addDiscoveredFault(fault: string): void {
    this._discoveredFaults.push(fault);
  }

  setNeedsDiagnosis(value: boolean): void {
    this._needsDiagnosis = value;
  }

  setDiagnostico(text: string): void {
    this._diagnostico = text;
  }

  clearEvents(): void {
    this._domainEvents = [];
  }
}
