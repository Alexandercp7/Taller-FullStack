export type InventoryItemType = 'Herramienta' | 'Consumible' | 'Equipo' | 'Parte en venta';
export type InventoryItemCondition = 'Bueno' | 'Regular' | 'Danado';
export type InventoryMovementType = 'Entrada' | 'Salida OT' | 'Ajuste manual';
export type ClientCustodyState = 'Resguardado' | 'Entregado';

export interface InventoryItem {
	id: string;
	nombre: string;
	tipo: InventoryItemType;
	fotoUrl: string;
	descripcion: string;
	estado: InventoryItemCondition;
	responsable: string;
	stockActual: number;
	stockMinimo: number;
	precioVenta?: number; 
	precio?: number; 
	linkedPartId?: string;
}

export interface InventoryMovement {
	id: string;
	itemId: string;
	type: InventoryMovementType;
	cantidad: number;
	stockResultante: number;
	relatedOtId?: string;
	motivo: string;
	usuario: string;
	timestamp: string;
}

export interface ClientCustodyItem {
	id: string;
	otId: string;
	cliente: string;
	item: string;
	fotoUrl: string;
	responsable: string;
	estado: ClientCustodyState;
	fechaIngreso: string;
}

export interface CreateCustodyInput {
	otId: string;
	cliente: string;
	item: string;
	fotoUrl: string;
	responsable: string;
}

export interface CreateInventoryItemInput {
	nombre: string;
	tipo: InventoryItemType;
	fotoUrl: string;
	photoFile?: File;
	descripcion: string;
	estado: InventoryItemCondition;
	responsable: string;
	stockActual: number;
	stockMinimo: number;
	precio?: number;
	precioVenta?: number;
	linkedPartId?: string;
}
