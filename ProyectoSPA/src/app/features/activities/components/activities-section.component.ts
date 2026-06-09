import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucidePencil, lucideTrash2 } from '@ng-icons/lucide';
import { NotificationService } from '../../../core';
import { ActivitiesService } from '../services/activities.service';
import { Activity } from '../models/activity.model';
import { ActivityDetailDialogComponent, type ActivityDetailDialogContext } from './activity-detail-dialog/activity-detail-dialog';
import { CreateActivityDialogComponent, type CreateActivityDialogContext } from './create-activity-dialog/create-activity-dialog';

@Component({
  selector: 'spartan-activities-section',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    HlmCardImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmInputImports,
    HlmSelectImports,
    HlmTableImports,
    NgIcon,
  ],
  providers: [provideIcons({ lucideEye, lucidePencil, lucideTrash2 })],
  templateUrl: './activities-section.html',
  styleUrl: './activities-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivitiesSectionComponent implements OnInit {
  private readonly service = inject(ActivitiesService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(HlmDialogService);

  public readonly activities = computed(() => this.service.getActivities());

  protected readonly viewMode = signal<'list' | 'kanban' | 'kanban-tags'>('list');
  protected readonly kanbanViewMode = signal<'estado' | 'tags'>('estado');
  protected readonly searchText = signal('');
  protected readonly selectedTags = signal<string[]>([]);
  protected readonly selectedPriorities = signal<string[]>([]);
  protected readonly allTags = signal([
    'Administrativa',
    'Técnica',
    'Comercial',
    'Compras',
    'Mantenimiento',
  ]);

  protected readonly estados: Array<Activity['estado']> = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada'];
  protected readonly prioridades: Array<Activity['prioridad']> = ['Alta', 'Media', 'Baja'];

  private readonly kanbanDropListIdsArray = [
    'kanban-activities-pendiente',
    'kanban-activities-en-progreso',
    'kanban-activities-completada',
    'kanban-activities-cancelada',
  ];

  protected readonly filteredActivities = computed(() => {
    const search = this.searchText().trim().toLowerCase();
    const tags = this.selectedTags();
    const priorities = this.selectedPriorities();

    return this.activities().filter(activity => {
      const matchesSearch = !search || 
        activity.titulo.toLowerCase().includes(search) ||
        activity.descripcion.toLowerCase().includes(search) ||
        activity.asignadoA.toLowerCase().includes(search);

      const matchesTag = tags.length === 0 || tags.includes(activity.etiqueta);
      const matchesPriority = priorities.length === 0 || priorities.includes(activity.prioridad);

      return matchesSearch && matchesTag && matchesPriority;
    });
  });

  protected readonly kanbanColumns = computed(() =>
    this.estados.map(estado => ({
      estado,
      activities: this.filteredActivities().filter(a => a.estado === estado),
    }))
  );

  protected readonly kanbanColumnsByTag = computed(() => {
    const allTags = this.allTags();
    const columnsByTag = allTags.map(tag => ({
      tag,
      activities: this.filteredActivities().filter(a => a.etiqueta === tag),
    }));
    
    const untaggedActivities = this.filteredActivities().filter(a => !a.etiqueta || a.etiqueta.trim() === '');
    if (untaggedActivities.length > 0 || columnsByTag.length > 0) {
      columnsByTag.push({
        tag: 'Sin etiqueta',
        activities: untaggedActivities,
      });
    }
    
    return columnsByTag;
  });

  protected getKanbanDropListIds(): string[] {
    const estadoIds = this.kanbanDropListIdsArray;
    const tagIds = this.allTags().map(tag => this.getKanbanDropListIdForTag(tag));
    const untaggedId = this.getKanbanDropListIdForTag('Sin etiqueta');
    return [...estadoIds, ...tagIds, untaggedId];
  }

  ngOnInit(): void {
    this.checkUpcomingDeadlines();
  }

  private checkUpcomingDeadlines(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const activity of this.activities()) {
      if (activity.estado === 'Completada' || activity.estado === 'Cancelada') continue;

      const deadline = new Date(activity.fechaLimite);
      deadline.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        this.notification.warning(`Actividad "${activity.titulo}" vence mañana.`);
      } else if (diffDays === 0) {
        this.notification.error(`Actividad "${activity.titulo}" vence hoy.`);
      }
    }
  }

  protected setView(mode: 'list' | 'kanban' | 'kanban-tags'): void {
    this.viewMode.set(mode);
  }

  protected setKanbanView(mode: 'estado' | 'tags'): void {
    this.kanbanViewMode.set(mode);
  }

  protected updateSearch(value: string): void {
    this.searchText.set(value);
  }

  protected toggleTag(tag: string): void {
    this.selectedTags.update(tags =>
      tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]
    );
  }

  protected togglePriority(priority: string): void {
    this.selectedPriorities.update(priorities =>
      priorities.includes(priority) ? priorities.filter(p => p !== priority) : [...priorities, priority]
    );
  }

  protected selectedTagsLabel(): string {
    const tags = this.selectedTags();
    if (tags.length === 0) return 'Todas las etiquetas';
    if (tags.length === 1) return tags[0];
    return `${tags[0]} (+${tags.length - 1} más)`;
  }

  protected selectedPrioritiesLabel(): string {
    const priorities = this.selectedPriorities();
    if (priorities.length === 0) return 'Todas las prioridades';
    if (priorities.length === 1) return priorities[0];
    return `${priorities[0]} (+${priorities.length - 1} más)`;
  }

  protected getKanbanDropListId(estado: Activity['estado']): string {
    const sanitized = estado
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    return `kanban-activities-${sanitized}`;
  }

  protected onKanbanDrop(event: CdkDragDrop<Activity[]>, targetEstado: Activity['estado']): void {
    const movedActivity = event.item.data as Activity | undefined;
    if (!movedActivity) {
      return;
    }
    if (movedActivity.estado === targetEstado) {
      return;
    }
    this.service.updateActivity(movedActivity.id, { estado: targetEstado });
    this.notification.success(`Actividad "${movedActivity.titulo}" movida a ${targetEstado}`);
  }

  protected onTagKanbanDrop(event: CdkDragDrop<Activity[]>, targetTag: string): void {
    const movedActivity = event.item.data as Activity | undefined;
    if (!movedActivity) {
      return;
    }
    if (movedActivity.etiqueta === targetTag) {
      return;
    }
    this.service.updateActivity(movedActivity.id, { etiqueta: targetTag });
    this.notification.success(`Actividad "${movedActivity.titulo}" movida a etiqueta "${targetTag}"`);
  }

  protected getKanbanDropListIdForTag(tag: string): string {
    const sanitized = tag
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    return `kanban-activities-tag-${sanitized}`;
  }

  protected createActivity(): void {
    const context: CreateActivityDialogContext = {
      onCreate: (payload) => {
        const activity = this.service.generateActivityWithId(payload);
        this.service.addActivity(activity);
        this.notification.success('Actividad creada correctamente.');
      },
    };

    this.dialog.open(CreateActivityDialogComponent, {
      context,
      contentClass: 'activity-create-dialog-content',
    });
  }

  protected editActivity(activity: Activity): void {
    const context: CreateActivityDialogContext = {
      activity,
      onUpdate: (id: string, payload) => {
        this.service.updateActivity(id, payload);
        this.notification.success('Actividad actualizada correctamente.');
      },
    };

    this.dialog.open(CreateActivityDialogComponent, {
      context,
      contentClass: 'activity-create-dialog-content',
    });
  }

  protected viewDetails(activity: Activity): void {
    const context: ActivityDetailDialogContext = {
      activity,
      onCommentAdded: () => {
        this.notification.success('Comentario agregado.');
      },
      onCommentDeleted: () => {
        this.notification.success('Comentario eliminado.');
      },
    };

    this.dialog.open(ActivityDetailDialogComponent, {
      context,
      contentClass: 'activity-detail-dialog-content',
    });
  }

  protected deleteActivity(id: string): void {
    this.service.deleteActivity(id);
    this.notification.success('Actividad eliminada.');
  }

  protected updateActivityStatus(activityId: string, newEstado: Activity['estado'] | string | null): void {
    if (newEstado && this.estados.includes(newEstado as Activity['estado'])) {
      this.service.updateActivity(activityId, { estado: newEstado as Activity['estado'] });
      this.notification.success('Estado actualizado.');
    }
  }

  protected updateActivityPriority(activityId: string, newPrioridad: Activity['prioridad'] | string | null): void {
    if (newPrioridad && this.prioridades.includes(newPrioridad as Activity['prioridad'])) {
      this.service.updateActivity(activityId, { prioridad: newPrioridad as Activity['prioridad'] });
      this.notification.success('Prioridad actualizada.');
    }
  }

  protected updateActivityTag(activityId: string, newTag: string): void {
    this.service.updateActivity(activityId, { etiqueta: newTag });
    this.notification.success('Etiqueta actualizada.');
  }

  protected addNewTag(newTag: string): void {
    if (!newTag.trim() || this.allTags().includes(newTag)) return;
    this.allTags.update(tags => [...tags, newTag]);
    this.notification.success(`Etiqueta '${newTag}' creada.`);
  }

  protected getAvailableTags(): string[] {
    return this.allTags();
  }

  protected priorityChipClass(priority: Activity['prioridad']): string {
    switch (priority) {
      case 'Alta':
        return 'act-chip-priority-alta';
      case 'Media':
        return 'act-chip-priority-media';
      case 'Baja':
        return 'act-chip-priority-baja';
      default:
        return '';
    }
  }

  protected priorityVariant(priority: Activity['prioridad']): 'default' | 'outline' | 'secondary' | 'destructive' {
    switch (priority) {
      case 'Alta':
        return 'destructive';
      case 'Media':
        return 'secondary';
      case 'Baja':
        return 'outline';
      default:
        return 'default';
    }
  }

  protected estadoChipClass(estado: Activity['estado']): string {
    switch (estado) {
      case 'Pendiente':
        return 'act-chip-estado-pendiente';
      case 'En Progreso':
        return 'act-chip-estado-progreso';
      case 'Completada':
        return 'act-chip-estado-completada';
      case 'Cancelada':
        return 'act-chip-estado-cancelada';
      default:
        return '';
    }
  }

  protected estadoVariant(estado: Activity['estado']): 'default' | 'outline' | 'secondary' | 'destructive' {
    switch (estado) {
      case 'Pendiente':
        return 'outline';
      case 'En Progreso':
        return 'secondary';
      case 'Completada':
        return 'default';
      case 'Cancelada':
        return 'destructive';
      default:
        return 'default';
    }
  }
}
