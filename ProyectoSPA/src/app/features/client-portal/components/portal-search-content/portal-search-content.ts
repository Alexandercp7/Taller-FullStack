import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { type WorkOrderStatus } from '../../../work-orders/models';

interface PortalSearchResult {
	portalToken: string;
	code: string;
	status: WorkOrderStatus;
	fecha_programada: string;
	vehiculo: { marca: string; modelo: string; anio: number } | null;
}

@Component({
	selector: 'spartan-portal-search-content',
	imports: [CommonModule, HlmCardImports, HlmButtonImports, HlmInputImports, HlmBadgeImports, HlmTableImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './portal-search-content.html',
	styleUrl: './portal-search-content.css',
})
export class PortalSearchContentComponent {
	private readonly _http = inject(HttpClient);
	private readonly _router = inject(Router);

	protected readonly searchTerm = signal('');
	protected readonly hasSearched = signal(false);
	protected readonly results = signal<PortalSearchResult[]>([]);

	protected search(): void {
		const term = this.searchTerm().trim();
		if (!term) {
			this.results.set([]);
			this.hasSearched.set(true);
			return;
		}
		this._http.get<{ data: PortalSearchResult[] }>('/api/v1/portal/search', { params: { q: term } }).subscribe({
			next: (res) => {
				this.results.set(res.data);
				this.hasSearched.set(true);
			},
			error: () => {
				this.results.set([]);
				this.hasSearched.set(true);
			},
		});
	}

	protected openOrder(token: string): void {
		void this._router.navigate(['/portal', token]);
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
