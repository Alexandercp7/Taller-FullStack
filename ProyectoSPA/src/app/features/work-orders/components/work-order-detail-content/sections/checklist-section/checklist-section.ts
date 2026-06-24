import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { NotificationService } from '../../../../../../core';
import type { ChecklistItem } from '../../../../models';
import { WorkOrdersService } from '../../../../services';

interface ResponsableOption {
	id: string;
	name: string;
}

@Component({
	selector: 'spartan-wo-checklist-section',
	imports: [CommonModule, HlmCardImports, HlmCheckboxImports, HlmProgressImports, HlmInputImports, HlmButtonImports, HlmSelectImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './checklist-section.html',
	styleUrl: './checklist-section.css',
})
export class WorkOrderChecklistSectionComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _service = inject(WorkOrdersService);
	private readonly _notification = inject(NotificationService);
	private readonly _http = inject(HttpClient);
	private readonly _params = toSignal(this._route.paramMap, { initialValue: this._route.snapshot.paramMap });

	protected readonly orderId = computed(() => this._params().get('id') ?? '');
	protected readonly order = computed(() => this._service.getById(this.orderId()));
	protected readonly checklistInicialProgress = computed(() => this.calculateProgress('checklistInicial'));
	protected readonly checklistTrabajoProgress = computed(() => this.calculateProgress('checklistTrabajo'));

	protected readonly responsables = signal<ResponsableOption[]>([]);

	protected readonly newChecklistInicialTask = signal('');
	protected readonly newChecklistInicialOwners = signal<string[]>([]);
	protected readonly newChecklistTrabajoTask = signal('');
	protected readonly newChecklistTrabajoOwners = signal<string[]>([]);
	protected readonly editingItems = signal<Record<string, { tarea: string; responsableIds: string[] }>>({});

	constructor() {
		this._http.get<{ data: ResponsableOption[] }>('/api/v1/employees').subscribe({
			next: (res) => this.responsables.set(res.data ?? []),
			error: () => this.responsables.set([]),
		});
	}

	protected toggleChecklist(listType: 'checklistInicial' | 'checklistTrabajo', itemId: string): void {
		const order = this.order();
		if (!order) return;
		this._service.toggleChecklist(order.id, listType, itemId);
	}

	protected addChecklistItem(listType: 'checklistInicial' | 'checklistTrabajo'): void {
		const order = this.order();
		if (!order) return;

		if (listType === 'checklistInicial') {
			this._service.addChecklistItem(order.id, listType, this.newChecklistInicialTask(), this.newChecklistInicialOwners());
			this.newChecklistInicialTask.set('');
			this.newChecklistInicialOwners.set([]);
			this._notification.success('Tarea agregada a checklist inicial.');
			return;
		}

		this._service.addChecklistItem(order.id, listType, this.newChecklistTrabajoTask(), this.newChecklistTrabajoOwners());
		this.newChecklistTrabajoTask.set('');
		this.newChecklistTrabajoOwners.set([]);
		this._notification.success('Tarea agregada a checklist de trabajos.');
	}

	protected responsablesLabel(names: string[]): string {
		if (names.length === 0) {
			return 'Sin asignar';
		}

		return names.join(', ');
	}

	protected responsableLabel(id: string): string {
		return this.responsables().find((resp) => resp.id === id)?.name ?? 'Sin asignar';
	}

	protected responsablesSummaryByIds(ids: string[]): string {
		if (ids.length === 0) {
			return 'Seleccionar responsables';
		}

		const names = ids.map((id) => this.responsableLabel(id)).filter((name) => name !== 'Sin asignar');
		if (names.length === 0) {
			return 'Seleccionar responsables';
		}

		return names.length === 1 ? names[0] : `${names[0]} (+${names.length - 1})`;
	}

	protected isResponsableSelected(selectedIds: string[], responsableId: string): boolean {
		return selectedIds.includes(responsableId);
	}

	protected toggleNewResponsable(listType: 'checklistInicial' | 'checklistTrabajo', responsableId: string): void {
		const source = listType === 'checklistInicial' ? this.newChecklistInicialOwners : this.newChecklistTrabajoOwners;
		source.update((ids) =>
			ids.includes(responsableId) ? ids.filter((id) => id !== responsableId) : [...ids, responsableId]
		);
	}

	protected removeNewResponsable(listType: 'checklistInicial' | 'checklistTrabajo', responsableId: string): void {
		const source = listType === 'checklistInicial' ? this.newChecklistInicialOwners : this.newChecklistTrabajoOwners;
		source.update((ids) => ids.filter((id) => id !== responsableId));
	}

	protected startEditing(item: ChecklistItem): void {
		this.editingItems.update((state) => ({
			...state,
			[item.id]: {
				tarea: item.tarea,
				responsableIds: [...item.responsableIds],
			},
		}));
	}

	protected cancelEditing(itemId: string): void {
		this.editingItems.update((state) => {
			const next = { ...state };
			delete next[itemId];
			return next;
		});
	}

	protected isEditing(itemId: string): boolean {
		return !!this.editingItems()[itemId];
	}

	protected editingItem(itemId: string): { tarea: string; responsableIds: string[] } | undefined {
		return this.editingItems()[itemId];
	}

	protected updateEditingTask(itemId: string, tarea: string): void {
		this.editingItems.update((state) => ({
			...state,
			[itemId]: {
				tarea,
				responsableIds: state[itemId]?.responsableIds ?? [],
			},
		}));
	}

	protected toggleEditingResponsable(itemId: string, responsableId: string): void {
		this.editingItems.update((state) => {
			const current = state[itemId];
			if (!current) return state;
			return {
				...state,
				[itemId]: {
					...current,
					responsableIds: current.responsableIds.includes(responsableId)
						? current.responsableIds.filter((id) => id !== responsableId)
						: [...current.responsableIds, responsableId],
				},
			};
		});
	}

	protected removeEditingResponsable(itemId: string, responsableId: string): void {
		this.editingItems.update((state) => {
			const current = state[itemId];
			if (!current) return state;
			return {
				...state,
				[itemId]: {
					...current,
					responsableIds: current.responsableIds.filter((id) => id !== responsableId),
				},
			};
		});
	}

	protected saveChecklistItem(listType: 'checklistInicial' | 'checklistTrabajo', itemId: string): void {
		const order = this.order();
		const current = this.editingItems()[itemId];
		if (!order || !current) return;

		this._service.updateChecklistItem(order.id, listType, itemId, current);
		this.cancelEditing(itemId);
		this._notification.success('Actividad del checklist actualizada.');
	}

	private calculateProgress(listType: 'checklistInicial' | 'checklistTrabajo'): number {
		const order = this.order();
		if (!order) return 0;
		const list = order[listType];
		if (list.length === 0) return 0;
		const complete = list.filter((item) => item.completada).length;
		return Math.round((complete / list.length) * 100);
	}
}
