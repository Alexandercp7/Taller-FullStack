import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { WorkOrdersService } from './work-orders.service';
import { InventoryService } from '../../inventory/services';
import type { PartCatalogItem, ServiceCatalogItem, WorkOrder } from '../models/work-orders.models';

const emptyListResponse = { data: [] };

describe('WorkOrdersService', () => {
  let service: WorkOrdersService;
  let httpMock: HttpTestingController;
  let inventoryConsumeSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: InventoryService,
          useValue: { consumeForWorkOrder: vi.fn() },
        },
      ],
    });

    service = TestBed.inject(WorkOrdersService);
    httpMock = TestBed.inject(HttpTestingController);
    inventoryConsumeSpy = TestBed.inject(InventoryService).consumeForWorkOrder as any;

    // Responde la carga inicial disparada por el constructor
    const req = httpMock.expectOne('/api/v1/work-orders?per_page=100');
    req.flush(emptyListResponse);

    const clientsReq = httpMock.expectOne('/api/v1/clients?per_page=500');
    clientsReq.flush(emptyListResponse);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('carga inicial', () => {
    it('marca listLoaded en true tras recibir la respuesta', () => {
      expect(service.listLoaded()).toBe(true);
      expect(service.workOrders()).toEqual([]);
    });

    it('marca listLoaded en true incluso si la petición falla', () => {
      // Recrear el servicio para simular un error en la carga inicial
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: InventoryService, useValue: { consumeForWorkOrder: vi.fn() } },
        ],
      });
      const freshService = TestBed.inject(WorkOrdersService);
      const freshHttpMock = TestBed.inject(HttpTestingController);

      const req = freshHttpMock.expectOne('/api/v1/work-orders?per_page=100');
      req.flush('error', { status: 500, statusText: 'Server Error' });

      expect(freshService.listLoaded()).toBe(true);
      freshHttpMock.verify();
    });

    it('mapea correctamente los campos de la API a WorkOrder', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: InventoryService, useValue: { consumeForWorkOrder: vi.fn() } },
        ],
      });
      const freshService = TestBed.inject(WorkOrdersService);
      const freshHttpMock = TestBed.inject(HttpTestingController);

      const req = freshHttpMock.expectOne('/api/v1/work-orders?per_page=100');
      req.flush({
        data: [{
          id: 'WO-1001',
          status: 'En Proceso',
          priority: 'Alta',
          tipo_vehiculo: 'Camion',
          problema: 'Ruido en motor',
          fecha_ingreso: '2026-06-01T10:00:00.000Z',
          fecha_programada: '2026-06-02',
          cargo_generado: false,
          cliente: { id: 1, nombre: 'Juan Pérez', telefono: '555-0001', correo: 'juan@example.com' },
          vehiculo: { id: 1, marca: 'Nissan', modelo: 'NP300', anio: 2020, placas: 'ABC-123', vin: 'VIN123' },
          tecnico: { id: 1, name: 'Pedro' },
        }],
      });

      const orders = freshService.workOrders();
      expect(orders).toHaveLength(1);
      const order = orders[0];
      expect(order.id).toBe('WO-1001');
      expect(order.cliente).toBe('Juan Pérez');
      expect(order.tecnico).toBe('Pedro');
      expect(order.fechaIngreso).toBe('2026-06-01');
      expect(order.fechaProgramada).toBe('2026-06-02');
      expect(order.tipoVehiculo).toBe('Camión');
      expect(order.vehicle.marca).toBe('Nissan');
      expect(order.vehicle.placas).toBe('ABC-123');

      freshHttpMock.verify();
    });

    it('usa valores por defecto cuando cliente, vehiculo o tecnico son null', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: InventoryService, useValue: { consumeForWorkOrder: vi.fn() } },
        ],
      });
      const freshService = TestBed.inject(WorkOrdersService);
      const freshHttpMock = TestBed.inject(HttpTestingController);

      const req = freshHttpMock.expectOne('/api/v1/work-orders?per_page=100');
      req.flush({
        data: [{
          id: 'WO-1002',
          status: 'Agendado',
          priority: 'Media',
          tipo_vehiculo: 'Auto',
          problema: '',
          fecha_ingreso: null,
          fecha_programada: null,
          cargo_generado: false,
          cliente: null,
          vehiculo: null,
          tecnico: null,
        }],
      });

      const order = freshService.workOrders()[0];
      expect(order.cliente).toBe('Sin cliente');
      expect(order.tecnico).toBe('Sin asignar');
      expect(order.vehicle.marca).toBe('');
      expect(order.problema).toBe('');

      freshHttpMock.verify();
    });
  });

  describe('signals computados', () => {
    function setOrders(orders: WorkOrder[]) {
      (service as any)._workOrders.set(orders);
    }

    it('technicians retorna técnicos únicos', () => {
      setOrders([
        buildOrder({ id: 'WO-1', tecnico: 'Pedro' }),
        buildOrder({ id: 'WO-2', tecnico: 'Pedro' }),
        buildOrder({ id: 'WO-3', tecnico: 'Ana' }),
      ]);

      expect(service.technicians()).toEqual(['Pedro', 'Ana']);
    });

    it('clients retorna clientes únicos', () => {
      setOrders([
        buildOrder({ id: 'WO-1', cliente: 'Juan' }),
        buildOrder({ id: 'WO-2', cliente: 'Juan' }),
        buildOrder({ id: 'WO-3', cliente: 'María' }),
      ]);

      expect(service.clients()).toEqual(['Juan', 'María']);
    });

    it('allClients retorna clientes únicos ordenados alfabéticamente', () => {
      setOrders([
        buildOrder({ id: 'WO-1', cliente: 'Zacarías' }),
        buildOrder({ id: 'WO-2', cliente: 'Andrea' }),
        buildOrder({ id: 'WO-3', cliente: 'Marco' }),
      ]);

      expect(service.allClients()).toEqual(['Andrea', 'Marco', 'Zacarías']);
    });
  });

  describe('toggleChecklist', () => {
    it('invierte el estado completada del item indicado', () => {
      const order = buildOrder({
        id: 'WO-1',
        checklistInicial: [{ id: '5', tarea: 'Revisar luces', responsable: 'Juan', responsables: ['Juan'], responsableIds: [], completada: false }],
      });
      (service as any)._workOrders.set([order]);

      service.toggleChecklist('WO-1', 'checklistInicial', '5');

      const updated = service.getById('WO-1')!;
      expect(updated.checklistInicial[0].completada).toBe(true);

      const req = httpMock.expectOne('/api/v1/work-orders/WO-1/checklist/5');
      expect(req.request.method).toBe('PATCH');
      req.flush({});
    });

    it('no llama al API si el id del item no contiene dígitos', () => {
      const order = buildOrder({
        id: 'WO-1',
        checklistInicial: [{ id: 'abc', tarea: 'Revisar luces', responsable: 'Juan', responsables: ['Juan'], responsableIds: [], completada: false }],
      });
      (service as any)._workOrders.set([order]);

      service.toggleChecklist('WO-1', 'checklistInicial', 'abc');

      const updated = service.getById('WO-1')!;
      expect(updated.checklistInicial[0].completada).toBe(true);
      httpMock.expectNone((r) => r.url.startsWith('/api/v1/work-orders/WO-1/checklist'));
    });
  });

  describe('updateStatus', () => {
    it('actualiza el status y marca cargoCuentasPorCobrarGenerado al pasar a Terminado', () => {
      const order = buildOrder({ id: 'WO-1', status: 'En Proceso', cargoCuentasPorCobrarGenerado: false });
      (service as any)._workOrders.set([order]);

      service.updateStatus('WO-1', 'Terminado');

      const updated = service.getById('WO-1')!;
      expect(updated.status).toBe('Terminado');
      expect(updated.cargoCuentasPorCobrarGenerado).toBe(true);

      const req = httpMock.expectOne('/api/v1/work-orders/WO-1/status');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'Terminado' });
      req.flush({});
    });

    it('no duplica el cargo si ya fue generado previamente', () => {
      const order = buildOrder({ id: 'WO-1', status: 'En Proceso', cargoCuentasPorCobrarGenerado: true });
      (service as any)._workOrders.set([order]);

      service.updateStatus('WO-1', 'Terminado');

      const updated = service.getById('WO-1')!;
      expect(updated.cargoCuentasPorCobrarGenerado).toBe(true);

      httpMock.expectOne('/api/v1/work-orders/WO-1/status').flush({});
    });

    it('no hace nada si el nuevo status es igual al actual', () => {
      const order = buildOrder({ id: 'WO-1', status: 'En Proceso' });
      (service as any)._workOrders.set([order]);

      service.updateStatus('WO-1', 'En Proceso');

      // Igual se llama el endpoint, pero el objeto de la orden no cambia de identidad
      const before = service.getById('WO-1');
      httpMock.expectOne('/api/v1/work-orders/WO-1/status').flush({});
      const after = service.getById('WO-1');
      expect(after).toBe(before);
    });
  });

  describe('assignPart', () => {
    it('asigna una refacción del catálogo, descuenta stock y consume del inventario', () => {
      const part: PartCatalogItem = { id: 'part-1', nombre: 'Filtro', sku: 'F-1', stock: 3, costo: 100 };
      const order = buildOrder({ id: 'WO-1', catalogoRefacciones: [part], refaccionesAsignadas: [] });
      (service as any)._workOrders.set([order]);

      service.assignPart('WO-1', 'part-1');

      const updated = service.getById('WO-1')!;
      expect(updated.catalogoRefacciones[0].stock).toBe(2);
      expect(updated.refaccionesAsignadas).toEqual([
        { id: 'part-1', nombre: 'Filtro', cantidad: 1, costoUnitario: 100 },
      ]);
      expect(inventoryConsumeSpy).toHaveBeenCalledWith('part-1', 'WO-1', 'Almacen');
    });

    it('incrementa la cantidad si la refacción ya estaba asignada', () => {
      const part: PartCatalogItem = { id: 'part-1', nombre: 'Filtro', sku: 'F-1', stock: 3, costo: 100 };
      const order = buildOrder({
        id: 'WO-1',
        catalogoRefacciones: [part],
        refaccionesAsignadas: [{ id: 'part-1', nombre: 'Filtro', cantidad: 1, costoUnitario: 100 }],
      });
      (service as any)._workOrders.set([order]);

      service.assignPart('WO-1', 'part-1');

      const updated = service.getById('WO-1')!;
      expect(updated.refaccionesAsignadas).toEqual([
        { id: 'part-1', nombre: 'Filtro', cantidad: 2, costoUnitario: 100 },
      ]);
    });

    it('no hace nada si la refacción no tiene stock disponible', () => {
      const part: PartCatalogItem = { id: 'part-1', nombre: 'Filtro', sku: 'F-1', stock: 0, costo: 100 };
      const order = buildOrder({ id: 'WO-1', catalogoRefacciones: [part], refaccionesAsignadas: [] });
      (service as any)._workOrders.set([order]);

      service.assignPart('WO-1', 'part-1');

      const updated = service.getById('WO-1')!;
      expect(updated.refaccionesAsignadas).toEqual([]);
      expect(inventoryConsumeSpy).not.toHaveBeenCalled();
    });

    it('no hace nada si la refacción no existe en el catálogo', () => {
      const order = buildOrder({ id: 'WO-1', catalogoRefacciones: [], refaccionesAsignadas: [] });
      (service as any)._workOrders.set([order]);

      service.assignPart('WO-1', 'no-existe');

      const updated = service.getById('WO-1')!;
      expect(updated.refaccionesAsignadas).toEqual([]);
    });
  });

  describe('assignService', () => {
    it('asigna un servicio del catálogo a la orden', () => {
      const svc: ServiceCatalogItem = { id: 'srv-1', nombre: 'Afinación', precio: 500 };
      const order = buildOrder({ id: 'WO-1', catalogoServicios: [svc], serviciosAsignados: [] });
      (service as any)._workOrders.set([order]);

      service.assignService('WO-1', 'srv-1');

      const updated = service.getById('WO-1')!;
      expect(updated.serviciosAsignados).toEqual([{ id: 'srv-1', nombre: 'Afinación', precio: 500 }]);
    });

    it('no duplica un servicio ya asignado', () => {
      const svc: ServiceCatalogItem = { id: 'srv-1', nombre: 'Afinación', precio: 500 };
      const order = buildOrder({
        id: 'WO-1',
        catalogoServicios: [svc],
        serviciosAsignados: [{ id: 'srv-1', nombre: 'Afinación', precio: 500 }],
      });
      (service as any)._workOrders.set([order]);

      service.assignService('WO-1', 'srv-1');

      const updated = service.getById('WO-1')!;
      expect(updated.serviciosAsignados).toHaveLength(1);
    });

    it('no hace nada si el servicio no existe en el catálogo', () => {
      const order = buildOrder({ id: 'WO-1', catalogoServicios: [], serviciosAsignados: [] });
      (service as any)._workOrders.set([order]);

      service.assignService('WO-1', 'no-existe');

      expect(service.getById('WO-1')!.serviciosAsignados).toEqual([]);
    });
  });

  describe('createWorkOrder', () => {
    it('genera un nuevo id incremental basado en las órdenes existentes y navega con el id real', () => {
      (service as any)._workOrders.set([buildOrder({ id: 'WO-1005' })]);

      let createdOrder: WorkOrder | undefined;
      service.createWorkOrder(undefined, (order) => { createdOrder = order; });

      // Confirma el POST que dispara internamente
      const req = httpMock.expectOne('/api/v1/work-orders');
      expect(req.request.method).toBe('POST');
      req.flush({
        data: {
          id: 'WO-1006',
          status: 'Agendado',
          priority: 'Media',
          tipo_vehiculo: 'Auto',
          problema: 'Pendiente de captura',
          fecha_ingreso: '2026-06-09',
          fecha_programada: '2026-06-09',
          cargo_generado: false,
          cliente: null,
          vehiculo: null,
          tecnico: null,
          diagnostico: '',
          checklists: [],
          fotos: [],
          notas: [],
          partes: [],
          servicios: [],
          timeline: [],
        },
      });

      expect(createdOrder?.id).toBe('WO-1006');
      expect(createdOrder?.status).toBe('Agendado');
      expect(createdOrder?.cargoCuentasPorCobrarGenerado).toBe(false);
      expect(service.getById('WO-1006')).toBeDefined();
    });

    it('usa el código devuelto por el backend al crear la primera orden', () => {
      let createdOrder: WorkOrder | undefined;
      service.createWorkOrder(undefined, (order) => { createdOrder = order; });

      httpMock.expectOne('/api/v1/work-orders').flush({
        data: {
          id: 'WO-0001', status: 'Agendado', priority: 'Media', tipo_vehiculo: 'Auto',
          problema: '', fecha_ingreso: '2026-06-09', fecha_programada: '2026-06-09',
          cargo_generado: false, cliente: null, vehiculo: null, tecnico: null,
          diagnostico: '', checklists: [], fotos: [], notas: [], partes: [], servicios: [], timeline: [],
        },
      });

      expect(createdOrder?.id).toBe('WO-0001');
      expect(service.getById('WO-0001')).toBeDefined();
    });
  });

  describe('deleteWorkOrder', () => {
    it('elimina una orden existente y llama al API', () => {
      (service as any)._workOrders.set([buildOrder({ id: 'WO-1' })]);

      const result = service.deleteWorkOrder('WO-1');

      expect(result).toBe(true);
      expect(service.getById('WO-1')).toBeUndefined();

      const req = httpMock.expectOne('/api/v1/work-orders/WO-1');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('retorna false si la orden no existe', () => {
      const result = service.deleteWorkOrder('no-existe');
      expect(result).toBe(false);
    });
  });
});

function buildOrder(overrides: Partial<WorkOrder> = {}): WorkOrder {
  return {
    id: 'WO-1000',
    code: 'OT-1000',
    cliente: 'Cliente Test',
    tecnico: 'Tecnico Test',
    fechaIngreso: '2026-06-01',
    fechaProgramada: '2026-06-02',
    status: 'Agendado',
    priority: 'Media',
    vehicle: { marca: 'Nissan', modelo: 'Sentra', anio: 2020, placas: 'ABC-123', vin: 'VIN123', kilometraje: 1000 },
    tipoVehiculo: 'Auto',
    problema: 'Problema test',
    diagnostico: '',
    fotosIngreso: [],
    checklistInicial: [],
    checklistTrabajo: [],
    timeline: [],
    catalogoRefacciones: [],
    refaccionesAsignadas: [],
    catalogoServicios: [],
    serviciosAsignados: [],
    cargoCuentasPorCobrarGenerado: false,
    notasInternas: [],
    notasCliente: [],
    clientData: { nombre: 'Cliente Test', telefono: '', correo: '' },
    ...overrides,
  };
}
