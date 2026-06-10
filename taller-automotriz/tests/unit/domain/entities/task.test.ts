import { describe, it, expect, vi, afterEach } from 'vitest';
import { Task } from '../../../../src/domain/entities/task.entity';
import { TaskStatus } from '../../../../src/domain/enums/task-status.enum';
import { TaskTag } from '../../../../src/domain/enums/task-tag.enum';
import { Priority } from '../../../../src/domain/enums/priority.enum';
import { InvalidStateTransitionError } from '../../../../src/domain/errors/invalid-state-transition.error';

function buildTask(overrides: Partial<{ status: TaskStatus; dueDate: Date | null }> = {}): Task {
  return new Task(
    'task-1',
    'Revisar frenos',
    'Descripción de la tarea',
    overrides.status ?? TaskStatus.PENDING,
    TaskTag.TECHNICAL,
    Priority.MEDIUM,
    'tech-1',
    'user-1',
    overrides.dueDate ?? null,
    null,
  );
}

describe('Task', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('expone los datos iniciales mediante getters', () => {
    const task = buildTask();

    expect(task.title).toBe('Revisar frenos');
    expect(task.description).toBe('Descripción de la tarea');
    expect(task.status).toBe(TaskStatus.PENDING);
    expect(task.tag).toBe(TaskTag.TECHNICAL);
    expect(task.priority).toBe(Priority.MEDIUM);
    expect(task.assignedTo).toBe('tech-1');
    expect(task.completedAt).toBeNull();
  });

  describe('changeStatus', () => {
    it('transiciona de PENDING a IN_PROGRESS', () => {
      const task = buildTask({ status: TaskStatus.PENDING });

      task.changeStatus(TaskStatus.IN_PROGRESS);

      expect(task.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('transiciona de IN_PROGRESS a COMPLETED y registra completedAt', () => {
      const task = buildTask({ status: TaskStatus.IN_PROGRESS });

      task.changeStatus(TaskStatus.COMPLETED);

      expect(task.status).toBe(TaskStatus.COMPLETED);
      expect(task.completedAt).toBeInstanceOf(Date);
    });

    it('permite cancelar una tarea pendiente', () => {
      const task = buildTask({ status: TaskStatus.PENDING });

      task.changeStatus(TaskStatus.CANCELLED);

      expect(task.status).toBe(TaskStatus.CANCELLED);
    });

    it('lanza error si la tarea ya está COMPLETED', () => {
      const task = buildTask({ status: TaskStatus.COMPLETED });

      expect(() => task.changeStatus(TaskStatus.IN_PROGRESS)).toThrow(InvalidStateTransitionError);
    });

    it('lanza error si la tarea ya está CANCELLED', () => {
      const task = buildTask({ status: TaskStatus.CANCELLED });

      expect(() => task.changeStatus(TaskStatus.PENDING)).toThrow(InvalidStateTransitionError);
    });

    it('lanza error al saltar de PENDING a COMPLETED directamente', () => {
      const task = buildTask({ status: TaskStatus.PENDING });

      expect(() => task.changeStatus(TaskStatus.COMPLETED)).toThrow(InvalidStateTransitionError);
    });
  });

  describe('update', () => {
    it('actualiza solo los campos provistos', () => {
      const task = buildTask();

      task.update({ title: 'Revisar suspensión', priority: Priority.HIGH });

      expect(task.title).toBe('Revisar suspensión');
      expect(task.priority).toBe(Priority.HIGH);
      expect(task.description).toBe('Descripción de la tarea');
    });

    it('permite limpiar campos opcionales con null', () => {
      const task = buildTask();

      task.update({ description: null, assignedTo: null, dueDate: null });

      expect(task.description).toBeNull();
      expect(task.assignedTo).toBeNull();
      expect(task.dueDate).toBeNull();
    });
  });

  describe('isOverdue', () => {
    it('retorna false si no tiene fecha límite', () => {
      const task = buildTask({ dueDate: null });

      expect(task.isOverdue()).toBe(false);
    });

    it('retorna true si la fecha límite ya pasó y la tarea sigue pendiente', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-10T00:00:00Z'));

      const task = buildTask({ status: TaskStatus.PENDING, dueDate: new Date('2026-06-01T00:00:00Z') });

      expect(task.isOverdue()).toBe(true);
    });

    it('retorna false si la fecha límite no ha pasado', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));

      const task = buildTask({ status: TaskStatus.PENDING, dueDate: new Date('2026-06-10T00:00:00Z') });

      expect(task.isOverdue()).toBe(false);
    });

    it('retorna false si la tarea ya está completada aunque la fecha haya pasado', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-10T00:00:00Z'));

      const task = buildTask({ status: TaskStatus.COMPLETED, dueDate: new Date('2026-06-01T00:00:00Z') });

      expect(task.isOverdue()).toBe(false);
    });

    it('retorna false si la tarea está cancelada aunque la fecha haya pasado', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-10T00:00:00Z'));

      const task = buildTask({ status: TaskStatus.CANCELLED, dueDate: new Date('2026-06-01T00:00:00Z') });

      expect(task.isOverdue()).toBe(false);
    });
  });
});
