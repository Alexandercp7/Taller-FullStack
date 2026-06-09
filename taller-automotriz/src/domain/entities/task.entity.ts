import { TaskStatus } from '../enums/task-status.enum';
import { TaskTag } from '../enums/task-tag.enum';
import { Priority } from '../enums/priority.enum';
import { InvalidStateTransitionError } from '../errors/invalid-state-transition.error';

const VALID_TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
  [TaskStatus.COMPLETED]: [],
  [TaskStatus.CANCELLED]: [],
};

export class Task {
  constructor(
    public readonly id: string,
    private _title: string,
    private _description: string | null,
    private _status: TaskStatus,
    private _tag: TaskTag,
    private _priority: Priority,
    private _assignedTo: string | null,
    public readonly createdById: string,
    private _dueDate: Date | null,
    private _completedAt: Date | null,
  ) {}

  get title(): string { return this._title; }
  get description(): string | null { return this._description; }
  get status(): TaskStatus { return this._status; }
  get tag(): TaskTag { return this._tag; }
  get priority(): Priority { return this._priority; }
  get assignedTo(): string | null { return this._assignedTo; }
  get dueDate(): Date | null { return this._dueDate; }
  get completedAt(): Date | null { return this._completedAt; }

  changeStatus(newStatus: TaskStatus): void {
    if (!VALID_TASK_TRANSITIONS[this._status]?.includes(newStatus)) {
      throw new InvalidStateTransitionError(this._status, newStatus);
    }
    this._status = newStatus;
    if (newStatus === TaskStatus.COMPLETED) {
      this._completedAt = new Date();
    }
  }

  update(data: {
    title?: string;
    description?: string | null;
    tag?: TaskTag;
    priority?: Priority;
    assignedTo?: string | null;
    dueDate?: Date | null;
  }): void {
    if (data.title !== undefined) this._title = data.title;
    if (data.description !== undefined) this._description = data.description;
    if (data.tag !== undefined) this._tag = data.tag;
    if (data.priority !== undefined) this._priority = data.priority;
    if (data.assignedTo !== undefined) this._assignedTo = data.assignedTo;
    if (data.dueDate !== undefined) this._dueDate = data.dueDate;
  }

  isOverdue(): boolean {
    if (!this._dueDate || this._status === TaskStatus.COMPLETED || this._status === TaskStatus.CANCELLED) {
      return false;
    }
    return new Date() > this._dueDate;
  }
}
