import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTrash2, lucidePencil } from '@ng-icons/lucide';
import { HlmAlertDialogImports } from '../../../../components/ui/alert-dialog/src';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { NotificationService } from '../../../../core';
import { type InventoryItemCondition } from '../../models';
import { InventoryService } from '../../services';

@Component({
	selector: 'spartan-sale-parts-section',
	standalone: true,
	imports: [CommonModule, HlmCardImports, HlmTableImports, HlmBadgeImports, HlmInputImports, HlmButtonImports, HlmSelectImports, HlmAlertDialogImports, HlmIconImports, NgIcon],
	providers: [provideIcons({ lucideTrash2, lucidePencil })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './sale-parts-section.html',
	styleUrl: './sale-parts-section.css',
})
export class SalePartsSectionComponent {
	private readonly _service = inject(InventoryService);
	private readonly _notification = inject(NotificationService);

	public readonly query = input<string>('');
	protected readonly conditions: InventoryItemCondition[] = ['Bueno', 'Regular', 'Danado'];
	protected readonly items = computed(() => {
		const term = this.query().trim().toLowerCase();
		const current = this._service.saleItems();
		if (!term) return current;
		return current.filter((item) => `${item.nombre} ${item.descripcion} ${item.responsable}`.toLowerCase().includes(term));
	});
	protected readonly selectedItemId = signal('');
	protected readonly editingItemId = signal('');
	protected readonly selectedItem = computed(() => this.items().find((item) => item.id === this.selectedItemId()));
	protected readonly selectedMovements = computed(() => (this.selectedItemId() ? this._service.getItemMovements(this.selectedItemId()).slice(0, 8) : []));
	protected readonly qtyEdit = signal(1);
	protected readonly reasonEdit = signal('Venta mostrador');
	protected readonly responsibleEdit = signal('');
	protected readonly stockMinEdit = signal(0);
	protected readonly conditionEdit = signal<InventoryItemCondition>('Bueno');
	protected readonly showCreateForm = signal(false);
	protected readonly createNombre = signal('');
	protected readonly createDescripcion = signal('');
	protected readonly createEstado = signal<InventoryItemCondition>('Bueno');
	protected readonly createResponsable = signal('Almacen');
	protected readonly createStockActual = signal(0);
	protected readonly createStockMinimo = signal(0);
	protected readonly createPrecio = signal(0);
	protected readonly createLinkedPartId = signal('');
	protected readonly createPhoto = signal('');
	protected readonly createPhotoFile = signal<File | null>(null);

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
		this.reasonEdit.set('Venta mostrador');
	}

	protected editItem(item: any): void {
		this.editingItemId.set(item.id);
		this.createNombre.set(item.nombre);
		this.createDescripcion.set(item.descripcion);
		this.createEstado.set(item.estado);
		this.createResponsable.set(item.responsable);
		this.createStockActual.set(item.stockActual);
		this.createStockMinimo.set(item.stockMinimo);
		this.createPrecio.set(item.precioVenta || 0);
		this.createLinkedPartId.set(item.linkedPartId || '');
		this.createPhoto.set(item.fotoUrl);
		this.showCreateForm.set(true);
	}

	protected closeManagePanel(): void {
		this.selectedItemId.set('');
	}

	protected saveItemMeta(): void {
		const item = this.selectedItem();
		if (!item) return;
		this._service.updateItemMeta(item.id, {
			responsable: this.responsibleEdit(),
			stockMinimo: this.stockMinEdit(),
			estado: this.conditionEdit(),
		});
		this._notification.success('Datos de la parte actualizados.');
	}

	protected registerEntry(): void {
		const item = this.selectedItem();
		if (!item) return;
		const ok = this._service.recordEntry(item.id, Math.max(1, this.qtyEdit()), this.reasonEdit(), 'Administrador');
		if (ok) {
			this._notification.success('Entrada de parte registrada.');
		}
	}

	protected registerManualAdjust(): void {
		const item = this.selectedItem();
		if (!item) return;
		const delta = -Math.abs(this.qtyEdit());
		const ok = this._service.recordManualAdjustment(item.id, delta, this.reasonEdit(), 'Administrador');
		if (ok) {
			this._notification.info('Salida registrada.');
		}
	}

	protected deleteItem(itemId: string): void {
		const removed = this._service.deleteInventoryItem(itemId);
		if (!removed) {
			this._notification.error('No se pudo eliminar la parte.');
			return;
		}
		if (this.selectedItemId() === itemId) {
			this.closeManagePanel();
		}
		this._notification.success('Parte eliminada.');
	}

	protected onCreateConditionChange(value: string): void {
		if (value === 'Bueno' || value === 'Regular' || value === 'Danado') {
			this.createEstado.set(value);
		}
	}

	protected onConditionChange(value: string): void {
		if (value === 'Bueno' || value === 'Regular' || value === 'Danado') {
			this.conditionEdit.set(value);
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

	protected createSaleItem(): void {
		if (!this.createNombre().trim()) return;
		const editingId = this.editingItemId();
		const photoFile = this.createPhotoFile() ?? undefined;
		if (editingId) {
			this._service.updateInventoryItem(editingId, {
				nombre: this.createNombre(),
				tipo: 'Parte en venta',
				fotoUrl: this.createPhoto(),
				descripcion: this.createDescripcion(),
				estado: this.createEstado(),
				responsable: this.createResponsable(),
				stockActual: this.createStockActual(),
				stockMinimo: this.createStockMinimo(),
				precioVenta: this.createPrecio(),
				linkedPartId: this.createLinkedPartId().trim() || undefined,
			});
			if (photoFile) {
				this._service.uploadItemPhoto(editingId, photoFile);
			}
			this._notification.success('Parte en venta actualizada.');
		} else {
			this._service.createInventoryItem({
				nombre: this.createNombre(),
				tipo: 'Parte en venta',
				fotoUrl: this.createPhoto(),
				photoFile,
				descripcion: this.createDescripcion(),
				estado: this.createEstado(),
				responsable: this.createResponsable(),
				stockActual: this.createStockActual(),
				stockMinimo: this.createStockMinimo(),
				precioVenta: this.createPrecio(),
				linkedPartId: this.createLinkedPartId().trim() || undefined,
			});
			this._notification.success('Parte en venta agregada.');
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
		this.createPrecio.set(0);
		this.createLinkedPartId.set('');
		this.createStockActual.set(0);
		this.createStockMinimo.set(0);
		this.createEstado.set('Bueno');
		this.createResponsable.set('Almacen');
	}

	protected stockClass(actual: number, min: number): string {
		return actual <= min ? 'stock-low' : 'stock-ok';
	}
}
