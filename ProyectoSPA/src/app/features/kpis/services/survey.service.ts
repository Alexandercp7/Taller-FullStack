import { Injectable, signal, computed, effect } from '@angular/core';
import type { SurveyResponse, SurveySummary } from '../models/survey.models';

@Injectable({ providedIn: 'root' })
export class SurveyService {
	private readonly STORAGE_KEY = 'colosio-surveys';
	private readonly _surveys = signal<SurveyResponse[]>(this.loadFromStorage());
	
	public readonly surveys = this._surveys.asReadonly();

	public readonly summary = computed(() => {
		const responses = this._surveys();
		if (responses.length === 0) {
			return {
				totalRespuestas: 0,
				promedioSatisfaccionGeneral: 0,
				promedioCalidadTrabajo: 0,
				promedioTratoRecibido: 0,
				promedioRecomendacion: 0,
				tasaPonderada: 0,
				respondedoresCount: 0,
				ultimaEncuesta: 'N/A',
			} as SurveySummary;
		}

		const totals = responses.reduce(
			(acc, survey) => ({
				satisfaccionGeneral: acc.satisfaccionGeneral + survey.satisfaccionGeneral,
				calidadTrabajo: acc.calidadTrabajo + survey.calidadTrabajo,
				tratoRecibido: acc.tratoRecibido + survey.tratoRecibido,
				recomendacion: acc.recomendacion + survey.recomendacion,
			}),
			{ satisfaccionGeneral: 0, calidadTrabajo: 0, tratoRecibido: 0, recomendacion: 0 }
		);

		const count = responses.length;
		const promedioSatisfaccionGeneral = Math.round((totals.satisfaccionGeneral / count) * 10) / 10;
		const promedioCalidadTrabajo = Math.round((totals.calidadTrabajo / count) * 10) / 10;
		const promedioTratoRecibido = Math.round((totals.tratoRecibido / count) * 10) / 10;
		const promedioRecomendacion = Math.round((totals.recomendacion / count) * 10) / 10;

		const tasaPonderada = Math.round(
			((promedioSatisfaccionGeneral +
				promedioCalidadTrabajo +
				promedioTratoRecibido +
				promedioRecomendacion) /
				4) *
				10
		) / 10;

		const ultimaEncuesta = 
			responses.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]?.fecha || 'N/A';

		return {
			totalRespuestas: count,
			promedioSatisfaccionGeneral,
			promedioCalidadTrabajo,
			promedioTratoRecibido,
			promedioRecomendacion,
			tasaPonderada,
			respondedoresCount: count,
			ultimaEncuesta,
		};
	});

	constructor() {
		effect(() => {
			this.saveToStorage(this._surveys());
		});
	}

	public addSurvey(survey: SurveyResponse): void {
		this._surveys.update((surveys) => [survey, ...surveys]);
	}

	public getSurveyById(id: string): SurveyResponse | undefined {
		return this._surveys().find((s) => s.id === id);
	}

	public getSurveysByWorkOrder(workOrderId: string): SurveyResponse[] {
		return this._surveys().filter((s) => s.workOrderId === workOrderId);
	}

	public updateSurvey(id: string, updates: Partial<SurveyResponse>): void {
		this._surveys.update((surveys) =>
			surveys.map((s) => (s.id === id ? { ...s, ...updates } : s))
		);
	}

	public deleteSurvey(id: string): void {
		this._surveys.update((surveys) => surveys.filter((s) => s.id !== id));
	}

	public clearAllSurveys(): void {
		this._surveys.set([]);
		localStorage.removeItem(this.STORAGE_KEY);
	}

	private loadFromStorage(): SurveyResponse[] {
		if (typeof window === 'undefined') return [];
		try {
			const stored = localStorage.getItem(this.STORAGE_KEY);
			return stored ? JSON.parse(stored) : [];
		} catch (error) {
			console.error('Error loading surveys from localStorage:', error);
			return [];
		}
	}

	private saveToStorage(surveys: SurveyResponse[]): void {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(surveys));
		} catch (error) {
			console.error('Error saving surveys to localStorage:', error);
		}
	}
}
