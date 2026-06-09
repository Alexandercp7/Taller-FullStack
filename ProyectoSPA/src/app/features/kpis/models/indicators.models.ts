export interface KPIIndicator {
	id: string;
	nombre: string;
	categoria: 'Commercial' | 'Operative' | 'Quality';
	valor: number;
	unidad: string;
	meta?: number;
	variacion?: number; 
	tendencia: 'up' | 'down' | 'stable';
	descripcion: string;
	ultimaActualizacion: string;
	icon: string; 
}

export interface KPICategory {
	nombre: 'Commercial' | 'Operative' | 'Quality';
	label: string;
	indicadores: KPIIndicator[];
	color: string; 
}

export interface IndicatorsData {
	fecha: string;
	periodoInicio: string;
	periodoFin: string;
	categorias: KPICategory[];
}
