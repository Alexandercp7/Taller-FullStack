import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { AuthService } from '../../../core';
import { InventoryService } from '../../inventory/services';
import type {
  AssignedPartItem, AssignedServiceItem, ChecklistItem, ClientData,
  CreateWorkOrderInput, PartCatalogItem, VehicleData, WorkOrder,
  WorkOrderNote, WorkOrderPriority, WorkOrderStatus,
} from '../models/work-orders.models';

interface WoListApi {
  id: string; code: string; status: string; priority: string; tipo_vehiculo: string;
  problema: string; fecha_ingreso: string; fecha_programada: string;
  cargo_generado: boolean;
  cliente: { id: number; nombre: string; telefono: string; correo: string } | null;
  vehiculo: { id: number; marca: string; modelo: string; anio: number; placas: string; vin: string } | null;
  tecnico: { id: number; name: string } | null;
}

interface WoDetailApi extends WoListApi {
  diagnostico: string;
  checklists: { id: string; tipo: string; tarea: string; responsable: string; responsables?: string[]; responsableId: string | null; responsableIds?: string[]; completada: boolean }[];
  fotos: { id: number; url: string }[];
  notas: { id: number; tipo: string; texto: string; created_at: string; user?: { name: string } }[];
  partes: { id: number; inventory_item_id: number; nombre: string; cantidad: number; costo_unitario: number }[];
  servicios: { id: number; price_item_id: number; nombre: string; precio: number }[];
  timeline: { id: number; descripcion: string; evento: string; detalle: Record<string, unknown> | null; created_at: string; user?: { name: string } }[];
}

interface ClientApi { id: number; nombre: string; telefono: string; correo: string }
interface ClientDirectoryItem { id: string; nombre: string; telefono: string; correo: string }
interface Paginated<T> { data: T[] }

