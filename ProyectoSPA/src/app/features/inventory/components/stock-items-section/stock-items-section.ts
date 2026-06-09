import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHammer, lucidePackage, lucideTrash2, lucideWrench, lucidePencil } from '@ng-icons/lucide';
import { HlmAccordionImports } from '@spartan-ng/helm/accordion';
import { HlmAlertDialogImports } from '../../../../components/ui/alert-dialog/src';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { NotificationService } from '../../../../core';
import { type InventoryItemCondition, type InventoryItemType } from '../../models';
import { InventoryService } from '../../services';

@Component({
	selector: 'spartan-stock-items-section',
	standalone: true,
	imports: [
		CommonModule,
		HlmCardImports,
		HlmTableImports,
		HlmInputImports,
		HlmButtonImports,
		HlmBadgeImports,
		HlmSelectImports,
		HlmAccordionImports,
		HlmAlertDialogImports,
		HlmIconImports,
		NgIcon,
	],
	providers: [provideIcons({ lucideWrench, lucidePackage, lucideHammer, lucideTrash2, lucidePencil })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './stock-items-section.html',
	styleUrl: './stock-items-section.css',
})
export class StockItemsSectionComponent {
	private readonly _service = inject(InventoryService);
	private readonly _notification = inject(NotificationService);

	public readonly query = input<string>('');
	protected readonly items = computed(() => {
		const term = this.query().trim().toLowerCase();
		const current = this._service.operationalItems();
		if (!term) return current;
		return current.filter((item) =>
			`${item.nombre} ${item.descripcion} ${item.tipo} ${item.responsable}`.toLowerCase().includes(term),
		);
	});
	protected readonly groupedItems = computed(() => [
		{ type: 'Herramienta' as InventoryItemType, icon: 'lucideWrench', items: this.items().filter((item) => item.tipo === 'Herramienta') },
		{ type: 'Consumible' as InventoryItemType, icon: 'lucidePackage', items: this.items().filter((item) => item.tipo === 'Consumible') },
		{ type: 'Equipo' as InventoryItemType, icon: 'lucideHammer', items: this.items().filter((item) => item.tipo === 'Equipo') },
	]);
	protected readonly conditions: InventoryItemCondition[] = ['Bueno', 'Regular', 'Danado'];
	protected readonly createTypes: InventoryItemType[] = ['Herramienta', 'Consumible', 'Equipo'];
	protected readonly selectedItemId = signal('');
	protected readonly responsibleEdit = signal('');
	protected readonly stockMinEdit = signal(0);
	protected readonly conditionEdit = signal<InventoryItemCondition>('Bueno');
	protected readonly qtyEdit = signal(1);
	protected readonly reasonEdit = signal('Movimiento manual');
	protected readonly showCreateForm = signal(false);
	protected readonly createNombre = signal('');
	protected readonly createTipo = signal<InventoryItemType>('Herramienta');
	protected readonly createDescripcion = signal('');
	protected readonly createEstado = signal<InventoryItemCondition>('Bueno');
	protected readonly createResponsable = signal('Almacen');
	protected readonly createStockActual = signal(0);
	protected readonly createStockMinimo = signal(0);
	protected readonly createPrecio = signal(0);
	protected readonly createPhoto = signal('');
	protected readonly createPhotoFile = signal<File | null>(null);
	protected readonly editingItemId = signal('');
	protected readonly selectedItem = computed(() => this.items().find((item) => item.id === this.selectedItemId()));
	protected readonly selectedMovements = computed(() =>
		this.selectedItemId() ? this._service.getItemMovements(this.selectedItemId()).slice(0, 8) : [],
	);

	protected selectItem(itemId: string): void {
		this.selectedItemId.set(itemId);
		const item = this.items().find((candidate) => candidate.id === itemId);
		if (!item) {
			return;
		}
		this.responsibleEdit.set(item.responsable);
		this.stockMinEdit.set(item.stockMinimo);
		this.conditionEdit.set(item.estado);
		this.qtyEdit.set(1);
		this.reasonEdit.set('Movimiento manual');
	}

	protected editItem(item: any): void {
		this.editingItemId.set(item.id);
		this.createNombre.set(item.nombre);
		this.createTipo.set(item.tipo);
		this.createDescripcion.set(item.descripcion);
		this.createEstado.set(item.estado);
		this.createResponsable.set(item.responsable);
		this.createStockActual.set(item.stockActual);
		this.createStockMinimo.set(item.stockMinimo);
		this.createPrecio.set(item.precio || 0);
		this.createPhoto.set(item.fotoUrl);
		this.showCreateForm.set(true);
	}

	protected saveItemMeta(): void {
		const item = this.selectedItem();
		if (!item) return;
		this._service.updateItemMeta(item.id, {
			responsable: this.responsibleEdit(),
			stockMinimo: this.stockMinEdit(),
			estado: this.conditionEdit(),
		});
		this._notification.success('Datos del item actualizados.');
	}

	protected closeManagePanel(): void {
		this.selectedItemId.set('');
	}

	protected onConditionChange(value: string): void {
		if (value === 'Bueno' || value === 'Regular' || value === 'Danado') {
			this.conditionEdit.set(value);
		}
	}

	protected onCreateTypeChange(value: string): void {
		if (value === 'Herramienta' || value === 'Consumible' || value === 'Equipo') {
			this.createTipo.set(value);
		}
	}

	protected onCreateConditionChange(value: string): void {
		if (value === 'Bueno' || value === 'Regular' || value === 'Danado') {
			this.createEstado.set(value);
		}
	}

	protected onPhotoSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		this.createPhotoFile.set(file);
		const reader = new FileReader();
		reader.onload = () => this.createPhoto.set((reader.result as string) || '');
		reader.readAsDataURL(file);
	}

	protected createItem(): void {
		if (!this.createNombre().trim()) return;
		const editingId = this.editingItemId();
		const photoFile = this.createPhotoFile() ?? undefined;
		if (editingId) {
			this._service.updateInventoryItem(editingId, {
				nombre: this.createNombre(),
				tipo: this.createTipo(),
				fotoUrl: this.createPhoto(),
				descripcion: this.createDescripcion(),
				estado: this.createEstado(),
				responsable: this.createResponsable(),
				stockActual: this.createStockActual(),
				stockMinimo: this.createStockMinimo(),
				precio: this.createPrecio(),
			});
			if (photoFile) {
				this._service.uploadItemPhoto(editingId, photoFile);
			}
			this._notification.success('Item operativo actualizado.');
		} else {
			this._service.createInventoryItem({
				nombre: this.createNombre(),
				tipo: this.createTipo(),
				fotoUrl: this.createPhoto(),
				photoFile,
				descripcion: this.createDescripcion(),
				estado: this.createEstado(),
				responsable: this.createResponsable(),
				stockActual: this.createStockActual(),
				stockMinimo: this.createStockMinimo(),
				precio: this.createPrecio(),
			});
			this._notification.success('Item operativo agregado.');
		}
		this.resetForm();
	}

	protected resetForm(): void {
		this.editingItemId.set('');
		this.showCreateForm.set(false);
		this.createNombre.set('');
		this.createDescripcion.set('');
		this.createPhoto.set('');
		this.createPhotoFile.set(null);
		this.createStockActual.set(0);
		this.createStockMinimo.set(0);
		this.createPrecio.set(0);
		this.createTipo.set('Herramienta');
		this.createEstado.set('Bueno');
		this.createResponsable.set('Almacen');
	}

	protected deleteItem(itemId: string): void {
		const removed = this._service.deleteInventoryItem(itemId);
		if (!removed) {
			this._notification.error('No se pudo eliminar el item.');
			return;
		}
		if (this.selectedItemId() === itemId) {
			this.closeManagePanel();
		}
		this._notification.success('Item eliminado.');
	}

	protected addEntry(): void {
		const item = this.selectedItem();
		if (!item) return;
		const ok = this._service.recordEntry(item.id, Math.max(1, this.qtyEdit()), this.reasonEdit(), 'Administrador');
		if (ok) {
			this._notification.success('Entrada registrada.');
		}
	}

	protected adjustManual(): void {
		const item = this.selectedItem();
		if (!item) return;
		const delta = -Math.abs(this.qtyEdit());
		const ok = this._service.recordManualAdjustment(item.id, delta, this.reasonEdit(), 'Administrador');
		if (ok) {
			this._notification.info('Salida registrada.');
		}
	}

	protected stockClass(actual: number, min: number): string {
		return actual <= min ? 'stock-low' : 'stock-ok';
	}
}
