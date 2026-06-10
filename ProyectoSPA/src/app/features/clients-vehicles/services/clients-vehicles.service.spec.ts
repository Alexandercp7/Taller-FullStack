import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ClientsVehiclesService } from './clients-vehicles.service';

describe('ClientsVehiclesService', () => {
  let service: ClientsVehiclesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ClientsVehiclesService);
    httpMock = TestBed.inject(HttpTestingController);

    const req = httpMock.expectOne('/api/v1/clients?per_page=100');
    req.flush({
      data: [
        { id: 1, nombre: 'Juan Pérez', telefono: '555-0001', correo: 'juan@example.com', rfc: 'JUPJ800101', tag: 'Frecuente', total_ots: 3, total_vehiculos: 2 },
      ],
      meta: { last_page: 1 },
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('carga y mapea la lista inicial de clientes', () => {
    const clients = service.clients();
    expect(clients).toHaveLength(1);
    expect(clients[0]).toEqual({
      id: '1', nombre: 'Juan Pérez', telefono: '555-0001', correo: 'juan@example.com',
      rfc: 'JUPJ800101', tag: 'Frecuente', workOrderCount: 3, vehicleCount: 2, placas: [],
    });
  });

  it('aplica valores por defecto cuando faltan campos opcionales', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const freshService = TestBed.inject(ClientsVehiclesService);
    const freshHttp = TestBed.inject(HttpTestingController);

    freshHttp.expectOne('/api/v1/clients?per_page=100').flush({
      data: [{ id: 2, nombre: 'Sin datos', telefono: null, correo: null, rfc: null, tag: null, total_ots: 0, total_vehiculos: 0 }],
      meta: { last_page: 1 },
    });

    const client = freshService.clients()[0];
    expect(client.telefono).toBe('-');
    expect(client.correo).toBe('-');
    expect(client.rfc).toBe('RFC pendiente');
    expect(client.tag).toBe('Nuevo');

    freshHttp.verify();
  });

  describe('createClient', () => {
    it('agrega el cliente creado al inicio de la lista al recibir la respuesta', () => {
      service.createClient({ nombre: 'Nuevo Cliente', telefono: '555-9999', correo: 'nuevo@example.com', rfc: '', tag: 'Nuevo' } as any);

      const req = httpMock.expectOne('/api/v1/clients');
      expect(req.request.method).toBe('POST');
      req.flush({
        data: { id: 5, nombre: 'Nuevo Cliente', telefono: '555-9999', correo: 'nuevo@example.com', rfc: 'RFC pendiente', tag: 'Nuevo', total_ots: 0, total_vehiculos: 0 },
      });

      const clients = service.clients();
      expect(clients).toHaveLength(2);
      expect(clients[0].nombre).toBe('Nuevo Cliente');
    });
  });

  describe('updateClient', () => {
    it('actualiza optimistamente y luego con la respuesta del servidor', () => {
      service.updateClient('1', { nombre: 'Juan Pérez Editado' } as any);

      // Actualización optimista
      expect(service.clients()[0].nombre).toBe('Juan Pérez Editado');

      const req = httpMock.expectOne('/api/v1/clients/1');
      expect(req.request.method).toBe('PUT');
      req.flush({
        data: { id: 1, nombre: 'Juan Pérez Editado', telefono: '555-0001', correo: 'juan@example.com', rfc: 'JUPJ800101', tag: 'Frecuente', total_ots: 3, total_vehiculos: 2 },
      });

      expect(service.clients()[0].nombre).toBe('Juan Pérez Editado');
    });
  });

  describe('canDeleteClient', () => {
    it('permite eliminar un cliente existente', () => {
      expect(service.canDeleteClient('1')).toEqual({ canDelete: true });
    });

    it('no permite eliminar un cliente inexistente', () => {
      expect(service.canDeleteClient('no-existe')).toEqual({ canDelete: false, reason: 'Cliente no encontrado.' });
    });
  });

  describe('deleteClient', () => {
    it('elimina el cliente de forma optimista y confirma con el servidor', () => {
      const result = service.deleteClient('1');

      expect(result).toEqual({ deleted: true });
      expect(service.clients()).toHaveLength(0);

      const req = httpMock.expectOne('/api/v1/clients/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'ok' });
    });

    it('restaura el cliente si el servidor responde con error', () => {
      service.deleteClient('1');
      expect(service.clients()).toHaveLength(0);

      const req = httpMock.expectOne('/api/v1/clients/1');
      req.flush({ message: 'No se puede eliminar' }, { status: 400, statusText: 'Bad Request' });

      expect(service.clients()).toHaveLength(1);
      expect(service.clients()[0].id).toBe('1');
    });

    it('retorna deleted=false si el cliente no existe', () => {
      const result = service.deleteClient('no-existe');
      expect(result).toEqual({ deleted: false, reason: 'Cliente no encontrado.' });
    });
  });

  describe('getClientById', () => {
    it('retorna el detalle básico de un cliente cargado en la lista', () => {
      const detail = service.getClientById('1');
      expect(detail).toEqual({
        id: '1', nombre: 'Juan Pérez', telefono: '555-0001', correo: 'juan@example.com',
        rfc: 'JUPJ800101', tag: 'Frecuente', workOrders: [], vehicles: [],
      });
    });

    it('retorna undefined si el cliente no existe', () => {
      expect(service.getClientById('no-existe')).toBeUndefined();
    });
  });

  describe('loadClientDetail', () => {
    it('mapea vehículos y órdenes de trabajo del detalle', () => {
      const callback = vi.fn();
      service.loadClientDetail('1', callback);

      const req = httpMock.expectOne('/api/v1/clients/1');
      req.flush({
        data: {
          id: 1, nombre: 'Juan Pérez', telefono: '555-0001', correo: 'juan@example.com', rfc: 'JUPJ800101', tag: 'Frecuente',
          total_ots: 3, total_vehiculos: 2,
          vehicles: [{ id: 10, marca: 'Nissan', modelo: 'Sentra', anio: 2020, placas: 'ABC-123', vin: 'VIN1', services: ['Afinación'], workOrderIds: [100] }],
          workOrders: [{
            id: 'WO-100', code: 'OT-0100', status: 'En Proceso', priority: 'Alta', fecha_programada: '2026-06-10',
            tecnico: { name: 'Pedro' }, vehiculo: { marca: 'Nissan', modelo: 'Sentra', anio: 2020, placas: 'ABC-123' },
            paymentState: 'Pendiente',
          }],
        },
      });

      expect(callback).toHaveBeenCalledTimes(1);
      const detail = callback.mock.calls[0][0];
      expect(detail.vehicles).toEqual([
        { id: '10', marca: 'Nissan', modelo: 'Sentra', anio: 2020, placas: 'ABC-123', vin: 'VIN1', services: ['Afinación'], workOrderIds: ['100'] },
      ]);
      expect(detail.workOrders[0]).toMatchObject({
        id: 'WO-100', tecnico: 'Pedro', vehiculo: 'Nissan Sentra 2020', placas: 'ABC-123', paymentState: 'Pendiente',
      });
    });
  });
});