@Injectable({ providedIn: 'root' })
export class WorkOrdersService {
  private readonly _inventoryService = inject(InventoryService);
  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);
  private readonly _workOrders = signal<WorkOrder[]>([]);
  private readonly _listLoaded = signal(false);
  private readonly _clientsDirectory = signal<ClientDirectoryItem[]>([]);

  public readonly workOrders = this._workOrders.asReadonly();
  public readonly listLoaded = this._listLoaded.asReadonly();
  public readonly clientsDirectory = this._clientsDirectory.asReadonly();
  public readonly technicians = computed(() => [...new Set(this._workOrders().map(o => o.tecnico))]);
  public readonly clients = computed(() => [...new Set(this._workOrders().map(o => o.cliente))]);
  public readonly allClients = computed(() => [...new Set([...this._clientsDirectory().map(c => c.nombre), ...this.clients()])].sort((a, b) => a.localeCompare(b)));

  constructor() {
    this.loadAll();
    this.loadClients();
  }

  private loadClients(): void {
    this._http.get<Paginated<ClientApi>>('/api/v1/clients?per_page=500').subscribe({
      next: (res) => this._clientsDirectory.set(res.data.map(c => ({
        id: String(c.id), nombre: c.nombre, telefono: c.telefono, correo: c.correo,
      }))),
    });
  }

  private loadAll(): void {
    this._http.get<Paginated<WoListApi>>('/api/v1/work-orders?per_page=100').subscribe({
      next: (res) => {
        this._workOrders.set(res.data.map(item => this.mapList(item)));
        this._listLoaded.set(true);
      },
      error: () => this._listLoaded.set(true),
    });
  }

  private toDate(iso: string | null): string {
    if (!iso) return new Date().toISOString().split('T')[0];
    return iso.includes('T') ? iso.split('T')[0] : iso;
  }

  private mapList(item: WoListApi): WorkOrder {
    return {
      id: item.id,
      code: item.code ?? item.id,
      cliente: item.cliente?.nombre ?? 'Sin cliente',
      tecnico: item.tecnico?.name ?? 'Sin asignar',
      fechaIngreso: this.toDate(item.fecha_ingreso),
      fechaProgramada: this.toDate(item.fecha_programada),
      status: item.status as WorkOrderStatus,
      priority: item.priority as WorkOrderPriority,
      tipoVehiculo: (item.tipo_vehiculo === 'Camion' ? 'Camión' : (item.tipo_vehiculo ?? 'Auto')) as WorkOrder['tipoVehiculo'],
      problema: item.problema ?? '',
      diagnostico: '',
      vehicle: {
        marca: item.vehiculo?.marca ?? '',
        modelo: item.vehiculo?.modelo ?? '',
        anio: Number(item.vehiculo?.anio ?? 0),
        placas: item.vehiculo?.placas ?? '',
        vin: item.vehiculo?.vin ?? '',
        kilometraje: 0,
      },
      fotosIngreso: [],
      fotos: [],
      checklistInicial: [],
      checklistTrabajo: [],
      timeline: [],
      catalogoRefacciones: [],
      refaccionesAsignadas: [],
      catalogoServicios: [],
      serviciosAsignados: [],
      incluirIvaCotizacion: false,
      cargoCuentasPorCobrarGenerado: item.cargo_generado ?? false,
      notasInternas: [],
      notasCliente: [],
      clientData: {
        nombre: item.cliente?.nombre ?? '',
        telefono: item.cliente?.telefono ?? '',
        correo: item.cliente?.correo ?? '',
      },
    };
  }

  private mapDetail(item: WoDetailApi): WorkOrder {
    const base = this.mapList(item as WoListApi);
    return {
      ...base,
      diagnostico: item.diagnostico ?? '',
      checklistInicial: (item.checklists ?? []).filter(c => c.tipo === 'inicial').map(c => ({
        id: String(c.id),
        tarea: c.tarea,
        responsable: c.responsable ?? '',
        responsables: c.responsables ?? (c.responsable ? [c.responsable] : []),
        responsableId: c.responsableId ?? null,
        responsableIds: c.responsableIds ?? (c.responsableId ? [c.responsableId] : []),
        completada: c.completada,
      })),
      checklistTrabajo: (item.checklists ?? []).filter(c => c.tipo === 'trabajo').map(c => ({
        id: String(c.id),
        tarea: c.tarea,
        responsable: c.responsable ?? '',
        responsables: c.responsables ?? (c.responsable ? [c.responsable] : []),
        responsableId: c.responsableId ?? null,
        responsableIds: c.responsableIds ?? (c.responsableId ? [c.responsableId] : []),
        completada: c.completada,
      })),
      fotosIngreso: (item.fotos ?? []).map(f => f.url),
      fotos: (item.fotos ?? []).map(f => ({ id: String(f.id), url: f.url })),
      timeline: (item.timeline ?? []).map(t => ({
        id: String(t.id), descripcion: t.descripcion, evento: t.evento, detalle: t.detalle,
        timestamp: t.created_at, usuario: t.user?.name ?? 'Sistema',
      })),
      notasInternas: (item.notas ?? []).filter(n => n.tipo === 'interna').map(n => ({
        id: String(n.id), texto: n.texto,
        usuario: n.user?.name ?? 'Sistema', timestamp: n.created_at,
      })),
      notasCliente: (item.notas ?? []).filter(n => n.tipo === 'cliente').map(n => ({
        id: String(n.id), texto: n.texto,
        usuario: n.user?.name ?? 'Sistema', timestamp: n.created_at,
      })),
      refaccionesAsignadas: (item.partes ?? []).map(p => ({
        id: String(p.inventory_item_id), nombre: p.nombre,
        cantidad: p.cantidad, costoUnitario: p.costo_unitario,
      })),
      serviciosAsignados: (item.servicios ?? []).map(s => ({
        id: String(s.price_item_id), nombre: s.nombre, precio: s.precio,
      })),
    };
  }

  public loadDetail(id: string): void {
    this._http.get<{ data: WoDetailApi }>(`/api/v1/work-orders/${id}`).subscribe({
      next: (res) => {
        const detail = this.mapDetail(res.data as WoDetailApi);
        this._workOrders.update(orders => {
          const idx = orders.findIndex(o => o.id === id);
          if (idx === -1) return [detail, ...orders];
          const next = [...orders];
          next[idx] = detail;
          return next;
        });
      },
    });
  }

  public getById(id: string): WorkOrder | undefined {
    return this._workOrders().find(o => o.id === id);
  }

  public createWorkOrder(input: CreateWorkOrderInput | undefined, onCreated: (order: WorkOrder) => void, onError?: () => void): void {
    const nextId = this.buildNextOrderId();
    const nowDate = this.todayDate();
    const payload: CreateWorkOrderInput = {
      cliente: 'Nuevo cliente', telefono: '', correo: '', tecnico: 'Sin asignar',
      fechaProgramada: nowDate, priority: 'Media',
      vehicle: { marca: 'Pendiente', modelo: 'Pendiente', anio: 2026, placas: 'PEND-000', vin: 'PENDIENTE', kilometraje: 0 },
      tipoVehiculo: 'Auto', problema: 'Pendiente de captura', diagnostico: 'Pendiente de diagnostico tecnico',
      ...input,
    };

    const newOrder: WorkOrder = {
      id: nextId, code: 'Generando...', cliente: payload.cliente, tecnico: payload.tecnico,
      fechaIngreso: nowDate, fechaProgramada: payload.fechaProgramada || nowDate,
      status: 'Agendado', priority: payload.priority, vehicle: { ...payload.vehicle },
      tipoVehiculo: payload.tipoVehiculo, problema: payload.problema, diagnostico: payload.diagnostico,
      fotosIngreso: [], fotos: [], checklistInicial: [], checklistTrabajo: [],
      timeline: [this.createTimeline('OT creada', 'Recepcion')],
      catalogoRefacciones: [], refaccionesAsignadas: [], catalogoServicios: [], serviciosAsignados: [],
      incluirIvaCotizacion: false,
      cargoCuentasPorCobrarGenerado: false, notasInternas: [], notasCliente: [],
      clientData: { nombre: payload.cliente, telefono: payload.telefono, correo: payload.correo },
    };

    this._workOrders.update(orders => [newOrder, ...orders]);
    this._http.post<{ data: WoDetailApi }>('/api/v1/work-orders', {
      problema: payload.problema,
      diagnostico: payload.diagnostico,
      tipo_vehiculo: payload.tipoVehiculo === 'Camión' ? 'Camion' : payload.tipoVehiculo,
      priority: payload.priority,
      fecha_ingreso: nowDate,
      fecha_programada: payload.fechaProgramada,
      cliente_nombre: payload.cliente,
      cliente_telefono: payload.telefono || undefined,
      cliente_correo: payload.correo || undefined,
      tecnico_id: payload.tecnicoId || undefined,
      vehiculo_marca: payload.vehicle.marca,
      vehiculo_modelo: payload.vehicle.modelo,
      vehiculo_anio: payload.vehicle.anio,
      vehiculo_placas: payload.vehicle.placas !== 'PEND-000' ? payload.vehicle.placas : undefined,
      vehiculo_vin: payload.vehicle.vin !== 'PENDIENTE' ? payload.vehicle.vin : undefined,
      vehiculo_kilometraje: payload.vehicle.kilometraje,
    }).subscribe({
      next: (res) => {
        const realOrder = this.mapDetail(res.data);
        this._workOrders.update(orders => orders.map(o => o.id === nextId ? realOrder : o));
        onCreated(realOrder);
      },
      error: () => {
        this._workOrders.update(orders => orders.filter(o => o.id !== nextId));
        onError?.();
      },
    });
  }

  public getOrCreatePortalToken(id: string): Observable<string> {
    return this._http
      .post<{ data: { portal_token: string } }>(`/api/v1/work-orders/${id}/portal-token`, {})
      .pipe(map((res) => res.data.portal_token));
  }

  public sendPortalShareEmail(id: string, correo: string): Observable<void> {
    return this._http.post<void>(`/api/v1/work-orders/${id}/portal-share`, { correo });
  }

  public sendWhatsAppNotification(id: string): Observable<{ message: string }> {
    return this._http.post<{ message: string }>(`/api/v1/work-orders/${id}/whatsapp`, {});
  }

  public addClient(_clientName: string): void {}
  public upsertClientDirectory(client: ClientDirectoryItem): void {
    this._clientsDirectory.update(list => {
      const exists = list.some(item => item.id === client.id);
      if (exists) {
        return list.map(item => item.id === client.id ? client : item);
      }
      return [...list, client].sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
  }

  public removeManualClient(_clientName: string): void {}
  public replaceManualClient(_previous: string, _next: string): void {}

  public updateClientNameAcrossOrders(previousName: string, nextClientData: ClientData, _usuario = 'Asesor'): void {
    const prev = previousName.trim().toLowerCase();
    this._workOrders.update(orders =>
      orders.map(o =>
        o.cliente.trim().toLowerCase() === prev
          ? { ...o, cliente: nextClientData.nombre, clientData: nextClientData }
          : o
      )
    );
  }

  public updateClientData(id: string, clientData: ClientData): void {
    this._workOrders.update(orders => orders.map(o =>
      o.id === id ? { ...o, cliente: clientData.nombre, clientData } : o
    ));
    this._http.patch(`/api/v1/work-orders/${id}/client`, {
      nombre: clientData.nombre, telefono: clientData.telefono, correo: clientData.correo,
    }).subscribe();
  }

  public updateVehicleData(id: string, vehicle: VehicleData): void {
    this._workOrders.update(orders => orders.map(o => o.id === id ? { ...o, vehicle } : o));
    this._http.patch(`/api/v1/work-orders/${id}/vehicle`, {
      placas: vehicle.placas, vin: vehicle.vin, marca: vehicle.marca,
      modelo: vehicle.modelo, anio: vehicle.anio, kilometraje_actual: vehicle.kilometraje,
    }).subscribe();
  }

  public updateProblemDiagnosis(id: string, problema: string, diagnostico: string): void {
    this._workOrders.update(orders => orders.map(o => o.id === id ? { ...o, problema, diagnostico } : o));
    this._http.patch(`/api/v1/work-orders/${id}/diagnosis`, { problema, diagnostico }).subscribe();
  }

  public updateAssignedTechnician(id: string, technicianId: string, technicianName: string): void {
    const trimmed = technicianName.trim();
    if (!trimmed || !technicianId) return;
    this._workOrders.update(orders => orders.map(o => o.id === id ? { ...o, tecnico: trimmed } : o));
    this._http.patch(`/api/v1/work-orders/${id}/technician`, { technicianId }).subscribe();
  }

  public updateScheduledDate(id: string, fechaProgramada: string, _usuario = 'Asesor'): void {
    const trimmed = fechaProgramada.trim();
    if (!trimmed) return;
    this._workOrders.update(orders => orders.map(o =>
      o.id === id && o.fechaProgramada !== trimmed ? { ...o, fechaProgramada: trimmed } : o
    ));
  }

  public updateStatus(id: string, status: WorkOrderStatus, _usuario = 'Supervisor'): void {
    this._workOrders.update(orders => orders.map(o => {
      if (o.id !== id || o.status === status) return o;
      const updated = { ...o, status };
      if (status === 'Terminado' && !updated.cargoCuentasPorCobrarGenerado) {
        updated.cargoCuentasPorCobrarGenerado = true;
      }
      return updated;
    }));
    this._http.patch(`/api/v1/work-orders/${id}/status`, { status }).subscribe();
  }

  public updatePriority(id: string, priority: WorkOrderPriority, _usuario = 'Supervisor'): void {
    this._workOrders.update(orders => orders.map(o => o.id === id ? { ...o, priority } : o));
    this._http.patch(`/api/v1/work-orders/${id}/priority`, { priority }).subscribe();
  }

  public toggleChecklist(id: string, listType: 'checklistInicial' | 'checklistTrabajo', itemId: string, _usuario = 'Tecnico'): void {
    this._workOrders.update(orders => orders.map(o => {
      if (o.id !== id) return o;
      const list = o[listType].map(c => c.id === itemId ? { ...c, completada: !c.completada } as ChecklistItem : c);
      return { ...o, [listType]: list };
    }));
    this._http.patch(`/api/v1/work-orders/${id}/checklist/${itemId}`, {}).subscribe();
  }

  public addChecklistItem(id: string, listType: 'checklistInicial' | 'checklistTrabajo', tarea: string, responsableIds: string[], _usuario = 'Supervisor'): void {
    const trimmedTask = tarea.trim();
    if (!trimmedTask) return;

    const tipo = listType === 'checklistInicial' ? 'inicial' : 'trabajo';
    const cleanResponsableIds = [...new Set(responsableIds.filter(Boolean))];
    this._http.post<{ data: { id: string; tarea: string; responsable: string; responsables?: string[]; responsableId: string | null; responsableIds?: string[]; completada: boolean } }>(
      `/api/v1/work-orders/${id}/checklist`,
      { tipo, tarea: trimmedTask, responsableIds: cleanResponsableIds }
    ).subscribe({
      next: (res) => {
        const newItem: ChecklistItem = {
          id: String(res.data.id),
          tarea: res.data.tarea,
          responsable: res.data.responsable,
          responsables: res.data.responsables ?? (res.data.responsable ? [res.data.responsable] : []),
          responsableId: res.data.responsableId,
          responsableIds: res.data.responsableIds ?? (res.data.responsableId ? [res.data.responsableId] : []),
          completada: false,
        };
        this._workOrders.update(orders => orders.map(o =>
          o.id === id ? { ...o, [listType]: [...o[listType], newItem] } : o
        ));
      },
    });
  }

  public updateChecklistItem(
    id: string,
    listType: 'checklistInicial' | 'checklistTrabajo',
    itemId: string,
    payload: { tarea: string; responsableIds: string[] },
  ): void {
    const trimmedTask = payload.tarea.trim();
    const cleanResponsableIds = [...new Set(payload.responsableIds.filter(Boolean))];
    if (!trimmedTask) return;

    this._workOrders.update(orders => orders.map(o => {
      if (o.id !== id) return o;
      const list = o[listType].map(item =>
        item.id === itemId
          ? { ...item, tarea: trimmedTask, responsableIds: cleanResponsableIds }
          : item
      );
      return { ...o, [listType]: list };
    }));

    this._http.patch<{ data: { id: string; tarea: string; responsable: string; responsables?: string[]; responsableId: string | null; responsableIds?: string[]; completada: boolean } }>(
      `/api/v1/work-orders/${id}/checklist/${itemId}`,
      { tarea: trimmedTask, responsableIds: cleanResponsableIds }
    ).subscribe({
      next: (res) => {
        this._workOrders.update(orders => orders.map(o => {
          if (o.id !== id) return o;
          const list = o[listType].map(item =>
            item.id === itemId
              ? {
                  ...item,
                  tarea: res.data.tarea,
                  responsable: res.data.responsable,
                  responsables: res.data.responsables ?? (res.data.responsable ? [res.data.responsable] : []),
                  responsableId: res.data.responsableId,
                  responsableIds: res.data.responsableIds ?? (res.data.responsableId ? [res.data.responsableId] : []),
                  completada: res.data.completada,
                }
              : item
          );
          return { ...o, [listType]: list };
        }));
      },
    });
  }

  public addPhoto(id: string, photo: string, _usuario = 'Recepcion'): void {
    const trimmed = photo.trim();
    if (!trimmed) return;
    this._workOrders.update(orders => orders.map(o =>
      o.id === id ? { ...o, fotosIngreso: [...o.fotosIngreso, trimmed] } : o
    ));
  }

  public uploadPhoto(id: string, file: File): void {
    const formData = new FormData();
    formData.append('file', file);
    this._http.post<{ data: { id: string; url: string } }>(`/api/v1/work-orders/${id}/photos`, formData).subscribe({
      next: (res) => {
        this._workOrders.update(orders => orders.map(o =>
          o.id === id ? { ...o, fotosIngreso: [...o.fotosIngreso, res.data.url] } : o
        ));
      },
    });
  }

  public assignPart(id: string, partId: string, usuario = 'Almacen'): void {
    this._workOrders.update(orders => orders.map(o => {
      if (o.id !== id) return o;
      const part = o.catalogoRefacciones.find(p => p.id === partId);
      if (!part || part.stock <= 0) return o;
      const catalog = o.catalogoRefacciones.map(p => p.id === partId ? { ...p, stock: p.stock - 1 } : p);
      const assigned = this.mergeAssignedPart(o.refaccionesAsignadas, part);
      this._inventoryService.consumeForWorkOrder(part.id, id, usuario);
      return { ...o, catalogoRefacciones: catalog, refaccionesAsignadas: assigned };
    }));
  }

  public assignService(id: string, serviceId: string, _usuario = 'Asesor'): void {
    this._workOrders.update(orders => orders.map(o => {
      if (o.id !== id) return o;
      const service = o.catalogoServicios.find(s => s.id === serviceId);
      if (!service || o.serviciosAsignados.some(s => s.id === service.id)) return o;
      const assignedService: AssignedServiceItem = { id: service.id, nombre: service.nombre, precio: service.precio };
      return { ...o, serviciosAsignados: [...o.serviciosAsignados, assignedService] };
    }));
  }

  public assignDirectService(id: string, service: any, _usuario = 'Asesor'): void {
    this._workOrders.update(orders => orders.map(o => {
      if (o.id !== id || o.serviciosAsignados.some(s => s.id === service.id)) return o;
      const assignedService: AssignedServiceItem = {
        id: service.id, nombre: service.nombre, precio: service.precio,
        precioAuto: service.precioAuto, precioCamioneta: service.precioCamioneta, precioCamion: service.precioCamion,
      };
      return { ...o, serviciosAsignados: [...o.serviciosAsignados, assignedService] };
    }));
    this._http.post(`/api/v1/work-orders/${id}/services`, { price_item_id: service.id, precio: service.precio }).subscribe();
  }

  public assignDirectPart(id: string, part: any, usuario = 'Almacen'): void {
    this._workOrders.update(orders => orders.map(o => {
      if (o.id !== id) return o;
      const salePrice = typeof part.precioVenta === 'number' ? part.precioVenta : 0;
      const catalogItem: PartCatalogItem = {
        id: part.id, nombre: part.nombre, sku: part.id,
        stock: part.stockActual || 1, costo: salePrice,
      };
      const assigned = this.mergeAssignedPart(o.refaccionesAsignadas, catalogItem);
      this._inventoryService.consumeForWorkOrder(part.id, id, usuario);
      return { ...o, refaccionesAsignadas: assigned };
    }));
    this._http.post(`/api/v1/work-orders/${id}/parts`, { inventory_item_id: part.id, cantidad: 1 }).subscribe();
  }

  public updateQuoteTaxPreference(id: string, incluirIvaCotizacion: boolean): void {
    this._workOrders.update(orders => orders.map(o =>
      o.id === id ? { ...o, incluirIvaCotizacion } : o
    ));
  }

  public addInternalNote(id: string, texto: string, usuario = this._auth.currentUser()?.name ?? 'Sistema'): void {
    this.addNote(id, 'notasInternas', texto, usuario, 'interna');
  }

  public addCustomerNote(id: string, texto: string, usuario = this._auth.currentUser()?.name ?? 'Sistema'): void {
    this.addNote(id, 'notasCliente', texto, usuario, 'cliente');
  }

  public registerClientSignature(id: string, nombreCliente: string): void {
    const trimmed = nombreCliente.trim();
    if (!trimmed) return;
    this._workOrders.update(orders => orders.map(o =>
      o.id === id ? { ...o, firmaCliente: { nombreCliente: trimmed, timestamp: this.timestampNow() } } : o
    ));
  }

  public deleteWorkOrder(id: string): boolean {
    let deleted = false;
    this._workOrders.update(orders => {
      const filtered = orders.filter(o => o.id !== id);
      deleted = filtered.length !== orders.length;
      return filtered;
    });
    if (deleted) this._http.delete(`/api/v1/work-orders/${id}`, { body: { confirm_id: id } }).subscribe();
    return deleted;
  }

  private addNote(id: string, type: 'notasInternas' | 'notasCliente', texto: string, usuario: string, apiTipo: string): void {
    const trimmed = texto.trim();
    if (!trimmed) return;
    const note: WorkOrderNote = { id: `${type}-${Date.now()}`, texto: trimmed, usuario, timestamp: this.timestampNow() };
    this._workOrders.update(orders => orders.map(o =>
      o.id === id ? { ...o, [type]: [note, ...o[type]] } : o
    ));
    this._http.post(`/api/v1/work-orders/${id}/notes`, { tipo: apiTipo, texto: trimmed }).subscribe();
  }

  private mergeAssignedPart(assigned: AssignedPartItem[], part: { id: string; nombre: string; costo: number }): AssignedPartItem[] {
    const existing = assigned.find(i => i.id === part.id);
    if (!existing) return [...assigned, { id: part.id, nombre: part.nombre, cantidad: 1, costoUnitario: part.costo }];
    return assigned.map(i => i.id === part.id ? { ...i, cantidad: i.cantidad + 1 } : i);
  }

  private buildNextOrderId(): string {
    const maxId = this._workOrders()
      .map(o => Number(o.id.replace('WO-', '')))
      .filter(v => !Number.isNaN(v))
      .reduce((max, cur) => cur > max ? cur : max, 1000);
    return `WO-${maxId + 1}`;
  }

  private createTimeline(descripcion: string, usuario: string) {
    return { id: `tl-${Date.now()}`, descripcion, evento: 'order_created', detalle: null, timestamp: this.timestampNow(), usuario };
  }

  private timestampNow(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  private todayDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}
