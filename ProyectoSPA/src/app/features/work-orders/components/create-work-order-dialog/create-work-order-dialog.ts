import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { NotificationService } from '../../../../core';
import { DatePickerFieldComponent } from '../../../../shared';
import { CreateClientDialogComponent, CreateVehicleDialogComponent, type CreateClientDialogContext, type CreateVehicleDialogContext } from '../../../clients-vehicles/components';
import type { UpsertClientInput } from '../../../clients-vehicles/models';
import { WORK_ORDER_PRIORITIES, type CreateWorkOrderInput, type WorkOrderPriority } from '../../models/work-orders.models';

export interface WorkOrderClientOption {
	id: string;
	nombre: string;
	telefono: string;
	correo: string;
}

export interface WorkOrderVehicleOption {
	id: string;
	marca: string;
	modelo: string;
	anio: number;
	placas: string;
	vin: string;
	kilometraje?: number;
	tipo?: 'Auto' | 'Camioneta' | 'Camión';
}

export interface CreateWorkOrderDialogContext {
	clients: WorkOrderClientOption[];
	loadVehiclesForClient: (clientId: string, done: (vehicles: WorkOrderVehicleOption[]) => void) => void;
	onCreate: (payload: CreateWorkOrderInput) => void;
	onCreateClient: (payload: UpsertClientInput, done: (client: WorkOrderClientOption) => void) => void;
}

