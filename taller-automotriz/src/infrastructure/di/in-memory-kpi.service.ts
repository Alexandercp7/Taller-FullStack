import { createId } from '../../shared/identifier';

type RoleType =
  | 'Líder Admin'
  | 'Director General'
  | 'Asesor de Servicio'
  | 'Líder Técnico'
  | 'Técnico Automotriz'
  | 'Personal de Apoyo';

type ActivityStatus = 'Pendiente' | 'En Proceso' | 'Completada' | 'Cancelada';
type Priority = 'Baja' | 'Normal' | 'Alta';

interface Employee {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  role: RoleType;
  fotoUrl: string;
  activo: boolean;
}

interface KpiObjective {
  id: string;
  nombre: string;
  descripcion: string;
  roleResponsable: RoleType;
  meta: number;
  progreso: number;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
}

interface KpiActivity {
  id: string;
  titulo: string;
  descripcion: string;
  roleAsignado: RoleType;
  status: ActivityStatus;
  tags: string[];
  empleadoAsignado?: string;
  fechaCreacion: string;
  fechaVencimiento?: string;
  prioridad: Priority;
}

interface OrgInfo {
  id: string;
  mision: string;
  vision: string;
  valores: string[];
}

export class InMemoryKpiService {
  private employees: Employee[] = [];
  private kpis: KpiObjective[] = [];
  private activities: KpiActivity[] = [];
  private org: OrgInfo = { id: 'org-1', mision: '', vision: '', valores: [] };

  // Employees
  listEmployees() { return [...this.employees]; }
  getEmployee(id: string) { return this.employees.find(e => e.id === id) ?? null; }
  createEmployee(input: Omit<Employee, 'id' | 'activo'>): Employee {
    const emp: Employee = { ...input, id: createId(), activo: true };
    this.employees.push(emp);
    return emp;
  }
  updateEmployee(id: string, updates: Partial<Omit<Employee, 'id'>>): Employee | null {
    const idx = this.employees.findIndex(e => e.id === id);
    if (idx === -1) return null;
    this.employees[idx] = { ...this.employees[idx], ...updates };
    return this.employees[idx];
  }
  deleteEmployee(id: string): boolean {
    const len = this.employees.length;
    this.employees = this.employees.filter(e => e.id !== id);
    return this.employees.length < len;
  }

  // KPI Objectives
  listKpis() { return [...this.kpis]; }
  getKpi(id: string) { return this.kpis.find(k => k.id === id) ?? null; }
  createKpi(input: Omit<KpiObjective, 'id' | 'activo'>): KpiObjective {
    const kpi: KpiObjective = { ...input, id: createId(), activo: true };
    this.kpis.push(kpi);
    return kpi;
  }
  updateKpi(id: string, updates: Partial<Omit<KpiObjective, 'id'>>): KpiObjective | null {
    const idx = this.kpis.findIndex(k => k.id === id);
    if (idx === -1) return null;
    this.kpis[idx] = { ...this.kpis[idx], ...updates };
    return this.kpis[idx];
  }
  deleteKpi(id: string): boolean {
    const len = this.kpis.length;
    this.kpis = this.kpis.filter(k => k.id !== id);
    return this.kpis.length < len;
  }

  // KPI Activities
  listActivities() { return [...this.activities]; }
  getActivity(id: string) { return this.activities.find(a => a.id === id) ?? null; }
  createActivity(input: Omit<KpiActivity, 'id' | 'status' | 'fechaCreacion'>): KpiActivity {
    const act: KpiActivity = {
      ...input,
      id: createId(),
      status: 'Pendiente',
      fechaCreacion: new Date().toISOString().split('T')[0],
    };
    this.activities.push(act);
    return act;
  }
  updateActivity(id: string, updates: Partial<Omit<KpiActivity, 'id'>>): KpiActivity | null {
    const idx = this.activities.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.activities[idx] = { ...this.activities[idx], ...updates };
    return this.activities[idx];
  }
  deleteActivity(id: string): boolean {
    const len = this.activities.length;
    this.activities = this.activities.filter(a => a.id !== id);
    return this.activities.length < len;
  }

  // Organization
  getOrg() { return { ...this.org }; }
  updateOrg(updates: Partial<Omit<OrgInfo, 'id'>>): OrgInfo {
    this.org = { ...this.org, ...updates };
    return { ...this.org };
  }
}
