import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { NotificationService } from '../../../../../../core';
import { type PartCatalogItem, type ServiceCatalogItem } from '../../../../models';
import { WorkOrdersService } from '../../../../services';
import { InventoryService } from '../../../../../inventory/services';
import { PricesService } from '../../../../../prices/services/prices.service';
import type { InventoryItem } from '../../../../../inventory/models';
import type { Servicio } from '../../../../../prices/models/price.model';

@Component({
	selector: 'spartan-wo-quotations-section',
	imports: [CommonModule, HlmCardImports, HlmComboboxImports, HlmButtonImports, HlmTableImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './quotations-section.html',
	styleUrl: './quotations-section.css',
})
export class WorkOrderQuotationsSectionComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _service = inject(WorkOrdersService);
	private readonly _notification = inject(NotificationService);
	private readonly _inventoryService = inject(InventoryService);
	private readonly _pricesService = inject(PricesService);
	private readonly _params = toSignal(this._route.paramMap, { initialValue: this._route.snapshot.paramMap });

	protected readonly orderId = computed(() => this._params().get('id') ?? '');
	protected readonly order = computed(() => this._service.getById(this.orderId()));
	protected readonly selectedPart = signal<InventoryItem | null>(null);
	protected readonly selectedService = signal<Servicio | null>(null);
	protected readonly partSearch = signal('');
	protected readonly serviceSearch = signal('');

	protected readonly inventoryByType = computed(() => {
		const search = this.partSearch().toLowerCase();
		const allItems = this._inventoryService.items();
		
		const groups = {
			Herramientas: allItems.filter(i => i.tipo === 'Herramienta' && i.nombre.toLowerCase().includes(search)),
			Consumibles: allItems.filter(i => i.tipo === 'Consumible' && i.nombre.toLowerCase().includes(search)),
			Equipos: allItems.filter(i => i.tipo === 'Equipo' && i.nombre.toLowerCase().includes(search)),
			'Partes en venta': allItems.filter(i => i.tipo === 'Parte en venta' && i.nombre.toLowerCase().includes(search)),
		};
		
		return Object.entries(groups).filter(([_, items]) => items.length > 0);
	});

	protected readonly servicesByCategory = computed(() => {
		const search = this.serviceSearch().toLowerCase();
		const vehicleType = this.order()?.tipoVehiculo;
		
		const formatPrice = (val: any): string => {
			if (!val && val !== 0) return '0';
			const num = parseFloat(String(val).replace(/[^\d.-]/g, ''));
			return isNaN(num) ? '0' : num.toFixed(0);
		};
		
		const allServices = this._pricesService.getServicios()
			.map(s => {
				if ('concepto' in s) {
					let displayPrice = '';
					try {
						switch (vehicleType) {
							case 'Camioneta':
								displayPrice = `Camioneta: $${formatPrice((s as any).precioCamioneta)}`;
								break;
							case 'Camión':
								displayPrice = `Camión: $${formatPrice((s as any).precioCamion)}`;
								break;
							case 'Auto':
							default:
								displayPrice = `Auto: $${formatPrice((s as any).precioAuto)}`;
						}
					} catch (e) {
						displayPrice = 'Precio N/A';
					}
					return {
						...s,
						displayName: `${(s as any).concepto} - ${(s as any).sistema} (${displayPrice})`
					};
				}
				try {
					return {
						...s,
						displayName: `${(s as any).tamano} / ${(s as any).diametro} - $${formatPrice((s as any).precio)} (Todos)`
					};
				} catch (e) {
					return {
						...s,
						displayName: `${(s as any).tamano} / ${(s as any).diametro} (Precio N/A)`
					};
				}
			})
			.filter(s => s.displayName.toLowerCase().includes(search));
		
		const groups = {
			'Afinación y Otros': allServices.filter(s => (s as any).categoriaPrincipal === 'Afinación y Otros'),
			'Mecánica Rápida': allServices.filter(s => (s as any).categoriaPrincipal === 'Mecánica Rápida'),
			'Mecánica General': allServices.filter(s => (s as any).categoriaPrincipal === 'Mecánica General'),
			'Servicio de Torno': allServices.filter(s => (s as any).categoriaPrincipal === 'Servicio de Torno'),
		};
		
		return Object.entries(groups).filter(([_, services]) => services.length > 0);
	});

	protected readonly partItemToString = (item: unknown): string => {
		const part = item as InventoryItem | null;
		if (!part) return '';
		const price = part.precio ?? part.precioVenta;
		const priceStr = price ? ` - $${price.toFixed(0)}` : '';
		return `${part.nombre} (Stock: ${part.stockActual})${priceStr}`;
	};

	protected readonly serviceItemToString = (item: unknown): string => {
		const service = item as any;
		if (!service) return '';
		if ('concepto' in service) {
			return `${service.concepto} - ${service.sistema}`;
		}
		return `${service.tamano} / ${service.diametro}`;
	};

	protected readonly isLatheService = (service: any): boolean => {
		return service?.categoriaPrincipal === 'Servicio de Torno';
	};

	protected readonly getDisplayPriceForVehicleType = (service: any): string => {
		const vehicleType = this.order()?.tipoVehiculo;
		const isLatheSvc = this.isLatheService(service);
		
		if (isLatheSvc) {
			return '(Todos los tamaños)';
		}
		
		switch (vehicleType) {
			case 'Camioneta':
				return `Camioneta: $${service.precioCamioneta ? Number(service.precioCamioneta).toFixed(0) : '0'}`;
			case 'Camión':
				return `Camión: $${service.precioCamion ? Number(service.precioCamion).toFixed(0) : '0'}`;
			case 'Auto':
			default:
				return `Auto: $${service.precioAuto ? Number(service.precioAuto).toFixed(0) : '0'}`;
		}
	};

	private getPriceKeyForVehicleType(): string {
		const vehicleType = this.order()?.tipoVehiculo;
		switch (vehicleType) {
			case 'Camioneta':
				return 'precioCamioneta';
			case 'Camión':
				return 'precioCamion';
			case 'Auto':
			default:
				return 'precioAuto';
		}
	}

	protected onPartSelected(value: unknown): void {
		this.selectedPart.set((value as InventoryItem | null) ?? null);
	}

	protected onServiceSelected(value: unknown): void {
		this.selectedService.set((value as Servicio | null) ?? null);
	}

	protected assignSelectedPart(): void {
		const order = this.order();
		const part = this.selectedPart();
		if (!order || !part) return;
		
		this._service.assignDirectPart(order.id, part);
		this.selectedPart.set(null);
		this.partSearch.set('');
		this._notification.success('Refaccion agregada a cotizacion.');
	}

	protected assignSelectedService(): void {
		const order = this.order();
		const service = this.selectedService();
		if (!order || !service) return;
		
		const safeParse = (val: any): number => {
			if (!val && val !== 0) return 0;
			const num = parseFloat(String(val).replace(/[^\d.-]/g, ''));
			return isNaN(num) ? 0 : num;
		};
		
		let precio = 0;
		if ('concepto' in service) {
			switch (order.tipoVehiculo) {
				case 'Camioneta':
					precio = safeParse((service as any).precioCamioneta);
					break;
				case 'Camión':
					precio = safeParse((service as any).precioCamion);
					break;
				case 'Auto':
				default:
					precio = safeParse((service as any).precioAuto);
			}
		} else {
			precio = safeParse((service as any).precio);
		}
		
		const serviceCatalog: ServiceCatalogItem = {
			id: service.id.toString(),
			nombre: 'concepto' in service ? (service as any).concepto : (service as any).tamano,
			precio: precio,
			precioAuto: 'precioAuto' in service ? safeParse((service as any).precioAuto) : undefined,
			precioCamioneta: 'precioCamioneta' in service ? safeParse((service as any).precioCamioneta) : undefined,
			precioCamion: 'precioCamion' in service ? safeParse((service as any).precioCamion) : undefined,
		};
		
		this._service.assignDirectService(order.id, serviceCatalog);
		this.selectedService.set(null);
		this.serviceSearch.set('');
		this._notification.success('Servicio agregado a cotizacion.');
	}

	protected readonly getPriceToDisplayInTable = (service: any): number => {
		const vehicleType = this.order()?.tipoVehiculo;
		const isLatheSvc = this.isLatheService(service);
		
		const safeParse = (val: any): number => {
			if (!val && val !== 0) return 0;
			const num = parseFloat(String(val).replace(/[^\d.-]/g, ''));
			return isNaN(num) ? 0 : num;
		};
		
		if (isLatheSvc) {
			return safeParse((service as any).precio);
		}
		
		switch (vehicleType) {
			case 'Camioneta':
				return safeParse((service as any).precioCamioneta) || 0;
			case 'Camión':
				return safeParse((service as any).precioCamion) || 0;
			case 'Auto':
			default:
				return safeParse((service as any).precioAuto) || 0;
		}
	};

	protected totalRefacciones = computed(() => {
		const order = this.order();
		if (!order) return 0;
		return order.refaccionesAsignadas.reduce((sum, part) => sum + part.cantidad * part.costoUnitario, 0);
	});

	protected totalServicios = computed(() => {
		const order = this.order();
		if (!order) return 0;
		return order.serviciosAsignados.reduce((sum, service) => sum + this.getPriceToDisplayInTable(service), 0);
	});

	protected totalCotizacion = computed(() => {
		return this.totalRefacciones() + this.totalServicios();
	});
}
