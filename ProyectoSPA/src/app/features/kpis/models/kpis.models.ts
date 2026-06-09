export type RoleType = 'Líder Admin' | 'Director General' | 'Asesor de Servicio' | 'Líder Técnico' | 'Técnico Automotriz' | 'Personal de Apoyo';
export type ActivityStatus = 'Pendiente' | 'En Proceso' | 'Completada' | 'Cancelada';

export const ROLE_TYPES: RoleType[] = [
	'Líder Admin',
	'Director General',
	'Asesor de Servicio',
	'Líder Técnico',
	'Técnico Automotriz',
	'Personal de Apoyo',
];

export interface Employee {
	id: string;
	nombre: string;
	apellido: string;
	email: string;
	telefono: string;
	role: RoleType;
	fotoUrl: string;
	fechaIngreso: string;
	activo: boolean;
}

export interface OrganizationInfo {
	id: string;
	mision: string;
	vision: string;
	valores: string[];
}

export interface KPI {
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

export interface ActivityTag {
	id: string;
	nombre: string;
	color: string; 
}

export interface Activity {
	id: string;
	titulo: string;
	descripcion: string;
	roleAsignado: RoleType;
	status: ActivityStatus;
	tags: string[]; 
	empleadoAsignado?: string;
	fechaCreacion: string;
	fechaVencimiento?: string;
	prioridad: 'Baja' | 'Normal' | 'Alta';
}

export interface CreateEmployeeInput {
	nombre: string;
	apellido: string;
	email: string;
	telefono: string;
	role: RoleType;
	fotoUrl: string;
}

export interface CreateKPIInput {
	nombre: string;
	descripcion: string;
	roleResponsable: RoleType;
	meta: number;
	progreso: number;
	periodo: string;
	fechaInicio: string;
	fechaFin: string;
}

export interface CreateActivityInput {
	titulo: string;
	descripcion: string;
	roleAsignado: RoleType;
	tags: string[];
	empleadoAsignado?: string;
	fechaVencimiento?: string;
	prioridad: 'Baja' | 'Normal' | 'Alta';
}

export interface CreateTagInput {
	nombre: string;
	color: string;
}
