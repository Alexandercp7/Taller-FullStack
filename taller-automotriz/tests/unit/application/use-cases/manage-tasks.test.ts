import { describe, it, expect, beforeEach } from 'vitest';
import { ManageTasksUseCase } from '../../../../src/application/use-cases/tasks/manage-tasks.use-case';
import { InMemoryTaskRepository } from '../../../helpers/in-memory-task.repository';
import { Task } from '../../../../src/domain/entities/task.entity';
import { TaskStatus } from '../../../../src/domain/enums/task-status.enum';
import { TaskTag } from '../../../../src/domain/enums/task-tag.enum';
import { Priority } from '../../../../src/domain/enums/priority.enum';

describe('ManageTasksUseCase', () => {
  let taskRepo: InMemoryTaskRepository;
  let useCase: ManageTasksUseCase;

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepository();
    useCase = new ManageTasksUseCase(taskRepo);
  });

  describe('create', () => {
    it('crea una tarea en estado PENDING', async () => {
      const result = await useCase.create({
        title: 'Revisar frenos',
        tag: TaskTag.TECHNICAL,
        priority: Priority.HIGH,
        createdById: 'user-1',
      });

      const saved = await taskRepo.findById(result.id);
      expect(saved?.status).toBe(TaskStatus.PENDING);
      expect(saved?.title).toBe('Revisar frenos');
      expect(saved?.priority).toBe(Priority.HIGH);
    });
  });

  describe('changeStatus', () => {
    it('cambia el estado de una tarea existente a una transición válida', async () => {
      const task = new Task('task-1', 'Tarea', null, TaskStatus.PENDING, TaskTag.TECHNICAL, Priority.MEDIUM, null, 'user-1', null, null);
      taskRepo = new InMemoryTaskRepository([task]);
      useCase = new ManageTasksUseCase(taskRepo);

      await useCase.changeStatus('task-1', TaskStatus.IN_PROGRESS);

      const saved = await taskRepo.findById('task-1');
      expect(saved?.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('lanza error si la tarea no existe', async () => {
      await expect(useCase.changeStatus('no-existe', TaskStatus.IN_PROGRESS)).rejects.toThrow('Tarea no encontrada');
    });

    it('lanza error si la transición de estado es inválida', async () => {
      const task = new Task('task-1', 'Tarea', null, TaskStatus.COMPLETED, TaskTag.TECHNICAL, Priority.MEDIUM, null, 'user-1', null, new Date());
      taskRepo = new InMemoryTaskRepository([task]);
      useCase = new ManageTasksUseCase(taskRepo);

      await expect(useCase.changeStatus('task-1', TaskStatus.IN_PROGRESS)).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('lista las tareas según los filtros', async () => {
      const t1 = new Task('task-1', 'Uno', null, TaskStatus.PENDING, TaskTag.TECHNICAL, Priority.LOW, null, 'user-1', null, null);
      const t2 = new Task('task-2', 'Dos', null, TaskStatus.IN_PROGRESS, TaskTag.TECHNICAL, Priority.LOW, null, 'user-1', null, null);
      taskRepo = new InMemoryTaskRepository([t1, t2]);
      useCase = new ManageTasksUseCase(taskRepo);

      const result = await useCase.list({ page: 1, pageSize: 10, status: TaskStatus.PENDING });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('task-1');
      expect(result.total).toBe(1);
    });
  });

  describe('delete', () => {
    it('elimina una tarea existente', async () => {
      const task = new Task('task-1', 'Tarea', null, TaskStatus.PENDING, TaskTag.TECHNICAL, Priority.MEDIUM, null, 'user-1', null, null);
      taskRepo = new InMemoryTaskRepository([task]);
      useCase = new ManageTasksUseCase(taskRepo);

      await useCase.delete('task-1');

      expect(await taskRepo.findById('task-1')).toBeNull();
    });

    it('lanza error si la tarea a eliminar no existe', async () => {
      await expect(useCase.delete('no-existe')).rejects.toThrow('Tarea no encontrada');
    });
  });
});
