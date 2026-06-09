export type WorkOrderStatus =
	| 'Agendado'
	| 'En Espera'
	| 'En Proceso'
	| 'Terminado'
	| 'En Garantia'
	| 'Rezagado'
	| 'Entregado';

export type WorkOrderPriority = 'Baja' | 'Media' | 'Alta';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';

export interface VehicleData {
	marca: string;
	modelo: string;
	anio: number;
	placas: string;
	vin: string;
	kilometraje: number;
}

export interface ClientData {
	nombre: string;
	telefono: string;
	correo: string;
}

export interface ChecklistItem {
	id: string;
	tarea: string;
	responsable: string;
	completada: boolean;
}

export interface TimelineEvent {
	id: string;
	descripcion: string;
	timestamp: string;
	usuario: string;
}

export interface PartCatalogItem {
	id: string;
	nombre: string;
	sku: string;
	stock: number;
	costo: number;
}

export interface AssignedPartItem {
	id: string;
	nombre: string;
	cantidad: number;
	costoUnitario: number;
}

export interface ServiceCatalogItem {
	id: string;
	nombre: string;
	precio: number;
	precioAuto?: number;
	precioCamioneta?: number;
	precioCamion?: number;
}

export interface AssignedServiceItem {
	id: string;
	nombre: string;
	precio: number;
	precioAuto?: number;
	precioCamioneta?: number;
	precioCamion?: number;
}

export interface WorkOrderNote {
	id: string;
	texto: string;
	usuario: string;
	timestamp: string;
}

export interface ClientSignature {
	nombreCliente: string;
	timestamp: string;
}

export interface WorkOrder {
	id: string;
	cliente: string;
	tecnico: string;
	fechaIngreso: string;
	fechaProgramada: string;
	status: WorkOrderStatus;
	priority: WorkOrderPriority;
	vehicle: VehicleData;
	tipoVehiculo: 'Auto' | 'Camioneta' | 'Camión';
	problema: string;
	diagnostico: string;
	fotosIngreso: string[];
	checklistInicial: ChecklistItem[];
	checklistTrabajo: ChecklistItem[];
	timeline: TimelineEvent[];
	catalogoRefacciones: PartCatalogItem[];
	refaccionesAsignadas: AssignedPartItem[];
	catalogoServicios: ServiceCatalogItem[];
	serviciosAsignados: AssignedServiceItem[];
	cargoCuentasPorCobrarGenerado: boolean;
	firmaCliente?: ClientSignature;
	notasInternas: WorkOrderNote[];
	notasCliente: WorkOrderNote[];
	clientData: ClientData;
}

export interface CreateWorkOrderInput {
	cliente: string;
	telefono: string;
	correo: string;
	tecnico: string;
	fechaProgramada: string;
	priority: WorkOrderPriority;
	vehicle: VehicleData;
	tipoVehiculo: 'Auto' | 'Camioneta' | 'Camión';
	problema: string;
	diagnostico: string;
}

export const WORK_ORDER_STATUSES: WorkOrderStatus[] = [
	'Agendado',
	'En Espera',
	'En Proceso',
	'Terminado',
	'En Garantia',
	'Rezagado',
	'Entregado',
];

export const WORK_ORDER_PRIORITIES: WorkOrderPriority[] = ['Baja', 'Media', 'Alta'];

export function workOrderStatusVariant(status: WorkOrderStatus): BadgeVariant {
	switch (status) {
		case 'Terminado':
		case 'Entregado':
			return 'default';
		case 'En Proceso':
			return 'secondary';
		case 'Rezagado':
			return 'destructive';
		case 'En Espera':
		case 'En Garantia':
			return 'outline';
		case 'Agendado':
		default:
			return 'ghost';
	}
}

export function workOrderPriorityVariant(priority: WorkOrderPriority): BadgeVariant {
	switch (priority) {
		case 'Alta':
			return 'destructive';
		case 'Media':
			return 'outline';
		case 'Baja':
		default:
			return 'secondary';
	}
}
