import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { NotificationService } from '../../../../core';
import { ClientsVehiclesService } from '../../../clients-vehicles/services';
import { DatePickerFieldComponent } from '../../../../shared';
import { CreateWorkOrderDialogComponent, type CreateWorkOrderDialogContext } from '../create-work-order-dialog';
import {
	WORK_ORDER_PRIORITIES,
	WORK_ORDER_STATUSES,
	workOrderPriorityVariant,
	workOrderStatusVariant,
	type CreateWorkOrderInput,
	type WorkOrder,
	type WorkOrderPriority,
	type WorkOrderStatus,
} from '../../models';
import { WorkOrdersService } from '../../services';

@Component({
	selector: 'spartan-work-orders-content',
	imports: [
		CommonModule,
		DragDropModule,
		HlmCardImports,
		HlmButtonImports,
		HlmTableImports,
		HlmBadgeImports,
		HlmInputImports,
		HlmSelectImports,
		DatePickerFieldComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './work-orders-content.html',
	styleUrl: './work-orders-content.css',
})
export class WorkOrdersContentComponent {
	private readonly _service = inject(WorkOrdersService);
	private readonly _clientsVehiclesService = inject(ClientsVehiclesService);
	private readonly _router = inject(Router);
	private readonly _dialog = inject(HlmDialogService);
	private readonly _notification = inject(NotificationService);

	protected readonly statuses = WORK_ORDER_STATUSES;
	protected readonly priorities = WORK_ORDER_PRIORITIES;
	protected readonly statusVariant = workOrderStatusVariant;
	protected readonly priorityVariant = workOrderPriorityVariant;

	protected readonly search = signal('');
	protected readonly quickStatusFilter = signal<'todas' | 'no-terminadas' | 'terminadas'>('no-terminadas');
	protected readonly filterStatus = signal<WorkOrderStatus | 'Todos'>('Todos');
	protected readonly filterTech = signal<string>('Todos');
	protected readonly filterClient = signal<string>('Todos');
	protected readonly filterDate = signal<string>('');
	protected readonly viewMode = signal<'tabla' | 'kanban'>('kanban');
	protected readonly page = signal(1);
	private readonly _pageSize = 6;

	protected readonly orders = this._service.workOrders;
	protected readonly technicians = this._service.technicians;
	protected readonly clients = this._service.allClients;

	protected readonly filteredOrders = computed(() => {
		const search = this.search().trim().toLowerCase();
		const quickStatus = this.quickStatusFilter();
		const status = this.filterStatus();
		const tech = this.filterTech();
		const client = this.filterClient();
		const date = this.filterDate();

		return this.orders().filter((order) => {
			const matchesSearch =
				!search ||
				order.id.toLowerCase().includes(search) ||
				order.code.toLowerCase().includes(search) ||
				order.cliente.toLowerCase().includes(search) ||
				order.tecnico.toLowerCase().includes(search) ||
				order.vehicle.marca.toLowerCase().includes(search) ||
				order.vehicle.modelo.toLowerCase().includes(search) ||
				order.vehicle.placas.toLowerCase().includes(search);
			const isFinished = order.status === 'Terminado' || order.status === 'Entregado';
			const matchesQuickStatus =
				quickStatus === 'todas' ||
				(quickStatus === 'terminadas' && isFinished) ||
				(quickStatus === 'no-terminadas' && !isFinished);
			const matchesStatus = status === 'Todos' || order.status === status;
			const matchesTech = tech === 'Todos' || order.tecnico === tech;
			const matchesClient = client === 'Todos' || order.cliente === client;
			const matchesDate = !date || order.fechaProgramada === date;
			return matchesSearch && matchesQuickStatus && matchesStatus && matchesTech && matchesClient && matchesDate;
		});
	});

	protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredOrders().length / this._pageSize)));
	protected readonly pagedOrders = computed(() => {
		const page = this.page();
		const start = (page - 1) * this._pageSize;
		return this.filteredOrders().slice(start, start + this._pageSize);
	});

	protected readonly kanbanColumns = computed(() =>
		this.statuses.map((status) => ({
			status,
			orders: this.filteredOrders().filter((order) => order.status === status),
		})),
	);
	protected readonly kanbanDropListIds = computed(() => this.statuses.map((status) => this.getKanbanDropListId(status)));

	protected updateSearch(value: string): void {
		this.search.set(value);
		this.page.set(1);
	}

	protected setQuickStatusFilter(value: 'todas' | 'no-terminadas' | 'terminadas'): void {
		this.quickStatusFilter.set(value);
		this.page.set(1);
	}

	protected updateStatusFilter(value: string): void {
		this.filterStatus.set((value as WorkOrderStatus | 'Todos') ?? 'Todos');
		this.page.set(1);
	}

	protected updateTechFilter(value: string): void {
		this.filterTech.set(value || 'Todos');
		this.page.set(1);
	}

	protected updateClientFilter(value: string): void {
		this.filterClient.set(value || 'Todos');
		this.page.set(1);
	}

	protected updateDateFilter(value: string): void {
		this.filterDate.set(value);
		this.page.set(1);
	}

	protected setView(mode: 'tabla' | 'kanban'): void {
		this.viewMode.set(mode);
	}

	protected goToDetail(id: string): void {
		void this._router.navigate(['/app/ordenes-trabajo', id]);
	}

	protected updateOrderStatus(orderId: string, value: string): void {
		this._service.updateStatus(orderId, value as WorkOrderStatus);
		this._notification.info('Estado de la OT actualizado.');
	}

	protected updateOrderPriority(orderId: string, value: string): void {
		this._service.updatePriority(orderId, value as WorkOrderPriority);
		this._notification.info('Prioridad de la OT actualizada.');
	}

	protected onKanbanDrop(event: CdkDragDrop<WorkOrder[]>, targetStatus: WorkOrderStatus): void {
		const movedOrder = event.item.data as WorkOrder | undefined;
		if (!movedOrder || movedOrder.status === targetStatus) {
			return;
		}
		this._service.updateStatus(movedOrder.id, targetStatus);
		this._notification.info(`OT ${movedOrder.code} movida a ${targetStatus}.`);
	}

	protected getKanbanDropListId(status: WorkOrderStatus): string {
		return `kanban-${status.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
	}

	protected statusChipClass(status: WorkOrderStatus): string {
		switch (status) {
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

	protected priorityChipClass(priority: WorkOrderPriority): string {
		switch (priority) {
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

	protected nextPage(): void {
		if (this.page() < this.totalPages()) {
			this.page.update((current) => current + 1);
		}
	}

	protected previousPage(): void {
		if (this.page() > 1) {
			this.page.update((current) => current - 1);
		}
	}

	protected createOrder(): void {
		const context: CreateWorkOrderDialogContext = {
			clients: this._service.clientsDirectory(),
			loadVehiclesForClient: (clientId, done) => {
				this._clientsVehiclesService.loadClientVehicles(clientId, done);
			},
			onCreateClient: (payload, done) => {
				this._clientsVehiclesService.createClient(payload, (client) => {
					const nextClient = {
						id: client.id,
						nombre: client.nombre,
						telefono: client.telefono === '-' ? '' : client.telefono,
						correo: client.correo === '-' ? '' : client.correo,
					};
					this._service.upsertClientDirectory(nextClient);
					done(nextClient);
				});
			},
			onCreate: (payload: CreateWorkOrderInput) => {
				this._service.createWorkOrder(
					payload,
					(order) => {
						this._notification.success(`OT ${order.code} creada correctamente.`);
						void this._router.navigate(['/app/ordenes-trabajo', order.id]);
					},
					() => {
						this._notification.error('No se pudo crear la orden de trabajo. Intenta de nuevo.');
					},
				);
			},
		};

		this._dialog.open(CreateWorkOrderDialogComponent, {
			context,
			contentClass: 'work-order-dialog-content',
		});
	}

	protected vehicleSummary(order: WorkOrder): string {
		const parts = [order.vehicle.marca, order.vehicle.modelo]
			.map((value) => value.trim())
			.filter(Boolean);
		const label = parts.join(' ');
		return label || 'Sin vehiculo';
	}

	protected vehicleMeta(order: WorkOrder): string {
		const year = order.vehicle.anio > 0 ? `${order.vehicle.anio}` : '';
		const plates = order.vehicle.placas.trim();
		return [year, plates].filter(Boolean).join(' · ');
	}

	protected vehicleHeading(order: WorkOrder): string {
		const summary = this.vehicleSummary(order);
		const year = order.vehicle.anio > 0 ? `${order.vehicle.anio}` : '';
		return [summary, year].filter(Boolean).join(' ');
	}
}
