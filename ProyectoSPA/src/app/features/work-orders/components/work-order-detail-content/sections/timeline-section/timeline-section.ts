import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HlmCardImports } from '@spartan-ng/helm/card';
import type { TimelineEvent, WorkOrder } from '../../../../models';
import { WorkOrdersService } from '../../../../services';

const STATUS_LABELS: Record<string, string> = {
	SCHEDULED: 'Agendado', ON_HOLD: 'En Espera', IN_PROGRESS: 'En Proceso',
	COMPLETED: 'Terminado', WARRANTY: 'En Garantia', DELAYED: 'Rezagado',
	DELIVERED: 'Entregado', ARCHIVED: 'Archivado',
};

@Component({
	selector: 'spartan-wo-timeline-section',
	imports: [CommonModule, HlmCardImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './timeline-section.html',
	styleUrl: './timeline-section.css',
})
export class WorkOrderTimelineSectionComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _service = inject(WorkOrdersService);
	private readonly _params = toSignal(this._route.paramMap, { initialValue: this._route.snapshot.paramMap });

	protected readonly orderId = computed(() => this._params().get('id') ?? '');
	protected readonly order = computed(() => this._service.getById(this.orderId()));

	protected describeEvent(event: TimelineEvent, order: WorkOrder): string {
		const detalle = (event.detalle ?? {}) as Record<string, any>;
		switch (event.evento) {
			case 'order_created':
				return 'Orden Creada';
			case 'status_changed':
				return `Cambio de estado a "${STATUS_LABELS[detalle['newStatus']] ?? detalle['newStatus'] ?? ''}"`;
			case 'order_closed':
				return `Orden cerrada${detalle['totalAmount'] !== undefined ? ` - Total: $${Number(detalle['totalAmount']).toLocaleString('es-MX', { maximumFractionDigits: 2 })}` : ''}`;
			case 'phase_reverted':
				return `Fase regresada a "${detalle['targetPhase'] ?? ''}"`;
			case 'part_assigned':
				return `Refaccion asignada: ${detalle['itemName'] ?? ''}${detalle['quantity'] ? ` x${detalle['quantity']}` : ''}`;
			case 'intake_causes_registered':
				return `Causas de ingreso registradas: ${Array.isArray(detalle['causes']) ? detalle['causes'].join(', ') : ''}`;
			case 'note_added': {
				const visibilidad = detalle['visibility'] === 'CLIENT' ? 'para el cliente' : 'interna';
				return `Nota ${visibilidad}: "${detalle['preview'] ?? ''}"`;
			}
			case 'photo_added':
				return 'Foto agregada';
			case 'checklist_item_added':
				return `Tarea agregada al checklist: "${detalle['label'] ?? ''}"`;
			case 'checklist_item_updated':
				return `Tarea "${detalle['label'] ?? ''}" marcada como ${detalle['checked'] ? 'completada' : 'pendiente'}`;
			default:
				return event.descripcion;
		}
	}

	protected getEventPhotoUrl(event: TimelineEvent, order: WorkOrder): string | null {
		if (event.evento !== 'photo_added') return null;
		const photoId = (event.detalle as Record<string, any> | null)?.['photoId'];
		if (!photoId) return null;
		return order.fotos.find(f => f.id === String(photoId))?.url ?? null;
	}
}
