import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { type WorkOrderStatus } from '../../../work-orders/models';
import { WorkOrdersService } from '../../../work-orders/services';

@Component({
	selector: 'spartan-portal-search-content',
	imports: [CommonModule, HlmCardImports, HlmButtonImports, HlmInputImports, HlmBadgeImports, HlmTableImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './portal-search-content.html',
	styleUrl: './portal-search-content.css',
})
export class PortalSearchContentComponent {
	private readonly _service = inject(WorkOrdersService);
	private readonly _router = inject(Router);

	protected readonly searchTerm = signal('');
	protected readonly hasSearched = signal(false);

	protected readonly results = computed(() => {
		if (!this.hasSearched()) return [];
		const term = this.searchTerm().trim().toLowerCase();
		if (!term) return [];
		return this._service.workOrders().filter(
			(order) =>
				order.cliente.toLowerCase().includes(term) ||
				order.clientData.telefono.toLowerCase().includes(term) ||
				order.clientData.correo.toLowerCase().includes(term),
		);
	});

	protected search(): void {
		this.hasSearched.set(true);
	}

	protected openOrder(id: string): void {
		void this._router.navigate(['/portal/ordenes', id]);
	}

	protected statusChipClass(status: WorkOrderStatus): string {
		const map: Record<WorkOrderStatus, string> = {
			Agendado: 'wo-chip-status-agendado',
			'En Espera': 'wo-chip-status-espera',
			'En Proceso': 'wo-chip-status-proceso',
			Terminado: 'wo-chip-status-terminado',
			'En Garantia': 'wo-chip-status-garantia',
			Rezagado: 'wo-chip-status-rezagado',
			Entregado: 'wo-chip-status-entregado',
		};
		return map[status] ?? '';
	}
}
