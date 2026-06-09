import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { Activity } from '../../models/activity.model';
import { ActivityCardComponent } from '../activity-card/activity-card';

@Component({
  selector: 'spartan-activities-kanban',
  standalone: true,
  imports: [CommonModule, ActivityCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activities-kanban.html',
  styleUrl: './activities-kanban.css',
})
export class ActivitiesKanbanComponent {
  readonly activities = input.required<Activity[]>();
  readonly filteredActivities = input.required<Activity[]>();
  readonly viewDetails = output<Activity>();
  readonly deleteActivity = output<string>();
  readonly updateActivityStatus = output<{ id: string; estado: Activity['estado'] }>();

  protected readonly estados: Array<Activity['estado']> = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada'];

  protected readonly activitiesByStatus = computed(() => {
    const filtered = this.filteredActivities();
    return new Map(
      this.estados.map(status => [
        status,
        filtered.filter(a => a.estado === status)
      ])
    );
  });

  protected getActivitiesByStatus(status: Activity['estado']): Activity[] {
    return this.activitiesByStatus().get(status) || [];
  }

  protected onViewDetails(activity: Activity): void {
    this.viewDetails.emit(activity);
  }

  protected onDeleteActivity(id: string): void {
    this.deleteActivity.emit(id);
  }

  protected onDragStart(event: DragEvent, activity: Activity): void {
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('activity-id', activity.id);
    event.dataTransfer!.setData('activity-data', JSON.stringify(activity));
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  protected onDrop(event: DragEvent, newStatus: Activity['estado']): void {
    event.preventDefault();
    const activityId = event.dataTransfer!.getData('activity-id');
    if (activityId) {
      this.updateActivityStatus.emit({ id: activityId, estado: newStatus });
    }
  }

  protected getColumnTitle(status: Activity['estado']): string {
    const titles: Record<Activity['estado'], string> = {
      'Pendiente': '📋 Pendiente',
      'En Progreso': '⚙️ En Progreso',
      'Completada': '✅ Completada',
      'Cancelada': '❌ Cancelada'
    };
    return titles[status];
  }
}
