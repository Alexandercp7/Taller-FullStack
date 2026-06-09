import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { firstValueFrom } from 'rxjs';
import { CarQueryApiService, NotificationService } from '../../../../../../core';
import { DatePickerFieldComponent } from '../../../../../../shared';
import { WORK_ORDER_PRIORITIES, WORK_ORDER_STATUSES, type WorkOrderPriority, type WorkOrderStatus } from '../../../../models';
import { WorkOrdersService } from '../../../../services';
import type { VehicleRecallItem } from '../../../../../../core';

@Component({
	selector: 'spartan-wo-details-section',
	imports: [
		CommonModule,
		HlmCardImports,
		HlmButtonImports,
		HlmInputImports,
		HlmTextareaImports,
		HlmSelectImports,
		HlmComboboxImports,
		DatePickerFieldComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './details-section.html',
	styleUrl: './details-section.css',
})
export class WorkOrderDetailsSectionComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _router = inject(Router);
	private readonly _service = inject(WorkOrdersService);
	private readonly _notification = inject(NotificationService);
	private readonly _carQueryApi = inject(CarQueryApiService);
	private readonly _params = toSignal(this._route.paramMap, { initialValue: this._route.snapshot.paramMap });
	private _makeSearchTimer: ReturnType<typeof setTimeout> | null = null;
	private _modelSearchTimer: ReturnType<typeof setTimeout> | null = null;

	protected readonly statuses = WORK_ORDER_STATUSES;
	protected readonly priorities = WORK_ORDER_PRIORITIES;
	protected readonly clients = this._service.allClients;

	protected readonly editClient = signal(false);
	protected readonly editVehicle = signal(false);
	protected readonly editIssue = signal(false);

	protected readonly selectedClient = signal('');
	protected readonly newClientName = signal('');
	protected readonly deleteConfirmInput = signal('');

	protected readonly clientPhone = signal('');
	protected readonly clientEmail = signal('');

	protected readonly vehicleMarca = signal('');
	protected readonly vehicleModelo = signal('');
	protected readonly vehicleAnio = signal(2026);
	protected readonly vehiclePlacas = signal('');
	protected readonly vehicleVin = signal('');
	protected readonly vehicleKm = signal(0);
	protected readonly vehicleMakeQuery = signal('');
	protected readonly vehicleModelQuery = signal('');
	protected readonly vehicleYearQuery = signal('');
	protected readonly vehicleMakes = signal<string[]>([]);
	protected readonly vehicleModels = signal<string[]>([]);
	protected readonly vehicleYears = signal<number[]>([]);
	protected readonly isVehicleLookupLoading = signal(false);
	protected readonly isVehicleVinLookupLoading = signal(false);

	protected readonly problemaEdit = signal('');
	protected readonly diagnosticoEdit = signal('');
	protected readonly recalls = signal<VehicleRecallItem[]>([]);
	protected readonly recallsLoading = signal(false);
	protected readonly recallsError = signal('');
	protected readonly tecnicoEdit = signal('');
	protected readonly fechaProgramadaEdit = signal('');

	protected readonly orderId = computed(() => this._params().get('id') ?? '');
	protected readonly order = computed(() => this._service.getById(this.orderId()));
	protected readonly canDeleteOrder = computed(() => {
		const ot = this.order();
		return !!ot && this.deleteConfirmInput().trim() === ot.id;
	});
	protected readonly filteredVehicleYears = computed(() => {
		const query = this.vehicleYearQuery().trim();
		if (!query) {
			return this.vehicleYears();
		}
		return this.vehicleYears().filter((year) => year.toString().includes(query));
	});
	protected readonly canSearchRecalls = computed(() => this.vehicleMarca().trim().length > 0 && this.vehicleModelo().trim().length > 0 && this.vehicleAnio() > 0);

	constructor() {
		void this.loadVehicleMakes('');
		effect(() => {
			const ot = this.order();
			if (!ot) {
				return;
			}
			this.selectedClient.set(ot.clientData.nombre);
			this.clientPhone.set(ot.clientData.telefono);
			this.clientEmail.set(ot.clientData.correo);
			this.vehicleMarca.set(ot.vehicle.marca);
			this.vehicleModelo.set(ot.vehicle.modelo);
			this.vehicleAnio.set(ot.vehicle.anio);
			this.vehicleMakeQuery.set(ot.vehicle.marca);
			this.vehicleModelQuery.set(ot.vehicle.modelo);
			this.vehicleYearQuery.set(ot.vehicle.anio.toString());
			this.vehiclePlacas.set(ot.vehicle.placas);
			this.vehicleVin.set(ot.vehicle.vin);
			this.vehicleKm.set(ot.vehicle.kilometraje);
			this.problemaEdit.set(ot.problema);
			this.diagnosticoEdit.set(ot.diagnostico);
			this.tecnicoEdit.set(ot.tecnico);
			this.fechaProgramadaEdit.set(ot.fechaProgramada);
		});
	}

	protected onVehicleMakeInputChange(value: string): void {
		const query = value.trim();
		this.vehicleMakeQuery.set(value);
		this.vehicleMarca.set(query);
		this.onVehicleMakeSearch(value);

		const exact = this.vehicleMakes().find((make) => make.toLowerCase() === query.toLowerCase());
		if (exact) {
			this.onVehicleMakeSelected(exact);
			return;
		}

		if (!query) {
			this.vehicleModelo.set('');
			this.vehicleModelQuery.set('');
			this.vehicleModels.set([]);
			this.vehicleYears.set([]);
		}
	}

	protected onVehicleModelInputChange(value: string): void {
		const query = value.trim();
		this.vehicleModelQuery.set(value);
		this.vehicleModelo.set(query);
		this.onVehicleModelSearch(value);

		const exact = this.vehicleModels().find((model) => model.toLowerCase() === query.toLowerCase());
		if (exact) {
			this.onVehicleModelSelected(exact);
			return;
		}

		if (!query) {
			this.vehicleYears.set([]);
		}
	}

	protected onVehicleYearInputChange(value: string): void {
		const normalized = value.replace(/\D/g, '').slice(0, 4);
		this.vehicleYearQuery.set(normalized);
		if (!normalized) {
			return;
		}

		const parsed = Number(normalized);
		if (Number.isFinite(parsed) && parsed > 0) {
			this.vehicleAnio.set(parsed);
		}
	}

	protected updateStatus(value: string): void {
		const order = this.order();
		if (!order) return;
		this._service.updateStatus(order.id, value as WorkOrderStatus);
		this._notification.info('Estado actualizado.');
	}

	protected updatePriority(value: string): void {
		const order = this.order();
		if (!order) return;
		this._service.updatePriority(order.id, value as WorkOrderPriority);
		this._notification.info('Prioridad actualizada.');
	}

	protected updateScheduledDate(value: string): void {
		const order = this.order();
		if (!order) return;
		const nextDate = value.trim();
		if (!nextDate || nextDate === order.fechaProgramada) {
			return;
		}
		this.fechaProgramadaEdit.set(nextDate);
		this._service.updateScheduledDate(order.id, nextDate);
		this._notification.info('Fecha programada actualizada.');
	}

	protected createClient(): void {
		const name = this.newClientName().trim();
		if (!name) return;
		this._service.addClient(name);
		this.selectedClient.set(name);
		this.newClientName.set('');
		this._notification.success('Cliente creado.');
	}

	protected saveClientCard(): void {
		const order = this.order();
		if (!order) return;
		this._service.updateClientData(order.id, {
			nombre: this.selectedClient().trim(),
			telefono: this.clientPhone().trim(),
			correo: this.clientEmail().trim(),
		});
		this.editClient.set(false);
		this._notification.success('Datos de cliente guardados.');
	}

	protected saveVehicleCard(): void {
		const order = this.order();
		if (!order) return;
		this._service.updateVehicleData(order.id, {
			marca: this.vehicleMarca().trim(),
			modelo: this.vehicleModelo().trim(),
			anio: this.vehicleAnio(),
			placas: this.vehiclePlacas().trim(),
			vin: this.vehicleVin().trim(),
			kilometraje: this.vehicleKm(),
		});
		this.editVehicle.set(false);
		this._notification.success('Datos de vehiculo guardados.');
	}

	protected onVehicleMakeSearch(query: string): void {
		this.vehicleMakeQuery.set(query);
		if (this._makeSearchTimer) {
			clearTimeout(this._makeSearchTimer);
		}
		this._makeSearchTimer = setTimeout(() => {
			void this.loadVehicleMakes(this.vehicleMakeQuery());
		}, 250);
	}

	protected onVehicleModelSearch(query: string): void {
		this.vehicleModelQuery.set(query);
		if (!this.vehicleMarca().trim()) {
			this.vehicleModels.set([]);
			return;
		}
		if (this._modelSearchTimer) {
			clearTimeout(this._modelSearchTimer);
		}
		this._modelSearchTimer = setTimeout(() => {
			void this.loadVehicleModels(this.vehicleMarca(), this.vehicleModelQuery());
		}, 250);
	}

	protected onVehicleYearSearch(query: string): void {
		this.vehicleYearQuery.set(query);
	}

	protected onVehicleMakeSelected(value: string): void {
		const nextMake = value.trim();
		this.vehicleMarca.set(nextMake);
		this.vehicleMakeQuery.set(nextMake);
		this.vehicleModelo.set('');
		this.vehicleModelQuery.set('');
		this.vehicleYears.set([]);
		if (!nextMake) {
			this.vehicleModels.set([]);
			return;
		}
		void this.loadVehicleModels(nextMake, '');
	}

	protected onVehicleModelSelected(value: string): void {
		const nextModel = value.trim();
		this.vehicleModelo.set(nextModel);
		this.vehicleModelQuery.set(nextModel);
		this.vehicleYears.set([]);
		this.vehicleYearQuery.set('');
		if (!this.vehicleMarca().trim() || !nextModel) {
			return;
		}
		void this.loadVehicleYears(this.vehicleMarca(), nextModel);
	}

	protected onVehicleYearSelected(value: string): void {
		const parsed = Number(value);
		if (!Number.isFinite(parsed) || parsed <= 0) {
			return;
		}
		this.vehicleAnio.set(parsed);
		this.vehicleYearQuery.set(parsed.toString());
	}

	protected onVehicleVinInput(value: string): void {
		this.vehicleVin.set(value.toUpperCase());
	}

	protected async searchRecalls(): Promise<void> {
		if (!this.canSearchRecalls()) {
			this._notification.warning('Completa marca, modelo y anio para consultar retiros de seguridad.');
			return;
		}

		this.recallsLoading.set(true);
		this.recallsError.set('');
		try {
			const results = await firstValueFrom(this._carQueryApi.searchRecalls(this.vehicleMarca(), this.vehicleModelo(), this.vehicleAnio()));
			this.recalls.set(results);
			if (results.length === 0) {
				this.recallsError.set('No se encontraron retiros de seguridad para este vehiculo.');
			}
		} catch {
			this.recalls.set([]);
			this.recallsError.set('No fue posible consultar retiros de seguridad en este momento.');
		} finally {
			this.recallsLoading.set(false);
		}
	}

	protected async lookupVehicleByVin(): Promise<void> {
		const vin = this.vehicleVin().trim().toUpperCase();
		if (vin.length < 6) {
			this._notification.warning('Ingresa un VIN valido para buscar el vehiculo.');
			return;
		}

		this.isVehicleVinLookupLoading.set(true);
		try {
			const decoded = await firstValueFrom(this._carQueryApi.decodeVin(vin));
			if (!decoded) {
				this._notification.warning('No se encontraron datos para ese VIN.');
				return;
			}

			this.vehicleMarca.set(decoded.make);
			this.vehicleModelo.set(decoded.model);
			this.vehicleAnio.set(decoded.year);
			this.vehicleMakeQuery.set(decoded.make);
			this.vehicleModelQuery.set(decoded.model);
			this.vehicleYearQuery.set(decoded.year.toString());

			await this.loadVehicleModels(decoded.make, decoded.model);
			await this.loadVehicleYears(decoded.make, decoded.model);
			this._notification.success('Vehiculo completado con datos de VIN.');
		} catch {
			this._notification.error('No fue posible consultar CarQuery por VIN.');
		} finally {
			this.isVehicleVinLookupLoading.set(false);
		}
	}

	protected saveIssueCard(): void {
		const order = this.order();
		if (!order) return;
		this._service.updateProblemDiagnosis(order.id, this.problemaEdit(), this.diagnosticoEdit());
		this._service.updateAssignedTechnician(order.id, this.tecnicoEdit());
		this.editIssue.set(false);
		this._notification.success('Detalles tecnicos guardados.');
	}

	protected confirmDeleteOrder(): void {
		const order = this.order();
		if (!order) return;
		if (!this.canDeleteOrder()) {
			this._notification.error('Debes escribir el nombre de la OT para confirmar.');
			return;
		}

		const deleted = this._service.deleteWorkOrder(order.id);
		if (deleted) {
			this._notification.success(`OT ${order.id} eliminada.`);
			void this._router.navigate(['/app/ordenes-trabajo']);
			return;
		}
		this._notification.error('No se pudo eliminar la OT.');
	}

	private async loadVehicleMakes(query: string): Promise<void> {
		this.isVehicleLookupLoading.set(true);
		try {
			const makes = await firstValueFrom(this._carQueryApi.searchMakes(query));
			this.vehicleMakes.set(makes);
		} catch {
			this.vehicleMakes.set([]);
			this._notification.warning('No se pudieron cargar marcas desde CarQuery.');
		} finally {
			this.isVehicleLookupLoading.set(false);
		}
	}

	private async loadVehicleModels(make: string, query: string): Promise<void> {
		if (!make.trim()) {
			this.vehicleModels.set([]);
			return;
		}

		this.isVehicleLookupLoading.set(true);
		try {
			const models = await firstValueFrom(this._carQueryApi.searchModels(make, query));
			this.vehicleModels.set(models);
		} catch {
			this.vehicleModels.set([]);
			this._notification.warning('No se pudieron cargar modelos desde CarQuery.');
		} finally {
			this.isVehicleLookupLoading.set(false);
		}
	}

	private async loadVehicleYears(make: string, model: string): Promise<void> {
		if (!make.trim() || !model.trim()) {
			this.vehicleYears.set([]);
			return;
		}

		this.isVehicleLookupLoading.set(true);
		try {
			const years = await firstValueFrom(this._carQueryApi.searchYears(make, model));
			this.vehicleYears.set(years);
			if (years.length > 0 && !years.includes(this.vehicleAnio())) {
				this.vehicleAnio.set(years[0]);
				this.vehicleYearQuery.set(years[0].toString());
			}
		} catch {
			this.vehicleYears.set([]);
			this._notification.warning('No se pudieron cargar anios desde CarQuery.');
		} finally {
			this.isVehicleLookupLoading.set(false);
		}
	}
}
