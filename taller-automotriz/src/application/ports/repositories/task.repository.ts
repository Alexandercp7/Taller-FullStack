import { Task } from '../../../domain/entities/task.entity';
import { TaskStatus } from '../../../domain/enums/task-status.enum';

export interface TaskFilters {
  page: number;
  pageSize: number;
  status?: TaskStatus;
  assignedTo?: string;
  createdById?: string;
}

export interface TaskRepository {
  findById(id: string): Promise<Task | null>;
  findByFilters(filters: TaskFilters): Promise<{ data: Task[]; total: number }>;
  save(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
}
