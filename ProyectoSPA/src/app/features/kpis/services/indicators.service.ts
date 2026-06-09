import { Injectable, computed, inject } from '@angular/core';
import { WorkOrdersService } from '../../work-orders/services';
import { KpisService } from './kpis.service';
import type { KPIIndicator, KPICategory, IndicatorsData } from '../models/indicators.models';

interface ClientMetadata {
	nombre: string;
	tag: 'Nuevo' | 'Frecuente' | '';
	primeraOrden: string;
}

@Injectable({ providedIn: 'root' })
export class IndicatorsService {
	private readonly _workOrdersService = inject(WorkOrdersService);
	private readonly _kpisService = inject(KpisService);

	public readonly currentDate = new Date().toISOString();
	public readonly periodStartDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
	public readonly periodEndDate = this.currentDate;

	private readonly _clientMetadata = computed(() => {
		const workOrders = this._workOrdersService.workOrders();
		const metadata = new Map<string, ClientMetadata>();

		const clientOrderCounts = new Map<string, number>();
		workOrders.forEach((wo) => {
			const cliente = wo.cliente.trim();
			if (!cliente || cliente === 'Sin asignar') return;
			clientOrderCounts.set(cliente, (clientOrderCounts.get(cliente) || 0) + 1);
		});

		clientOrderCounts.forEach((count, cliente) => {
			const tag: 'Nuevo' | 'Frecuente' | '' = count > 2 ? 'Frecuente' : 'Nuevo';
			const firstOrder = workOrders.find((w) => w.cliente === cliente);
			metadata.set(cliente, {
				nombre: cliente,
				tag,
				primeraOrden: firstOrder?.fechaIngreso || new Date().toISOString(),
			});
		});

		return metadata;
	});

	public readonly clientesActuales = computed(() => {
		const workOrders = this._workOrdersService.workOrders();
		const clientes = [...new Set(workOrders.map((wo) => wo.cliente))];
		return clientes.filter((c) => c && c !== 'Sin asignar').length;
	});

	public readonly clientesNuevos = computed(() => {
		const metadata = this._clientMetadata();
		let count = 0;
		metadata.forEach((client) => {
			if (client.tag === 'Nuevo') count++;
		});
		return count;
	});

	public readonly clientesRepetitivos = computed(() => {
		const metadata = this._clientMetadata();
		let count = 0;
		metadata.forEach((client) => {
			if (client.tag === 'Frecuente') count++;
		});
		return count;
	});

	public readonly clientesPromedioDiario = computed(() => {
		const workOrders = this._workOrdersService.workOrders();
		const start = new Date(this.periodStartDate);
		const end = new Date(this.periodEndDate);
		
		const filtered = workOrders.filter((wo) => {
			const woDate = new Date(wo.fechaIngreso);
			return woDate >= start && woDate <= end;
		});

		const uniqueClientes = [...new Set(filtered.map((wo) => wo.cliente))].length;
		const daysDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
		
		return Math.round((uniqueClientes / daysDifference) * 100) / 100;
	});

	public readonly tasaRetencionClientes = computed(() => {
		const repetitivos = this.clientesRepetitivos();
		const actuales = this.clientesActuales();
		
		if (actuales === 0) return 0;
		return Math.round((repetitivos / actuales) * 100);
	});

	public readonly tiempoCicloPromedio = computed(() => {
		const workOrders = this._workOrdersService.workOrders();
		const completedOrders = workOrders.filter(
			(wo) => wo.status === 'Entregado' || wo.status === 'En Garantia'
		);

		if (completedOrders.length === 0) return 0;

		const totalDays = completedOrders.reduce((sum, wo) => {
			const entrada = new Date(wo.fechaIngreso);
			const salida = new Date(wo.fechaProgramada); 
			const days = Math.ceil((salida.getTime() - entrada.getTime()) / (1000 * 60 * 60 * 24));
			return sum + (days > 0 ? days : 0);
		}, 0);

		return Math.round((totalDays / completedOrders.length) * 10) / 10;
	});

	public readonly tasaOcupacionPersonal = computed(() => {
		const workOrders = this._workOrdersService.workOrders();
		const activeOrders = workOrders.filter(
			(wo) => wo.status === 'En Proceso' || wo.status === 'En Espera' || wo.status === 'Agendado'
		);

		const techniciansWithOrders = [...new Set(activeOrders.map((wo) => wo.tecnico))];
		const totalTechnicians = this._kpisService.employees().filter(
			(emp) =>
				emp.role === 'Técnico Automotriz' ||
				emp.role === 'Líder Técnico' ||
				emp.role === 'Asesor de Servicio'
		).length;

		if (totalTechnicians === 0) return 0;
		return Math.round((techniciansWithOrders.length / totalTechnicians) * 100);
	});

	public readonly tasaRegresosPorGarantia = computed(() => {
		const workOrders = this._workOrdersService.workOrders();
		const totalEntregadas = workOrders.filter(
			(wo) => wo.status === 'Entregado' || wo.status === 'En Garantia'
		).length;

		if (totalEntregadas === 0) return 0;

		const regresos = workOrders.filter((wo) => wo.status === 'En Garantia').length;
		return Math.round((regresos / totalEntregadas) * 100);
	});

