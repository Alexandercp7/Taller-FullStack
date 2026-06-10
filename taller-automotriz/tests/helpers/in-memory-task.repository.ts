import { TaskRepository, TaskFilters } from '../../src/application/ports/repositories/task.repository';
import { Task } from '../../src/domain/entities/task.entity';

export class InMemoryTaskRepository implements TaskRepository {
  private store: Task[];

  constructor(initial: Task[] = []) {
    this.store = [...initial];
  }

  async findById(id: string): Promise<Task | null> {
    return this.store.find((t) => t.id === id) ?? null;
  }

  async findByFilters(filters: TaskFilters): Promise<{ data: Task[]; total: number }> {
    let data = [...this.store];
    if (filters.status) data = data.filter((t) => t.status === filters.status);
    if (filters.assignedTo) data = data.filter((t) => t.assignedTo === filters.assignedTo);
    if (filters.createdById) data = data.filter((t) => t.createdById === filters.createdById);
    const total = data.length;
    const start = (filters.page - 1) * filters.pageSize;
    return { data: data.slice(start, start + filters.pageSize), total };
  }

  async save(task: Task): Promise<void> {
    const idx = this.store.findIndex((t) => t.id === task.id);
    if (idx >= 0) this.store[idx] = task;
    else this.store.push(task);
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((t) => t.id !== id);
  }
}