@Component({
	selector: 'spartan-create-work-order-dialog',
	imports: [CommonModule, HlmCardImports, HlmInputImports, HlmTextareaImports, HlmButtonImports, HlmSelectImports, HlmComboboxImports, DatePickerFieldComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './create-work-order-dialog.html',
	styleUrl: './create-work-order-dialog.css',
})
export class CreateWorkOrderDialogComponent {
	private readonly _dialogRef = inject(BrnDialogRef<unknown>);
	private readonly _context = injectBrnDialogContext<CreateWorkOrderDialogContext>();
	private readonly _dialog = inject(HlmDialogService);
	private readonly _http = inject(HttpClient);
	private readonly _notification = inject(NotificationService);

	protected readonly priorities = WORK_ORDER_PRIORITIES;
	protected readonly clients = signal<WorkOrderClientOption[]>([...this._context.clients]);
	protected readonly employees = signal<{ id: string; name: string }[]>([]);
	protected readonly selectedClientId = signal('');
	protected readonly clientVehicleMap = signal<Record<string, WorkOrderVehicleOption[]>>({});
	protected readonly selectedVehicleId = signal('');

	protected readonly telefono = signal('');
	protected readonly correo = signal('');
	protected readonly tecnicoId = signal('');
	protected readonly tecnico = signal('Sin asignar');
	protected readonly fechaProgramada = signal(this.todayDate());
	protected readonly priority = signal<WorkOrderPriority>('Media');

	protected readonly problema = signal('');
	protected readonly diagnostico = signal('');
	protected readonly tipoVehiculo = signal<'Auto' | 'Camioneta' | 'Camión'>('Auto');

	protected readonly selectedClient = computed(() =>
		this.clients().find((client) => client.id === this.selectedClientId()) ?? null,
	);
	protected readonly availableVehicles = computed(() => this.clientVehicleMap()[this.selectedClientId()] ?? []);
	protected readonly selectedVehicle = computed(() =>
		this.availableVehicles().find((vehicle) => vehicle.id === this.selectedVehicleId()) ?? null,
	);
	protected readonly canCreate = computed(() =>
		this.selectedClientId().trim().length > 0 &&
		this.selectedVehicle() !== null &&
		this.problema().trim().length > 0,
	);

	constructor() {
		this._http.get<{ data: { id: string; name: string }[] }>('/api/v1/employees').subscribe({
			next: (res) => this.employees.set(res.data),
		});
	}

	protected onClientChange(value: string | null): void {
		const clientId = (value ?? '').toString();
		this.selectedClientId.set(clientId);
		this.selectedVehicleId.set('');

		const client = this.clients().find((item) => item.id === clientId);
		this.telefono.set(client?.telefono ?? '');
		this.correo.set(client?.correo ?? '');

		if (!clientId) {
			return;
		}

		if (this.clientVehicleMap()[clientId]) {
			return;
		}

		this._context.loadVehiclesForClient(clientId, (vehicles) => {
			this.clientVehicleMap.update((map) => ({ ...map, [clientId]: vehicles }));
		});
	}

	protected onVehicleChange(value: string | null): void {
		const vehicleId = (value ?? '').toString();
		this.selectedVehicleId.set(vehicleId);
		const vehicle = this.availableVehicles().find((item) => item.id === vehicleId);
		if (vehicle?.tipo) {
			this.tipoVehiculo.set(vehicle.tipo);
		}
	}

	protected onTecnicoChange(value: string): void {
		const emp = this.employees().find((employee) => employee.id === value);
		if (emp) {
			this.tecnicoId.set(emp.id);
			this.tecnico.set(emp.name);
		}
	}

	protected onPriorityChange(value: string): void {
		if (value === 'Baja' || value === 'Media' || value === 'Alta') {
			this.priority.set(value);
		}
	}

	protected onVehicleTypeChange(value: string): void {
		if (value === 'Auto' || value === 'Camioneta' || value === 'Camión') {
			this.tipoVehiculo.set(value);
		}
	}

	protected openCreateClientDialog(): void {
		const context: CreateClientDialogContext = {
			onCreate: (payload) => {
				this._context.onCreateClient(payload, (client) => {
					this.clients.update((current) =>
						[...current, client].sort((a, b) => a.nombre.localeCompare(b.nombre)),
					);
					this.selectedClientId.set(client.id);
					this.telefono.set(client.telefono ?? '');
					this.correo.set(client.correo ?? '');
					this.clientVehicleMap.update((map) => ({ ...map, [client.id]: [] }));
				});
			},
		};

		this._dialog.open(CreateClientDialogComponent, {
			context,
			contentClass: 'client-dialog-content',
		});
	}

	protected openCreateVehicleDialog(): void {
		const client = this.selectedClient();
		if (!client) {
			this._notification.warning('Selecciona primero el cliente de la OT.');
			return;
		}

		const context: CreateVehicleDialogContext = {
			title: 'Agregar vehículo a la OT',
			description: `Este vehículo quedará asignado a ${client.nombre} y listo para reutilizarse después.`,
			onCreate: (payload) => {
				const vehicle: WorkOrderVehicleOption = {
					id: `temp-${Date.now()}`,
					marca: payload.marca,
					modelo: payload.modelo,
					anio: payload.anio,
					placas: payload.placas,
					vin: payload.vin,
					kilometraje: payload.kilometraje,
					tipo: payload.tipo,
				};
				this.clientVehicleMap.update((map) => ({
					...map,
					[client.id]: [vehicle, ...(map[client.id] ?? [])],
				}));
				this.selectedVehicleId.set(vehicle.id);
				this.tipoVehiculo.set(payload.tipo);
			},
		};

		this._dialog.open(CreateVehicleDialogComponent, {
			context,
			contentClass: 'client-dialog-content',
		});
	}

	protected submit(): void {
		const client = this.selectedClient();
		const vehicle = this.selectedVehicle();
		if (!this.canCreate() || !client || !vehicle) {
			return;
		}

		const payload: CreateWorkOrderInput = {
			cliente: client.nombre.trim(),
			telefono: this.telefono().trim(),
			correo: this.correo().trim(),
			tecnico: this.tecnico().trim(),
			fechaProgramada: this.fechaProgramada(),
			priority: this.priority(),
			vehicle: {
				marca: vehicle.marca.trim() || 'Pendiente',
				modelo: vehicle.modelo.trim() || 'Pendiente',
				anio: vehicle.anio,
				placas: vehicle.placas.trim() || 'PEND-000',
				vin: vehicle.vin.trim() || 'PENDIENTE',
				kilometraje: vehicle.kilometraje ?? 0,
			},
			tipoVehiculo: vehicle.tipo ?? this.tipoVehiculo(),
			problema: this.problema().trim(),
			diagnostico: this.diagnostico().trim() || 'Pendiente de diagnóstico técnico',
		};

		this._context.onCreate(payload);
		this._dialogRef.close();
	}

	protected cancel(): void {
		this._dialogRef.close();
	}

	private todayDate(): string {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
	}
}
