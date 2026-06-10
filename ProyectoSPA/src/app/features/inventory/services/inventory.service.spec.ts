import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { InventoryService } from './inventory.service';
import type { CreateInventoryItemInput } from '../models';

function flushInitialRequests(httpMock: HttpTestingController, items: any[] = [], custody: any[] = []) {
  httpMock.expectOne('/api/v1/inventory?per_page=200').flush({ data: items });
  httpMock.expectOne('/api/v1/inventory/custody').flush({ data: custody });
}

const baseItemApi = {
  id: 1, nombre: 'Filtro de aceite', tipo: 'Parte en venta', estado: 'Bueno',
  stock_actual: 10, stock_minimo: 2, precio: 50, precio_venta: 120, low_stock: false, foto_url: null,
};

describe('InventoryService', () => {
  let service: InventoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(InventoryService);
    httpMock = TestBed.inject(HttpTestingController);

    flushInitialRequests(httpMock, [baseItemApi]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('carga y mapea los items de inventario', () => {
    const items = service.items();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: '1', nombre: 'Filtro de aceite', tipo: 'Parte en venta',
      stockActual: 10, stockMinimo: 2, precio: 50, precioVenta: 120,
    });
  });

  describe('signals computados', () => {
    it('operationalItems filtra herramientas, consumibles y equipo', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
      const fresh = TestBed.inject(InventoryService);
      const freshHttp = TestBed.inject(HttpTestingController);
      flushInitialRequests(freshHttp, [
        { ...baseItemApi, id: 1, tipo: 'Herramienta' },
        { ...baseItemApi, id: 2, tipo: 'Parte en venta' },
        { ...baseItemApi, id: 3, tipo: 'Consumible' },
      ]);

      expect(fresh.operationalItems().map(i => i.id)).toEqual(['1', '3']);
      expect(fresh.saleItems().map(i => i.id)).toEqual(['2']);
      freshHttp.verify();
    });

    it('lowStockItems incluye items con stock por debajo o igual al mínimo', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
      const fresh = TestBed.inject(InventoryService);
      const freshHttp = TestBed.inject(HttpTestingController);
      flushInitialRequests(freshHttp, [
        { ...baseItemApi, id: 1, stock_actual: 1, stock_minimo: 2 },
        { ...baseItemApi, id: 2, stock_actual: 5, stock_minimo: 2 },
      ]);

      expect(fresh.lowStockItems().map(i => i.id)).toEqual(['1']);
      freshHttp.verify();
    });
  });

  describe('createInventoryItem', () => {
    it('agrega un item temporal y lo reemplaza con la respuesta del servidor', () => {
      const payload: CreateInventoryItemInput = {
        nombre: 'Bujía', tipo: 'Parte en venta', fotoUrl: '', descripcion: '',
        estado: 'Bueno', responsable: 'Almacen', stockActual: 5, stockMinimo: 1, precio: 30, precioVenta: 80,
      };

      const tempItem = service.createInventoryItem(payload);
      expect(service.items().some(i => i.id === tempItem.id)).toBe(true);

      const req = httpMock.expectOne('/api/v1/inventory');
      expect(req.request.method).toBe('POST');
      req.flush({ data: { ...baseItemApi, id: 99, nombre: 'Bujía', stock_actual: 5, stock_minimo: 1 } });

      const items = service.items();
      expect(items.some(i => i.id === tempItem.id)).toBe(false);
      expect(items.some(i => i.id === '99' && i.nombre === 'Bujía')).toBe(true);
    });

    it('elimina el item temporal si la creación falla', () => {
      const payload: CreateInventoryItemInput = {
        nombre: 'Bujía', tipo: 'Parte en venta', fotoUrl: '', descripcion: '',
        estado: 'Bueno', responsable: 'Almacen', stockActual: 5, stockMinimo: 1,
      };

      const tempItem = service.createInventoryItem(payload);
      const req = httpMock.expectOne('/api/v1/inventory');
      req.flush('error', { status: 500, statusText: 'Server Error' });

      expect(service.items().some(i => i.id === tempItem.id)).toBe(false);
    });
  });

  describe('updateInventoryItem', () => {
    it('actualiza los campos del item localmente y llama al API', () => {
      const result = service.updateInventoryItem('1', { nombre: 'Filtro Premium', stockActual: 20 });

      expect(result).toBe(true);
      const item = service.items().find(i => i.id === '1');
      expect(item?.nombre).toBe('Filtro Premium');
      expect(item?.stockActual).toBe(20);

      const req = httpMock.expectOne('/api/v1/inventory/1');
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });
  });

  describe('deleteInventoryItem', () => {
    it('elimina el item y sus movimientos asociados', () => {
      const result = service.deleteInventoryItem('1');

      expect(result).toBe(true);
      expect(service.items().find(i => i.id === '1')).toBeUndefined();
    });
  });

  describe('recordEntry / recordManualAdjustment', () => {
    it('registra una entrada de stock y crea un movimiento', () => {
      const result = service.recordEntry('1', 5, 'Compra de stock');

      expect(result).toBe(true);
      expect(service.items().find(i => i.id === '1')?.stockActual).toBe(15);
      expect(service.getItemMovements('1')).toHaveLength(1);
      expect(service.getItemMovements('1')[0]).toMatchObject({ type: 'Entrada', cantidad: 5, stockResultante: 15 });

      httpMock.expectOne('/api/v1/inventory/1/movements').flush({});
    });

    it('rechaza una entrada con cantidad <= 0', () => {
      const result = service.recordEntry('1', 0, 'Inválido');
      expect(result).toBe(false);
    });

    it('rechaza un ajuste manual que deja el stock en negativo', () => {
      const result = service.recordManualAdjustment('1', -50, 'Ajuste grande');

      expect(result).toBe(false);
      expect(service.items().find(i => i.id === '1')?.stockActual).toBe(10);
    });

    it('rechaza un ajuste manual con delta 0', () => {
      const result = service.recordManualAdjustment('1', 0, 'Sin cambio');
      expect(result).toBe(false);
    });
  });

  describe('consumeForWorkOrder', () => {
    it('descuenta una unidad del item vinculado a la refacción', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
      const fresh = TestBed.inject(InventoryService);
      const freshHttp = TestBed.inject(HttpTestingController);
      flushInitialRequests(freshHttp, [{ ...baseItemApi, id: 1, stock_actual: 10 }]);

      // Vincula manualmente el item a una parte de catálogo
      (fresh as any)._items.update((items: any[]) => items.map(i => ({ ...i, linkedPartId: 'part-1' })));

      fresh.consumeForWorkOrder('part-1', 'WO-1', 'Almacen');

      expect(fresh.items().find(i => i.id === '1')?.stockActual).toBe(9);
      expect(fresh.getItemMovements('1')[0]).toMatchObject({ type: 'Salida OT', cantidad: 1, relatedOtId: 'WO-1' });

      freshHttp.expectOne('/api/v1/inventory/1/movements').flush({});
      freshHttp.verify();
    });

    it('no hace nada si no encuentra un item con el linkedPartId', () => {
      service.consumeForWorkOrder('no-existe', 'WO-1', 'Almacen');
      expect(service.getItemMovements('1')).toHaveLength(0);
    });
  });

  describe('custodia', () => {
    it('crea una entrada de custodia válida', () => {
      service.createCustodyEntry({ otId: 'WO-1', item: 'Llantas', responsable: 'Juan' } as any);

      const req = httpMock.expectOne('/api/v1/inventory/custody');
      expect(req.request.method).toBe('POST');
      req.flush({
        data: { id: 1, work_order_id: 'WO-1', client_id: 1, item: 'Llantas', responsable: 'Juan', estado: 'Resguardado', fecha_ingreso: '2026-06-09' },
      });

      expect(service.custody()).toHaveLength(1);
      expect(service.custody()[0]).toMatchObject({ otId: 'WO-1', item: 'Llantas', estado: 'Resguardado' });
    });

    it('no crea una entrada de custodia si faltan datos requeridos', () => {
      service.createCustodyEntry({ otId: '', item: 'Llantas', responsable: 'Juan' } as any);

      httpMock.expectNone('/api/v1/inventory/custody');
      expect(service.custody()).toHaveLength(0);
    });

    it('marca una entrada de custodia como entregada', () => {
      service.createCustodyEntry({ otId: 'WO-1', item: 'Llantas', responsable: 'Juan' } as any);
      httpMock.expectOne('/api/v1/inventory/custody').flush({
        data: { id: 1, work_order_id: 'WO-1', client_id: 1, item: 'Llantas', responsable: 'Juan', estado: 'Resguardado', fecha_ingreso: '2026-06-09' },
      });

      service.markCustodyDelivered('1');

      expect(service.custody()[0].estado).toBe('Entregado');
      httpMock.expectOne('/api/v1/inventory/custody/1/deliver').flush({});
    });

    it('elimina una entrada de custodia existente', () => {
      service.createCustodyEntry({ otId: 'WO-1', item: 'Llantas', responsable: 'Juan' } as any);
      httpMock.expectOne('/api/v1/inventory/custody').flush({
        data: { id: 1, work_order_id: 'WO-1', client_id: 1, item: 'Llantas', responsable: 'Juan', estado: 'Resguardado', fecha_ingreso: '2026-06-09' },
      });

      const removed = service.deleteCustodyEntry('1');

      expect(removed).toBe(true);
      expect(service.custody()).toHaveLength(0);
    });

    it('retorna false al eliminar una entrada de custodia inexistente', () => {
      expect(service.deleteCustodyEntry('no-existe')).toBe(false);
    });
  });
});
