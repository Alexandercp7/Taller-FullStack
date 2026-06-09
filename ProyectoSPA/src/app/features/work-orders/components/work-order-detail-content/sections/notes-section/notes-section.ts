import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { NotificationService } from '../../../../../../core';
import { WorkOrdersService } from '../../../../services';

@Component({
	selector: 'spartan-wo-notes-section',
	imports: [CommonModule, HlmCardImports, HlmTextareaImports, HlmButtonImports, HlmInputImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './notes-section.html',
	styleUrl: './notes-section.css',
})
export class WorkOrderNotesSectionComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _service = inject(WorkOrdersService);
	private readonly _notification = inject(NotificationService);
	private readonly _params = toSignal(this._route.paramMap, { initialValue: this._route.snapshot.paramMap });

	protected readonly orderId = computed(() => this._params().get('id') ?? '');
	protected readonly order = computed(() => this._service.getById(this.orderId()));

	protected readonly firmaNombre = signal('');
	protected readonly nuevaNotaInterna = signal('');
	protected readonly nuevaNotaCliente = signal('');

	protected agregarNotaInterna(): void {
		const order = this.order();
		if (!order) return;
		this._service.addInternalNote(order.id, this.nuevaNotaInterna());
		this.nuevaNotaInterna.set('');
		this._notification.success('Nota interna guardada.');
	}

	protected agregarNotaCliente(): void {
		const order = this.order();
		if (!order) return;
		this._service.addCustomerNote(order.id, this.nuevaNotaCliente());
		this.nuevaNotaCliente.set('');
		this._notification.success('Nota para cliente guardada.');
	}
}
