import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import type { WorkOrderItem } from '../../models/dashboard.models';

@Component({
	selector: 'spartan-recent-work-orders',
	imports: [CommonModule, HlmCardImports, HlmBadgeImports, HlmTableImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './recent-work-orders.html',
	styleUrl: './recent-work-orders.css',
})
export class RecentWorkOrdersComponent {
	private readonly _router = inject(Router);

	public readonly orders = input.required<WorkOrderItem[]>();

	protected goToDetail(id: string): void {
		void this._router.navigate(['/app/ordenes-trabajo', id]);
	}

	protected statusChipClass(label: string): string {
		switch (label) {
			case 'Agendado':
				return 'wo-chip-status-agendado';
			case 'En Espera':
				return 'wo-chip-status-espera';
			case 'En Proceso':
				return 'wo-chip-status-proceso';
			case 'Terminado':
				return 'wo-chip-status-terminado';
			case 'En Garantia':
				return 'wo-chip-status-garantia';
			case 'Rezagado':
				return 'wo-chip-status-rezagado';
			case 'Entregado':
				return 'wo-chip-status-entregado';
			default:
				return '';
		}
	}

	protected priorityChipClass(label: string): string {
		switch (label) {
			case 'Alta':
				return 'wo-chip-priority-alta';
			case 'Media':
				return 'wo-chip-priority-media';
			case 'Baja':
				return 'wo-chip-priority-baja';
			default:
				return '';
		}
	}
}
