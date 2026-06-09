import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core';
import type {
  CreateCustodyInput,
  CreateInventoryItemInput,
  InventoryItem,
  InventoryItemCondition,
  InventoryMovement,
  InventoryMovementType,
} from '../models';

interface InventoryItemApi {
  id: number;
  nombre: string;
  tipo: string;
  estado: string;
  stock_actual: number;
  stock_minimo: number;
  precio: number | null;
  precio_venta: number | null;
  low_stock: boolean;
  foto_url: string | null;
}

interface CustodyApi {
  id: number;
  work_order_id: string;
  client_id: number;
  item: string;
  responsable: string;
  estado: string;
  fecha_ingreso: string;
  client?: { nombre: string };
  workOrder?: { id: string };
}

interface Paginated<T> { data: T[] }

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly _notification = inject(NotificationService);
  private readonly _http = inject(HttpClient);

  private readonly _items = signal<InventoryItem[]>([]);
  private readonly _movements = signal<InventoryMovement[]>([]);
  private readonly _custody = signal<ReturnType<typeof this.mapCustody>[]>([]);

  public readonly items = this._items.asReadonly();
  public readonly movements = this._movements.asReadonly();
  public readonly custody = this._custody.asReadonly();

  public readonly operationalItems = computed(() =>
    this._items().filter(i => i.tipo === 'Herramienta' || i.tipo === 'Consumible' || i.tipo === 'Equipo'),
  );
  public readonly saleItems = computed(() => this._items().filter(i => i.tipo === 'Parte en venta'));
  public readonly lowStockItems = computed(() => this._items().filter(i => i.stockActual <= i.stockMinimo));

  constructor() {
    this.loadItems();
    this.loadCustody();
  }

  private loadItems(): void {
    this._http.get<Paginated<InventoryItemApi>>('/api/v1/inventory?per_page=200').subscribe({
      next: (res) => this._items.set(res.data.map(this.mapItem)),
    });
  }

  private loadCustody(): void {
    this._http.get<{ data: CustodyApi[] }>('/api/v1/inventory/custody').subscribe({
      next: (res) => this._custody.set(res.data.map(this.mapCustody)),
    });
  }

  private mapItem(item: InventoryItemApi): InventoryItem {
    return {
      id: String(item.id),
      nombre: item.nombre,
      tipo: item.tipo as InventoryItem['tipo'],
      fotoUrl: item.foto_url ?? '',
      descripcion: '',
      estado: item.estado as InventoryItemCondition,
      responsable: 'Almacen',
      stockActual: item.stock_actual,
      stockMinimo: item.stock_minimo,
      precio: item.precio ?? undefined,
      precioVenta: item.precio_venta ?? undefined,
    };
  }

  private mapCustody(c: CustodyApi) {
    return {
      id: String(c.id),
      otId: c.work_order_id,
      cliente: c.client?.nombre ?? '',
      item: c.item,
      fotoUrl: '',
      responsable: c.responsable,
      estado: c.estado as 'Resguardado' | 'Entregado',
      fechaIngreso: c.fecha_ingreso,
    };
  }

  public createInventoryItem(payload: CreateInventoryItemInput): InventoryItem {
    const body = {
      nombre: payload.nombre.trim(),
      tipo: payload.tipo,
      estado: payload.estado,
      responsable: payload.responsable.trim() || 'Almacen',
      stock_actual: Math.max(0, payload.stockActual),
      stock_minimo: Math.max(0, payload.stockMinimo),
      precio: payload.precio,
      precio_venta: payload.precioVenta,
    };
    const tempItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      nombre: payload.nombre.trim(),
      tipo: payload.tipo,
      fotoUrl: payload.fotoUrl.trim(),
      descripcion: payload.descripcion.trim(),
      estado: payload.estado,
      responsable: payload.responsable.trim() || 'Almacen',
      stockActual: Math.max(0, payload.stockActual),
      stockMinimo: Math.max(0, payload.stockMinimo),
      precio: payload.precio,
      precioVenta: payload.precioVenta,
      linkedPartId: payload.linkedPartId,
    };
    this._items.update(items => [tempItem, ...items]);
    this._http.post<{ data: InventoryItemApi }>('/api/v1/inventory', body).subscribe({
      next: (res) => {
        const realItem = this.mapItem(res.data);
        this._items.update(items => items.map(i => i.id === tempItem.id ? realItem : i));
        if (payload.photoFile) {
          this.uploadItemPhoto(realItem.id, payload.photoFile);
        }
      },
      error: () => this._items.update(items => items.filter(i => i.id !== tempItem.id)),
    });
    return tempItem;
  }

  public uploadItemPhoto(itemId: string, file: File): void {
    const form = new FormData();
    form.append('foto', file);
    this._http.post<{ data: InventoryItemApi }>(`/api/v1/inventory/${itemId}/photo`, form).subscribe({
      next: (res) => {
        const updated = this.mapItem(res.data);
        this._items.update(items => items.map(i => i.id === itemId ? { ...i, fotoUrl: updated.fotoUrl } : i));
      },
    });
  }

  public deleteInventoryItem(itemId: string): boolean {
    this._items.update(items => items.filter(i => i.id !== itemId));
    this._movements.update(m => m.filter(mv => mv.itemId !== itemId));
    return true;
  }

  public updateInventoryItem(itemId: string, payload: Partial<CreateInventoryItemInput>): boolean {
    this._items.update(items =>
      items.map(item =>
        item.id === itemId
          ? {
              ...item,
              nombre: payload.nombre?.trim() || item.nombre,
              tipo: payload.tipo || item.tipo,
              fotoUrl: payload.fotoUrl?.trim() || item.fotoUrl,
              descripcion: payload.descripcion?.trim() || item.descripcion,
              estado: payload.estado || item.estado,
              responsable: payload.responsable?.trim() || item.responsable,
              stockActual: typeof payload.stockActual === 'number' ? Math.max(0, payload.stockActual) : item.stockActual,
              stockMinimo: typeof payload.stockMinimo === 'number' ? Math.max(0, payload.stockMinimo) : item.stockMinimo,
              precio: typeof payload.precio === 'number' ? payload.precio : item.precio,
              precioVenta: payload.precioVenta ?? item.precioVenta,
            }
          : item,
      ),
    );
    const updated = this._items().find(i => i.id === itemId);
    if (updated) {
      this._http.put(`/api/v1/inventory/${itemId}`, {
        nombre: updated.nombre,
        estado: updated.estado,
        precio: updated.precio,
        precio_venta: updated.precioVenta,
        stock_minimo: updated.stockMinimo,
      }).subscribe();
    }
    return true;
  }

  public updateItemMeta(id: string, patch: { estado?: InventoryItemCondition; responsable?: string; stockMinimo?: number }): void {
    this._items.update(items =>
      items.map(item =>
        item.id === id
          ? {
              ...item,
              estado: patch.estado ?? item.estado,
              responsable: patch.responsable?.trim() || item.responsable,
              stockMinimo: typeof patch.stockMinimo === 'number' ? Math.max(0, patch.stockMinimo) : item.stockMinimo,
            }
          : item,
      ),
    );
  }

  public recordEntry(itemId: string, cantidad: number, motivo: string, usuario = 'Administrador'): boolean {
    if (cantidad <= 0) return false;
    return this.applyMovement(itemId, 'Entrada', cantidad, motivo, usuario);
  }

  public recordManualAdjustment(itemId: string, delta: number, motivo: string, usuario = 'Administrador'): boolean {
    if (!delta) return false;
    return this.applyMovement(itemId, 'Ajuste manual', delta, motivo, usuario);
  }

  public consumeForWorkOrder(linkedPartId: string, otId: string, usuario = 'Almacen'): void {
    const item = this._items().find(i => i.linkedPartId === linkedPartId);
    if (!item) return;
    this.applyMovement(item.id, 'Salida OT', -1, 'Refaccion usada en OT', usuario, otId);
  }

  public getItemMovements(itemId: string): InventoryMovement[] {
    return this._movements()
      .filter(m => m.itemId === itemId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  public createCustodyEntry(payload: CreateCustodyInput): void {
    const trimmedItem = payload.item.trim();
    if (!payload.otId.trim() || !trimmedItem) return;
    this._http.post<{ data: CustodyApi }>('/api/v1/inventory/custody', {
      work_order_id: payload.otId.trim(),
      item: trimmedItem,
      responsable: payload.responsable.trim() || 'Recepcion',
      fecha_ingreso: new Date().toISOString().split('T')[0],
    }).subscribe({
      next: (res) => this._custody.update(c => [this.mapCustody(res.data), ...c]),
    });
  }

  public markCustodyDelivered(id: string): void {
    this._custody.update(entries => entries.map(e => e.id === id ? { ...e, estado: 'Entregado' as const } : e));
    this._http.patch(`/api/v1/inventory/custody/${id}/deliver`, {}).subscribe();
  }

  public deleteCustodyEntry(id: string): boolean {
    let removed = false;
    this._custody.update(entries => {
      const filtered = entries.filter(e => e.id !== id);
      removed = filtered.length !== entries.length;
      return filtered;
    });
    return removed;
  }

  private applyMovement(
    itemId: string, type: InventoryMovementType, delta: number,
    motivo: string, usuario: string, relatedOtId?: string,
  ): boolean {
    const currentItem = this._items().find(i => i.id === itemId);
    if (!currentItem) return false;

    const nextStock = currentItem.stockActual + delta;
    if (nextStock < 0) {
      this._notification.error(`Stock insuficiente para ${currentItem.nombre}.`);
      return false;
    }

    this._items.update(items => items.map(i => i.id === itemId ? { ...i, stockActual: nextStock } : i));
    const movement: InventoryMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      itemId, type, cantidad: Math.abs(delta), stockResultante: nextStock,
      relatedOtId, motivo, usuario, timestamp: this.nowTimestamp(),
    };
    this._movements.update(m => [movement, ...m]);

    const apiType = type === 'Entrada' ? 'entrada' : type === 'Salida OT' ? 'salida' : 'ajuste';
    this._http.post(`/api/v1/inventory/${itemId}/movements`, {
      tipo: apiType, cantidad: Math.abs(delta), motivo,
    }).subscribe();

    if (nextStock <= currentItem.stockMinimo) {
      this._notification.warning(`Alerta: ${currentItem.nombre} bajo mínimo (${nextStock}/${currentItem.stockMinimo}).`);
    }
    return true;
  }

  private nowTimestamp(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
}
