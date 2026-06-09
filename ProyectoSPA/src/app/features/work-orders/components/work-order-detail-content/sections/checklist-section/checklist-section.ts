import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { NotificationService } from '../../../../../../core';
import { WorkOrdersService } from '../../../../services';

@Component({
	selector: 'spartan-wo-checklist-section',
	imports: [CommonModule, HlmCardImports, HlmCheckboxImports, HlmProgressImports, HlmInputImports, HlmButtonImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './checklist-section.html',
	styleUrl: './checklist-section.css',
})
export class WorkOrderChecklistSectionComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _service = inject(WorkOrdersService);
	private readonly _notification = inject(NotificationService);
	private readonly _params = toSignal(this._route.paramMap, { initialValue: this._route.snapshot.paramMap });

	protected readonly orderId = computed(() => this._params().get('id') ?? '');
	protected readonly order = computed(() => this._service.getById(this.orderId()));
	protected readonly checklistInicialProgress = computed(() => this.calculateProgress('checklistInicial'));
	protected readonly checklistTrabajoProgress = computed(() => this.calculateProgress('checklistTrabajo'));

	protected readonly newChecklistInicialTask = signal('');
	protected readonly newChecklistInicialOwner = signal('');
	protected readonly newChecklistTrabajoTask = signal('');
	protected readonly newChecklistTrabajoOwner = signal('');

	protected toggleChecklist(listType: 'checklistInicial' | 'checklistTrabajo', itemId: string): void {
		const order = this.order();
		if (!order) return;
		this._service.toggleChecklist(order.id, listType, itemId);
	}

	protected addChecklistItem(listType: 'checklistInicial' | 'checklistTrabajo'): void {
		const order = this.order();
		if (!order) return;

		if (listType === 'checklistInicial') {
			this._service.addChecklistItem(order.id, listType, this.newChecklistInicialTask(), this.newChecklistInicialOwner());
			this.newChecklistInicialTask.set('');
			this.newChecklistInicialOwner.set('');
			this._notification.success('Tarea agregada a checklist inicial.');
			return;
		}

		this._service.addChecklistItem(order.id, listType, this.newChecklistTrabajoTask(), this.newChecklistTrabajoOwner());
		this.newChecklistTrabajoTask.set('');
		this.newChecklistTrabajoOwner.set('');
		this._notification.success('Tarea agregada a checklist de trabajos.');
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
