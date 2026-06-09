import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import type {
  Activity, ActivityTag, CreateActivityInput, CreateEmployeeInput,
  CreateKPIInput, CreateTagInput, Employee, KPI, OrganizationInfo, RoleType,
} from '../models';

interface EmployeeApi {
  id: number; nombre: string; apellido: string; email: string;
  telefono: string; role: string; foto_url: string | null; activo: boolean;
}
interface KpiApi {
  id: number; nombre: string; descripcion: string; role_responsable: string;
  meta: number; periodo: string; fecha_inicio: string; fecha_fin: string; progreso: number;
}
interface KpiActivityApi {
  id: number; titulo: string; descripcion: string; role_asignado: string;
  status: string; prioridad: string; fecha_vencimiento: string | null;
  tags?: string[]; empleado_id?: number;
}
interface OrgApi { id: number; mision: string; vision: string; valores: string[] }

@Injectable({ providedIn: 'root' })
export class KpisService {
  private readonly _http = inject(HttpClient);

  private readonly _employees = signal<Employee[]>([]);
  private readonly _kpis = signal<KPI[]>([]);
  private readonly _activities = signal<Activity[]>([]);
  private readonly _tags = signal<ActivityTag[]>([]);
  private readonly _organizationInfo = signal<OrganizationInfo>({ id: '', mision: '', vision: '', valores: [] });

  public readonly employees = this._employees.asReadonly();
  public readonly kpis = this._kpis.asReadonly();
  public readonly activities = this._activities.asReadonly();
  public readonly tags = this._tags.asReadonly();
  public readonly organizationInfo = this._organizationInfo.asReadonly();

  constructor() {
    this.loadEmployees();
    this.loadKpis();
    this.loadActivities();
    this.loadOrganization();
  }

  private loadEmployees(): void {
    this._http.get<{ data: EmployeeApi[] }>('/api/v1/employees').subscribe({
      next: (res) => this._employees.set(res.data.map(e => ({
        id: String(e.id), nombre: e.nombre, apellido: e.apellido,
        email: e.email, telefono: e.telefono ?? '',
        role: e.role as RoleType, fotoUrl: e.foto_url ?? '',
        fechaIngreso: '', activo: e.activo,
      }))),
    });
  }

  private loadKpis(): void {
    this._http.get<{ data: KpiApi[] }>('/api/v1/kpis').subscribe({
      next: (res) => this._kpis.set(res.data.map(k => ({
        id: String(k.id), nombre: k.nombre, descripcion: k.descripcion ?? '',
        roleResponsable: k.role_responsable as RoleType,
        meta: k.meta, progreso: k.progreso ?? 0,
        periodo: k.periodo, fechaInicio: k.fecha_inicio, fechaFin: k.fecha_fin, activo: true,
      }))),
    });
  }

  private loadActivities(): void {
    this._http.get<{ data: KpiActivityApi[] }>('/api/v1/kpi-activities').subscribe({
      next: (res) => this._activities.set(res.data.map(a => ({
        id: String(a.id), titulo: a.titulo, descripcion: a.descripcion ?? '',
        roleAsignado: a.role_asignado as RoleType,
        status: a.status as Activity['status'],
        tags: a.tags ?? [], prioridad: (a.prioridad ?? 'Normal') as Activity['prioridad'],
        fechaCreacion: '', fechaVencimiento: a.fecha_vencimiento ?? undefined,
      }))),
    });
  }

  private loadOrganization(): void {
    this._http.get<{ data: OrgApi }>('/api/v1/organization').subscribe({
      next: (res) => this._organizationInfo.set({
        id: String(res.data.id),
        mision: res.data.mision ?? '',
        vision: res.data.vision ?? '',
        valores: res.data.valores ?? [],
      }),
    });
  }

  public readonly employeesByRole = computed(() => {
    const emps = this._employees();
    const roles: RoleType[] = ['Líder Admin','Director General','Asesor de Servicio','Líder Técnico','Técnico Automotriz','Personal de Apoyo'];
    return roles.map(role => ({ role, employees: emps.filter(e => e.role === role) }));
  });

  public readonly activitiesByRole = computed(() => {
    const acts = this._activities();
    const roles: RoleType[] = ['Líder Admin','Director General','Asesor de Servicio','Líder Técnico','Técnico Automotriz','Personal de Apoyo'];
    return roles.map(role => ({ role, activities: acts.filter(a => a.roleAsignado === role) }));
  });

  public readonly activitiesByTag = computed(() =>
    this._tags().map(tag => ({ tag, activities: this._activities().filter(a => a.tags.includes(tag.id)) }))
  );

  public readonly activitiesByStatus = computed(() => {
    const acts = this._activities();
    const statuses = ['Pendiente','En Proceso','Completada','Cancelada'] as const;
    return statuses.map(status => ({ status, activities: acts.filter(a => a.status === status) }));
  });

  public readonly kpisWithCalculatedProgress = computed(() =>
    this._kpis().map(kpi => {
      const roleActs = this._activities().filter(a => a.roleAsignado === kpi.roleResponsable);
      const completed = roleActs.filter(a => a.status === 'Completada');
      const calculatedProgress = roleActs.length > 0 ? Math.round((completed.length / roleActs.length) * 100) : 0;
      return { ...kpi, calculatedProgress, rolActivityCount: roleActs.length, roleCompletedCount: completed.length };
    })
  );

