import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { NotificationService } from '../../../core';
import type {
  ClientDetail, ClientListItem, ClientTag, ClientVehicleHistoryItem,
  ClientWorkOrderHistoryItem, UpsertClientInput,
} from '../models';

interface ClientApi {
  id: number;
  nombre: string;
  telefono: string;
  correo: string;
  rfc: string;
  tag: string;
  total_ots: number;
  total_vehiculos: number;
}

interface ClientDetailApi extends ClientApi {
  vehicles: VehicleApi[];
  workOrders: WoHistoryApi[];
}

interface VehicleApi {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  placas: string;
  vin: string;
  services?: string[];
  workOrderIds?: string[];
}

interface WoHistoryApi {
  id: string;
  code: string;
  status: string;
  priority: string;
  fecha_programada: string;
  tecnico?: { name: string } | null;
  vehiculo?: { marca: string; modelo: string; anio: number; placas: string } | null;
  paymentState?: string;
}

interface Paginated<T> { data: T[]; meta: { last_page: number } }

@Injectable({ providedIn: 'root' })
export class ClientsVehiclesService {
  private readonly _http = inject(HttpClient);
  private readonly _notification = inject(NotificationService);
  private readonly _clients = signal<ClientListItem[]>([]);

  public readonly clients = this._clients.asReadonly();

  constructor() { this.loadAll(); }

  private loadAll(): void {
    this._http.get<Paginated<ClientApi>>('/api/v1/clients?per_page=100').subscribe({
      next: (res) => this._clients.set(res.data.map(this.mapList)),
    });
  }

  private mapList(item: ClientApi): ClientListItem {
    return {
      id: String(item.id),
      nombre: item.nombre,
      telefono: item.telefono ?? '-',
      correo: item.correo ?? '-',
      rfc: item.rfc ?? 'RFC pendiente',
      tag: (item.tag ?? 'Nuevo') as ClientTag,
      workOrderCount: item.total_ots ?? 0,
      vehicleCount: item.total_vehiculos ?? 0,
      placas: [],
    };
  }

  public createClient(payload: UpsertClientInput): string {
    this._http.post<{ data: ClientApi }>('/api/v1/clients', payload).subscribe({
      next: (res) => this._clients.update(list => [this.mapList(res.data), ...list]),
    });
    return '';
  }

  public updateClient(clientId: string, payload: UpsertClientInput): string {
    this._clients.update(list => list.map(c =>
      c.id === clientId ? { ...c, ...payload } : c
    ));
    this._http.put<{ data: ClientApi }>(`/api/v1/clients/${clientId}`, payload).subscribe({
      next: (res) => this._clients.update(list => list.map(c =>
        c.id === clientId ? this.mapList(res.data) : c
      )),
    });
    return clientId;
  }

  public canDeleteClient(clientId: string): { canDelete: boolean; reason?: string } {
    const client = this._clients().find(c => c.id === clientId);
    if (!client) return { canDelete: false, reason: 'Cliente no encontrado.' };
    return { canDelete: true };
  }

  public deleteClient(clientId: string): { deleted: boolean; reason?: string } {
    const backup = this._clients().find(c => c.id === clientId);
    if (!backup) return { deleted: false, reason: 'Cliente no encontrado.' };

    this._clients.update(list => list.filter(c => c.id !== clientId));

    this._http.delete<{ message: string }>(`/api/v1/clients/${clientId}`).subscribe({
      error: (err) => {
        this._clients.update(list => [backup, ...list].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        const msg = err?.error?.message ?? 'No se pudo eliminar el cliente.';
        this._notification.error(msg);
      },
    });

    return { deleted: true };
  }

  public getClientById(id: string): ClientDetail | undefined {
    const client = this._clients().find(c => c.id === id);
    if (!client) return undefined;
    return {
      id: client.id, nombre: client.nombre, telefono: client.telefono,
      correo: client.correo, rfc: client.rfc, tag: client.tag,
      workOrders: [], vehicles: [],
    };
  }

  public loadClientDetail(id: string, callback: (detail: ClientDetail) => void): void {
    this._http.get<{ data: ClientDetailApi }>(`/api/v1/clients/${id}`).subscribe({
      next: (res) => {
        const item = res.data;
        const vehicles: ClientVehicleHistoryItem[] = (item.vehicles ?? []).map(v => ({
          id: String(v.id), marca: v.marca, modelo: v.modelo, anio: v.anio,
          placas: v.placas, vin: v.vin,
          services: v.services ?? [],
          workOrderIds: (v.workOrderIds ?? []).map(String),
        }));
        const workOrders: ClientWorkOrderHistoryItem[] = (item.workOrders ?? []).map(wo => ({
          id: wo.id, code: wo.code, status: wo.status as any, priority: wo.priority as any,
          fechaProgramada: wo.fecha_programada,
          tecnico: wo.tecnico?.name ?? 'Sin asignar',
          vehiculo: wo.vehiculo ? `${wo.vehiculo.marca} ${wo.vehiculo.modelo} ${wo.vehiculo.anio}` : '',
          placas: wo.vehiculo?.placas ?? '',
          paymentState: (wo.paymentState ?? 'Pendiente') as 'Pagado' | 'Pendiente',
        }));
        callback({
          id: String(item.id), nombre: item.nombre, telefono: item.telefono ?? '-',
          correo: item.correo ?? '-', rfc: item.rfc ?? 'RFC pendiente',
          tag: (item.tag ?? 'Nuevo') as ClientTag,
          workOrders, vehicles,
        });
      },
    });
  }
}
