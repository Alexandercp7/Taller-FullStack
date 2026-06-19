import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { firstValueFrom } from 'rxjs';
import { CarQueryApiService, NotificationService } from '../../../../core';
import type { UpsertVehicleInput } from '../../models';

export interface CreateVehicleDialogContext {
	title?: string;
	description?: string;
	onCreate: (payload: UpsertVehicleInput) => void;
}

@Component({
	selector: 'spartan-create-vehicle-dialog',
	imports: [CommonModule, HlmInputImports, HlmButtonImports, HlmComboboxImports, HlmSelectImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './create-vehicle-dialog.html',
	styleUrl: './create-vehicle-dialog.css',
})
export class CreateVehicleDialogComponent {
	private readonly _dialogRef = inject(BrnDialogRef<unknown>);
	private readonly _context = injectBrnDialogContext<CreateVehicleDialogContext>();
	private readonly _carQueryApi = inject(CarQueryApiService);
	private readonly _notification = inject(NotificationService);
	private _makeSearchTimer: ReturnType<typeof setTimeout> | null = null;
	private _modelSearchTimer: ReturnType<typeof setTimeout> | null = null;

	protected readonly title = computed(() => this._context.title ?? 'Agregar vehículo');
	protected readonly description = computed(() => this._context.description ?? 'Completa los datos del vehículo.');

	protected readonly marca = signal('');
	protected readonly modelo = signal('');
	protected readonly anio = signal(new Date().getFullYear());
	protected readonly placas = signal('');
	protected readonly vin = signal('');
	protected readonly kilometraje = signal(0);
	protected readonly tipo = signal<'Auto' | 'Camioneta' | 'Camión'>('Auto');

	protected readonly makeQuery = signal('');
	protected readonly modelQuery = signal('');
	protected readonly yearQuery = signal('');
	protected readonly vehicleMakes = signal<string[]>([]);
	protected readonly vehicleModels = signal<string[]>([]);
	protected readonly vehicleYears = signal<number[]>([]);
	protected readonly isVehicleLookupLoading = signal(false);
	protected readonly isVinLookupLoading = signal(false);
	protected readonly filteredVehicleYears = computed(() => {
		const query = this.yearQuery().trim();
		if (!query) {
			return this.vehicleYears();
		}
		return this.vehicleYears().filter((year) => year.toString().includes(query));
	});
	protected readonly canCreate = computed(() =>
		this.marca().trim().length > 0 &&
		this.modelo().trim().length > 0 &&
		this.placas().trim().length > 0,
	);

	constructor() {
		void this.loadMakes('');
	}

	protected onVehicleTypeChange(value: string): void {
		if (value === 'Auto' || value === 'Camioneta' || value === 'Camión') {
			this.tipo.set(value);
		}
	}

	protected onMakeSearch(query: string): void {
		this.makeQuery.set(query);
		if (this._makeSearchTimer) {
			clearTimeout(this._makeSearchTimer);
		}
		this._makeSearchTimer = setTimeout(() => {
			void this.loadMakes(this.makeQuery());
		}, 250);
	}

	protected onMakeInputChange(value: string): void {
		const query = value.trim();
		this.makeQuery.set(value);
		this.marca.set(query);
		this.onMakeSearch(value);

		const exact = this.vehicleMakes().find((make) => make.toLowerCase() === query.toLowerCase());
		if (exact) {
			this.onVehicleMakeSelected(exact);
			return;
		}

		if (!query) {
			this.modelo.set('');
			this.modelQuery.set('');
			this.vehicleModels.set([]);
			this.vehicleYears.set([]);
		}
	}

	protected onVehicleMakeSelected(value: string): void {
		const nextMake = value.trim();
		this.marca.set(nextMake);
		this.makeQuery.set(nextMake);
		this.modelo.set('');
		this.modelQuery.set('');
		this.vehicleModels.set([]);
		this.vehicleYears.set([]);
		if (!nextMake) {
			return;
		}
		void this.loadModels(nextMake, '');
	}

	protected onModelSearch(query: string): void {
		this.modelQuery.set(query);
		if (!this.marca().trim()) {
			this.vehicleModels.set([]);
			return;
		}
		if (this._modelSearchTimer) {
			clearTimeout(this._modelSearchTimer);
		}
		this._modelSearchTimer = setTimeout(() => {
			void this.loadModels(this.marca(), this.modelQuery());
		}, 250);
	}

	protected onModelInputChange(value: string): void {
		const query = value.trim();
		this.modelQuery.set(value);
		this.modelo.set(query);
		this.onModelSearch(value);

		const exact = this.vehicleModels().find((model) => model.toLowerCase() === query.toLowerCase());
		if (exact) {
			this.onVehicleModelSelected(exact);
			return;
		}

		if (!query) {
			this.vehicleYears.set([]);
		}
	}

	protected onVehicleModelSelected(value: string): void {
		const nextModel = value.trim();
		this.modelo.set(nextModel);
		this.modelQuery.set(nextModel);
		this.vehicleYears.set([]);
		this.yearQuery.set('');
		if (!this.marca().trim() || !nextModel) {
			return;
		}
		void this.loadYears(this.marca(), nextModel);
	}

	protected onYearInputChange(value: string): void {
		const normalized = value.replace(/\D/g, '').slice(0, 4);
		this.yearQuery.set(normalized);
		if (!normalized) {
			return;
		}

		const parsed = Number(normalized);
		if (Number.isFinite(parsed) && parsed > 0) {
			this.anio.set(parsed);
		}
	}

	protected onVehicleYearSelected(value: string): void {
		const parsed = Number(value);
		if (!Number.isFinite(parsed) || parsed <= 0) {
			return;
		}
		this.anio.set(parsed);
		this.yearQuery.set(parsed.toString());
	}

	protected onVinInput(value: string): void {
		this.vin.set(value.toUpperCase());
	}

	protected async lookupVehicleByVin(): Promise<void> {
		const currentVin = this.vin().trim().toUpperCase();
		if (currentVin.length < 6) {
			this._notification.warning('Ingresa un VIN válido para buscar el vehículo.');
			return;
		}

		this.isVinLookupLoading.set(true);
		try {
			const decoded = await firstValueFrom(this._carQueryApi.decodeVin(currentVin));
			if (!decoded) {
				this._notification.warning('No se encontraron datos para ese VIN.');
				return;
			}

			this.marca.set(decoded.make);
			this.modelo.set(decoded.model);
			this.anio.set(decoded.year);
			this.makeQuery.set(decoded.make);
			this.modelQuery.set(decoded.model);
			this.yearQuery.set(decoded.year.toString());

			await this.loadModels(decoded.make, decoded.model);
			await this.loadYears(decoded.make, decoded.model);
			this._notification.success('Vehículo completado con datos de VIN.');
		} catch {
			this._notification.error('No fue posible consultar CarQuery por VIN.');
		} finally {
			this.isVinLookupLoading.set(false);
		}
	}

	protected submit(): void {
		if (!this.canCreate()) {
			return;
		}

		this._context.onCreate({
			marca: this.marca().trim(),
			modelo: this.modelo().trim(),
			anio: this.anio(),
			placas: this.placas().trim().toUpperCase(),
			vin: this.vin().trim().toUpperCase(),
			kilometraje: this.kilometraje(),
			tipo: this.tipo(),
		});
		this._dialogRef.close();
	}

	protected cancel(): void {
		this._dialogRef.close();
	}

	private async loadMakes(query: string): Promise<void> {
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

	private async loadModels(make: string, query: string): Promise<void> {
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

	private async loadYears(make: string, model: string): Promise<void> {
		if (!make.trim() || !model.trim()) {
			this.vehicleYears.set([]);
			return;
		}

		this.isVehicleLookupLoading.set(true);
		try {
			const years = await firstValueFrom(this._carQueryApi.searchYears(make, model));
			this.vehicleYears.set(years);
			if (years.length > 0 && !years.includes(this.anio())) {
				this.anio.set(years[0]);
				this.yearQuery.set(years[0].toString());
			}
		} catch {
			this.vehicleYears.set([]);
			this._notification.warning('No se pudieron cargar años desde CarQuery.');
		} finally {
			this.isVehicleLookupLoading.set(false);
		}
	}
}