  public createEmployee(input: CreateEmployeeInput): Employee {
    const emp: Employee = { id: `emp-${Date.now()}`, ...input, fechaIngreso: new Date().toISOString().split('T')[0], activo: true };
    this._employees.update(list => [emp, ...list]);
    this._http.post<{ data: EmployeeApi }>('/api/v1/employees', {
      nombre: input.nombre, apellido: input.apellido, email: input.email,
      telefono: input.telefono, role: input.role, foto_url: input.fotoUrl,
    }).subscribe({ next: () => this.loadEmployees() });
    return emp;
  }

  public updateEmployee(id: string, updates: Partial<Employee>): boolean {
    const found = this._employees().find(e => e.id === id);
    if (!found) return false;
    this._employees.update(list => list.map(e => e.id === id ? { ...e, ...updates } : e));
    this._http.put(`/api/v1/employees/${id}`, updates).subscribe();
    return true;
  }

  public deleteEmployee(id: string): boolean {
    const initial = this._employees().length;
    this._employees.update(list => list.filter(e => e.id !== id));
    this._http.delete(`/api/v1/employees/${id}`).subscribe();
    return this._employees().length < initial;
  }

  public createKPI(input: CreateKPIInput): KPI {
    const kpi: KPI = { id: `kpi-${Date.now()}`, ...input, activo: true };
    this._kpis.update(list => [kpi, ...list]);
    this._http.post<{ data: KpiApi }>('/api/v1/kpis', {
      nombre: input.nombre, role_responsable: input.roleResponsable,
      meta: input.meta, periodo: input.periodo,
      fecha_inicio: input.fechaInicio, fecha_fin: input.fechaFin,
    }).subscribe({ next: () => this.loadKpis() });
    return kpi;
  }

  public updateKPI(id: string, updates: Partial<KPI>): boolean {
    const found = this._kpis().find(k => k.id === id);
    if (!found) return false;
    this._kpis.update(list => list.map(k => k.id === id ? { ...k, ...updates } : k));
    this._http.put(`/api/v1/kpis/${id}`, updates).subscribe();
    return true;
  }

  public updateKPIProgress(id: string, progreso: number): boolean {
    return this.updateKPI(id, { progreso: Math.min(100, Math.max(0, progreso)) });
  }

  public deleteKPI(id: string): boolean {
    const initial = this._kpis().length;
    this._kpis.update(list => list.filter(k => k.id !== id));
    return this._kpis().length < initial;
  }

  public createActivity(input: CreateActivityInput): Activity {
    const act: Activity = {
      id: `act-${Date.now()}`, titulo: input.titulo, descripcion: input.descripcion,
      roleAsignado: input.roleAsignado, status: 'Pendiente', tags: input.tags,
      empleadoAsignado: input.empleadoAsignado,
      fechaCreacion: new Date().toISOString().split('T')[0],
      fechaVencimiento: input.fechaVencimiento, prioridad: input.prioridad,
    };
    this._activities.update(list => [act, ...list]);
    this._http.post<{ data: KpiActivityApi }>('/api/v1/kpi-activities', {
      titulo: input.titulo, role_asignado: input.roleAsignado,
      prioridad: input.prioridad, fecha_vencimiento: input.fechaVencimiento,
    }).subscribe({ next: () => this.loadActivities() });
    return act;
  }

  public updateActivity(id: string, updates: Partial<Activity>): boolean {
    const found = this._activities().find(a => a.id === id);
    if (!found) return false;
    this._activities.update(list => list.map(a => a.id === id ? { ...a, ...updates } : a));
    this._http.put(`/api/v1/kpi-activities/${id}`, updates).subscribe();
    return true;
  }

  public updateActivityStatus(id: string, status: Activity['status']): boolean { return this.updateActivity(id, { status }); }
  public updateActivityRole(id: string, roleAsignado: RoleType): boolean { return this.updateActivity(id, { roleAsignado }); }

  public deleteActivity(id: string): boolean {
    const initial = this._activities().length;
    this._activities.update(list => list.filter(a => a.id !== id));
    this._http.delete(`/api/v1/kpi-activities/${id}`).subscribe();
    return this._activities().length < initial;
  }

  public createTag(input: CreateTagInput): ActivityTag {
    const tag: ActivityTag = { id: `tag-${Date.now()}`, nombre: input.nombre, color: input.color };
    this._tags.update(list => [tag, ...list]);
    return tag;
  }

  public updateTag(id: string, updates: Partial<ActivityTag>): boolean {
    const found = this._tags().find(t => t.id === id);
    if (!found) return false;
    this._tags.update(list => list.map(t => t.id === id ? { ...t, ...updates } : t));
    return true;
  }

  public deleteTag(id: string): boolean {
    const initial = this._tags().length;
    this._tags.update(list => list.filter(t => t.id !== id));
    if (this._tags().length < initial) {
      this._activities.update(list => list.map(a => ({ ...a, tags: a.tags.filter(t => t !== id) })));
      return true;
    }
    return false;
  }

  public updateOrganizationInfo(updates: Partial<OrganizationInfo>): boolean {
    this._organizationInfo.update(org => ({ ...org, ...updates }));
    this._http.put('/api/v1/organization', {
      mision: updates.mision, vision: updates.vision, valores: updates.valores,
    }).subscribe();
    return true;
  }

  public getEmployeeById(id: string): Employee | undefined { return this._employees().find(e => e.id === id); }
  public getActivityById(id: string): Activity | undefined { return this._activities().find(a => a.id === id); }
  public getTagById(id: string): ActivityTag | undefined { return this._tags().find(t => t.id === id); }
}
