import { TaskRepository, TaskFilters } from '../../ports/repositories/task.repository';
import { Task } from '../../../domain/entities/task.entity';
import { TaskStatus } from '../../../domain/enums/task-status.enum';
import { TaskTag } from '../../../domain/enums/task-tag.enum';
import { Priority } from '../../../domain/enums/priority.enum';
import { createId } from '../../../shared/identifier';

interface CreateTaskInput {
  title: string;
  description?: string;
  tag: TaskTag;
  priority: Priority;
  assignedTo?: string;
  createdById: string;
  dueDate?: Date;
}

export class ManageTasksUseCase {
  constructor(private readonly taskRepo: TaskRepository) {}

  async create(input: CreateTaskInput): Promise<{ id: string }> {
    const task = new Task(
      createId(),
      input.title,
      input.description ?? null,
      TaskStatus.PENDING,
      input.tag,
      input.priority,
      input.assignedTo ?? null,
      input.createdById,
      input.dueDate ?? null,
      null,
    );

    await this.taskRepo.save(task);
    return { id: task.id };
  }

  async changeStatus(taskId: string, newStatus: TaskStatus): Promise<void> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) throw new Error('Tarea no encontrada');
    task.changeStatus(newStatus);
    await this.taskRepo.save(task);
  }

  async list(filters: TaskFilters) {
    return this.taskRepo.findByFilters(filters);
  }

  async delete(taskId: string): Promise<void> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) throw new Error('Tarea no encontrada');
    await this.taskRepo.delete(taskId);
  }
}
