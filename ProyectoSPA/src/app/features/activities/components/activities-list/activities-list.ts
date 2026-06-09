import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideTrash2 } from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { Activity } from '../../models/activity.model';

@Component({
  selector: 'spartan-activities-list',
  standalone: true,
  imports: [
    CommonModule,
    HlmTableImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmSelectImports,
    NgIcon,
  ],
  providers: [provideIcons({ lucideEye, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activities-list.html',
  styleUrl: './activities-list.css',
})
export class ActivitiesListComponent {
  readonly filteredActivities = input.required<Activity[]>();
  readonly viewDetails = output<Activity>();
  readonly deleteActivity = output<string>();
  readonly updateActivityStatus = output<{ id: string; estado: Activity['estado'] }>();

  protected readonly estados: Array<Activity['estado']> = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada'];

  protected statusClass(estado: Activity['estado']): string {
    switch (estado) {
      case 'Pendiente':
        return 'status-pending';
      case 'En Progreso':
        return 'status-progress';
      case 'Completada':
        return 'status-completed';
      case 'Cancelada':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  protected priorityClass(prioridad: string): string {
    switch (prioridad) {
      case 'Alta':
        return 'priority-high';
      case 'Media':
        return 'priority-medium';
      case 'Baja':
        return 'priority-low';
      default:
        return '';
    }
  }

  protected tagStyle(etiqueta: string): string {
    switch (etiqueta) {
      case 'Administrativa':
        return 'tag-administrative';
      case 'Técnica':
        return 'tag-technical';
      case 'Comercial':
        return 'tag-commercial';
      case 'Compras':
        return 'tag-purchasing';
      case 'Mantenimiento':
        return 'tag-maintenance';
      default:
        return 'tag-default';
    }
  }

  protected onViewDetails(activity: Activity): void {
    this.viewDetails.emit(activity);
  }

  protected onDeleteActivity(id: string): void {
    this.deleteActivity.emit(id);
  }

  protected onStatusChange(activity: Activity, newStatus: Activity['estado']): void {
    this.updateActivityStatus.emit({ id: activity.id, estado: newStatus });
  }
}
