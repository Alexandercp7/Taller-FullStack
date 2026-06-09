import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideTrash2 } from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Activity } from '../../models/activity.model';

@Component({
  selector: 'spartan-activity-card',
  standalone: true,
  imports: [CommonModule, HlmBadgeImports, HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucideEye, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activity-card.html',
  styleUrl: './activity-card.css',
})
export class ActivityCardComponent {
  readonly activity = input.required<Activity>();
  readonly viewDetails = output<Activity>();
  readonly deleteActivity = output<string>();

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

  protected onView(): void {
    this.viewDetails.emit(this.activity());
  }

  protected onDelete(): void {
    this.deleteActivity.emit(this.activity().id);
  }
}
