import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { switchMap } from 'rxjs';
import { type WorkOrderPriority, type WorkOrderStatus } from '../../../work-orders/models';

interface PortalOrder {
	id: string;
	code: string;
	status: WorkOrderStatus;
	priority: WorkOrderPriority;
	tipo_vehiculo: string;
	problema: string;
	diagnostico: string;
	fecha_ingreso: string;
	fecha_programada: string;
	cliente: { nombre: string; telefono: string } | null;
	vehiculo: { marca: string; modelo: string; anio: number; placas: string; kilometraje_actual: number } | null;
	tecnico: { nombre: string } | null;
	timeline: { id: number; descripcion: string; created_at: string }[];
	checklist: { total: number; completadas: number };
	notas: { id: number; texto: string; created_at: string }[];
	fotos: { id: number; url: string }[];
	servicios: { nombre: string; precio: number }[];
	refacciones: { nombre: string; cantidad: number; subtotal: number }[];
	total_estimado: number;
}

@Component({
	selector: 'spartan-portal-order-view',
	imports: [CommonModule, HlmCardImports, HlmBadgeImports, HlmButtonImports, HlmTableImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './portal-order-view.html',
	styleUrl: './portal-order-view.css',
})
export class PortalOrderViewComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _router = inject(Router);
	private readonly _http = inject(HttpClient);
	private readonly _params = toSignal(this._route.paramMap, { initialValue: this._route.snapshot.paramMap });

	protected readonly isLoading = signal(true);
	protected readonly order = signal<PortalOrder | null>(null);

	protected readonly checklistPct = computed(() => {
		const c = this.order()?.checklist;
		if (!c || c.total === 0) return 0;
		return (c.completadas / c.total) * 100;
	});

	constructor() {
		const token$ = this._route.paramMap.pipe(
			switchMap((params) => {
				const token = params.get('token') ?? '';
				return this._http.get<{ data: PortalOrder }>(`/api/v1/portal/${token}`);
			}),
		);

		toSignal(token$, { initialValue: null });

		this._route.paramMap.subscribe((params) => {
			const token = params.get('token') ?? '';
			this.isLoading.set(true);
			this._http.get<{ data: PortalOrder }>(`/api/v1/portal/${token}`).subscribe({
				next: (res) => {
					this.order.set(res.data);
					this.isLoading.set(false);
				},
				error: () => {
					this.order.set(null);
					this.isLoading.set(false);
				},
			});
		});
	}

	protected goBack(): void {
		void this._router.navigate(['/portal']);
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

	protected priorityChipClass(priority: WorkOrderPriority): string {
		const map: Record<WorkOrderPriority, string> = {
			Alta: 'wo-chip-priority-alta',
			Media: 'wo-chip-priority-media',
			Baja: 'wo-chip-priority-baja',
		};
		return map[priority] ?? '';
	}
}