	public readonly indicadores = computed((): IndicatorsData => {
		const comercialIndicadores: KPIIndicator[] = [
			{
				id: 'kpi-clientes-actuales',
				nombre: 'Clientes Actuales',
				categoria: 'Commercial',
				valor: this.clientesActuales(),
				unidad: 'clientes',
				meta: 50,
				tendencia: this.getTrendencia(this.clientesActuales(), 45),
				descripcion: 'Total de clientes únicos con órdenes de trabajo',
				ultimaActualizacion: new Date().toLocaleDateString('es-ES'),
				icon: 'users',
			},
			{
				id: 'kpi-clientes-nuevos',
				nombre: 'Clientes Nuevos',
				categoria: 'Commercial',
				valor: this.clientesNuevos(),
				unidad: 'clientes',
				meta: 10,
				tendencia: this.getTrendencia(this.clientesNuevos(), 8),
				descripcion: 'Clientes adquiridos en el período',
				ultimaActualizacion: new Date().toLocaleDateString('es-ES'),
				icon: 'user-plus',
			},
			{
				id: 'kpi-clientes-repetitivos',
				nombre: 'Clientes Repetitivos',
				categoria: 'Commercial',
				valor: this.clientesRepetitivos(),
				unidad: 'clientes',
				meta: 30,
				tendencia: this.getTrendencia(this.clientesRepetitivos(), 25),
				descripcion: 'Clientes frecuentes que regresan regularmente',
				ultimaActualizacion: new Date().toLocaleDateString('es-ES'),
				icon: 'repeat-2',
			},
			{
				id: 'kpi-clientes-promedio-diario',
				nombre: 'Promedio Clientes/Día',
				categoria: 'Commercial',
				valor: this.clientesPromedioDiario(),
				unidad: 'clientes/día',
				meta: 2.5,
				tendencia: this.getTrendencia(this.clientesPromedioDiario(), 2.0),
				descripcion: 'Promedio de clientes únicos por día en el período',
				ultimaActualizacion: new Date().toLocaleDateString('es-ES'),
				icon: 'trending-up',
			},
			{
				id: 'kpi-tasa-retencion',
				nombre: 'Tasa Retención Clientes',
				categoria: 'Commercial',
				valor: this.tasaRetencionClientes(),
				unidad: '%',
				meta: 60,
				tendencia: this.getTrendencia(this.tasaRetencionClientes(), 55),
				descripcion: 'Porcentaje de clientes repetitivos del total',
				ultimaActualizacion: new Date().toLocaleDateString('es-ES'),
				icon: 'target',
			},
		];

		const operativaIndicadores: KPIIndicator[] = [
			{
				id: 'kpi-tiempo-ciclo',
				nombre: 'Tiempo Ciclo Promedio',
				categoria: 'Operative',
				valor: this.tiempoCicloPromedio(),
				unidad: 'días',
				meta: 5,
				tendencia: this.getTrendencia(this.tiempoCicloPromedio(), 6, true),
				descripcion: 'Días promedio desde ingreso hasta entrega de vehículo',
				ultimaActualizacion: new Date().toLocaleDateString('es-ES'),
				icon: 'clock',
			},
			{
				id: 'kpi-tasa-ocupacion',
				nombre: 'Tasa Ocupación Personal',
				categoria: 'Operative',
				valor: this.tasaOcupacionPersonal(),
				unidad: '%',
				meta: 85,
				tendencia: this.getTrendencia(this.tasaOcupacionPersonal(), 80),
				descripcion: 'Porcentaje de técnicos con órdenes de trabajo activas',
				ultimaActualizacion: new Date().toLocaleDateString('es-ES'),
				icon: 'users-check',
			},
		];

		const calidadIndicadores: KPIIndicator[] = [
			{
				id: 'kpi-tasa-garantia',
				nombre: 'Tasa Regresos por Garantía',
				categoria: 'Quality',
				valor: this.tasaRegresosPorGarantia(),
				unidad: '%',
				meta: 5,
				tendencia: this.getTrendencia(this.tasaRegresosPorGarantia(), 8, true),
				descripcion: 'Porcentaje de trabajos que requieren regresos por garantía',
				ultimaActualizacion: new Date().toLocaleDateString('es-ES'),
				icon: 'alert-circle',
			},
		];

		return {
			fecha: new Date().toISOString(),
			periodoInicio: this.periodStartDate,
			periodoFin: this.periodEndDate,
			categorias: [
				{
					nombre: 'Commercial',
					label: 'Comercial',
					indicadores: comercialIndicadores,
					color: 'var(--success)',
				},
				{
					nombre: 'Operative',
					label: 'Operativa',
					indicadores: operativaIndicadores,
					color: 'var(--info)',
				},
				{
					nombre: 'Quality',
					label: 'Calidad',
					indicadores: calidadIndicadores,
					color: 'var(--warning)',
				},
			],
		};
	});

	constructor() {
	}

	private getTrendencia(current: number, previous: number, isInverse = false): 'up' | 'down' | 'stable' {
		const diff = current - previous;
		if (Math.abs(diff) < 0.1) return 'stable';

		if (isInverse) {
			return diff > 0 ? 'down' : 'up';
		}

		return diff > 0 ? 'up' : 'down';
	}

	public markClientAsNuevo(clientName: string): void {
		// Noop - client tags are derived from data
	}

	public markClientAsFrecuente(clientName: string): void {
		// Noop - client tags are derived from data
	}

	private loadClientMetadataFromStorage(): Map<string, ClientMetadata> {
		return new Map();
	}

	private saveClientMetadataToStorage(metadata: Map<string, ClientMetadata>): void {
		// Noop - metadata is derived
	}
}