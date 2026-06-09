import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { KpisService } from '../../services';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { NotificationService } from '../../../../core';
import { Activity, ROLE_TYPES, RoleType } from '../../models';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { AddActivityDialogComponent, ConfirmDeleteDialogComponent } from '../dialogs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucideTrash2 } from '@ng-icons/lucide';

@Component({
	selector: 'app-activities-kanban-roles',
	standalone: true,
	imports: [
		CommonModule,
		DragDropModule,
		HlmCardImports,
		HlmBadgeImports,
		HlmButtonImports,
		NgIcon,
	],
	providers: [provideIcons({ lucidePencil, lucideTrash2 })],
	templateUrl: './activities-kanban-roles.html',
	styleUrl: './activities-kanban-roles.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivitiesKanbanRolesComponent {
	protected readonly kpisService = inject(KpisService);
	protected readonly _notification = inject(NotificationService);
	protected readonly _dialog = inject(HlmDialogService);

	protected readonly roles = ROLE_TYPES;

	protected readonly kanbanColumns = computed(() =>
		this.roles.map((role) => ({
			role,
			activities: this.kpisService.activities().filter((a) => a.roleAsignado === role),
		})),
	);

	protected readonly kanbanDropListIds = computed(() => this.roles.map((role) => this.getKanbanDropListId(role)));

	protected onKanbanDrop(event: CdkDragDrop<Activity[]>, targetRole: RoleType): void {
		const movedActivity = event.item.data as Activity | undefined;
		if (!movedActivity || movedActivity.roleAsignado === targetRole) {
			return;
		}
		this.kpisService.updateActivityRole(movedActivity.id, targetRole);
		this._notification.info(`Actividad "${movedActivity.titulo}" asignada a ${targetRole}.`);
	}

	protected getKanbanDropListId(role: RoleType): string {
		return `kanban-role-${role.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
	}

	protected getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' {
		const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
			Pendiente: 'secondary',
			'En Proceso': 'default',
			Completada: 'secondary',
			Cancelada: 'destructive',
		};
		return variants[status] || 'secondary';
	}

	protected getTag(tagId: string) {
		return this.kpisService.tags().find((t) => t.id === tagId);
	}

	protected onAddActivity(role: RoleType): void {
		this._dialog.open(AddActivityDialogComponent, {
			context: { role, isEditing: false },
			contentClass: 'kpis-dialog-content',
		});
	}

	protected onEditActivity(activity: Activity): void {
		this._dialog.open(AddActivityDialogComponent, {
			context: { activity, isEditing: true },
			contentClass: 'kpis-dialog-content',
		});
	}

	protected onDeleteActivity(activity: Activity): void {
		const ref = this._dialog.open(ConfirmDeleteDialogComponent, {
			context: {
				title: '¿Eliminar actividad?',
				description: `¿Estás seguro de que deseas eliminar "${activity.titulo}"? Esta acción no se puede deshacer.`,
				confirmText: 'Eliminar',
				cancelText: 'Cancelar',
			},
			contentClass: 'kpis-dialog-content',
		});

		ref.closed$.subscribe((confirmed) => {
			if (confirmed) {
				this.kpisService.deleteActivity(activity.id);
				this._notification.success('Actividad eliminada');
			}
		});
	}
}
