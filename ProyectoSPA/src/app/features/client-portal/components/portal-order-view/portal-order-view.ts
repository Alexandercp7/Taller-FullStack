import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideCalendarDays, lucideClipboardList, lucideClock3, lucideMoon, lucideSun, lucideWrench } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { ThemeService } from '../../../../core';

const PORTAL_STATUS_LABELS: Record<string, string> = {
	SCHEDULED: 'Agendado',
	ON_HOLD: 'En Espera',
	IN_PROGRESS: 'En Proceso',
	COMPLETED: 'Terminado',
	WARRANTY: 'En Garantia',
	DELAYED: 'Rezagado',
	DELIVERED: 'Entregado',
	ARCHIVED: 'Archivado',
	CANCELLED: 'Cancelado',
};

interface PortalOrder {
	id: string;
	code: string;
	tipo_vehiculo: string;
	problema: string;
	diagnostico: string;
	fecha_ingreso: string;
	fecha_programada: string;
	cliente: { nombre: string; telefono: string } | null;
	vehiculo: { marca: string; modelo: string; anio: number; placas: string; kilometraje_actual: number } | null;
	tecnico: { nombre: string } | null;
	timeline: { id: number; descripcion: string; created_at: string; evento?: string; detalle?: { newStatus?: string; visibility?: string } | null }[];
	checklist: { total: number; completadas: number };
	notas: { id: number; texto: string; created_at: string }[];
	fotos: { id: number; url: string }[];
	servicios: { nombre: string; precio: number }[];
	refacciones: { nombre: string; cantidad: number; subtotal: number }[];
	total_estimado: number;
}

@Component({
	selector: 'spartan-portal-order-view',
	imports: [CommonModule, HlmCardImports, HlmButtonImports, HlmTableImports, NgIcon],
	providers: [provideIcons({ lucideArrowLeft, lucideCalendarDays, lucideClipboardList, lucideClock3, lucideMoon, lucideSun, lucideWrench })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './portal-order-view.html',
	styleUrl: './portal-order-view.css',
})
export class PortalOrderViewComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _router = inject(Router);
	private readonly _http = inject(HttpClient);
	private readonly _themeService = inject(ThemeService);

	protected readonly isLoading = signal(true);
	protected readonly order = signal<PortalOrder | null>(null);
	protected readonly isDark = this._themeService.isDark;

	protected readonly checklistPct = computed(() => {
		const c = this.order()?.checklist;
		if (!c || c.total === 0) return 0;
		return (c.completadas / c.total) * 100;
	});

	protected readonly portalTimeline = computed(() =>
		(this.order()?.timeline ?? [])
			.filter((event) => this.isVisiblePortalEvent(event))
			.map((event) => ({
				...event,
				descripcion: this.mapTimelineDescription(event),
			})),
	);

	constructor() {
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

	protected toggleTheme(): void {
		this._themeService.toggleTheme();
	}

	private isVisiblePortalEvent(event: PortalOrder['timeline'][number]): boolean {
		const eventName = (event.evento ?? event.descripcion ?? '').toLowerCase();
		if (eventName === 'status_changed') return true;
		if (eventName === 'note_added') {
			return !event.detalle?.visibility || event.detalle.visibility === 'CLIENT';
		}
		return false;
	}

	private mapTimelineDescription(event: PortalOrder['timeline'][number]): string {
		const eventName = (event.evento ?? event.descripcion ?? '').toLowerCase();
		if (eventName === 'status_changed') {
			const nextStatus = event.detalle?.newStatus;
			const translatedStatus = nextStatus ? (PORTAL_STATUS_LABELS[nextStatus] ?? nextStatus) : null;
			return translatedStatus ? `Estatus actualizado a ${translatedStatus}` : 'Estatus actualizado';
		}
		if (eventName === 'note_added') {
			return 'Se agrego una nota para el cliente';
		}
		return event.descripcion;
	}
}
