export interface SurveyResponse {
	id: string;
	workOrderId: string;
	cliente: string;
	fecha: string;
	satisfaccionGeneral: number;
	calidadTrabajo: number;
	tratoRecibido: number;
	recomendacion: number;
	comentarios: string;
}

export interface SurveySummary {
	totalRespuestas: number;
	promedioSatisfaccionGeneral: number;
	promedioCalidadTrabajo: number;
	promedioTratoRecibido: number;
	promedioRecomendacion: number;
	tasaPonderada: number; 
	respondedoresCount: number;
	ultimaEncuesta: string;
}

export interface SurveyWidgetData {
	workOrderId: string;
	cliente: string;
	mostrar: boolean;
}
