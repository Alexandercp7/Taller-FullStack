import type { WorkOrderPriority, WorkOrderStatus } from '../../work-orders/models';

export type ClientTag = 'Nuevo' | 'Frecuente' | 'Con adeudo' | 'Sin historial' | 'Al corriente' | 'Pendiente' | 'Vencido';
export type PaymentState = 'Pagado' | 'Pendiente';

export interface ClientProfileMock {
	nombre: string;
	rfc: string;
	telefono?: string;
	correo?: string;
	paymentByOtId?: Record<string, PaymentState>;
}

export interface ClientWorkOrderHistoryItem {
	id: string;
	code: string;
	status: WorkOrderStatus;
	priority: WorkOrderPriority;
	fechaProgramada: string;
	tecnico: string;
	vehiculo: string;
	placas: string;
	paymentState: PaymentState;
}

export interface ClientVehicleHistoryItem {
	id: string;
	marca: string;
	modelo: string;
	anio: number;
	placas: string;
	vin: string;
	services: string[];
	workOrderIds: string[];
}

export interface ClientListItem {
	id: string;
	nombre: string;
	telefono: string;
	correo: string;
	rfc: string;
	tag: ClientTag;
	workOrderCount: number;
	vehicleCount: number;
	placas: string[];
}

export interface ClientDetail {
	id: string;
	nombre: string;
	telefono: string;
	correo: string;
	rfc: string;
	tag: ClientTag;
	workOrders: ClientWorkOrderHistoryItem[];
	vehicles: ClientVehicleHistoryItem[];
}

export interface UpsertClientInput {
	nombre: string;
	telefono: string;
	correo: string;
	rfc: string;
}
