import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, of, timeout, type Observable } from 'rxjs';
import type { CarQueryDecodedVin, VehicleRecallItem } from './carquery-api.models';

/**
	Aquí se implementan 2 APIs diferentes, una para obtener la información de 
	marcas/modelos/años a partir de la API de NHTSA (VPIC) y otra para obtener 
	los recalls a partir de la API de NHTSA (NHTSA Recalls).

**/

interface VpicListEnvelope<T> {
	Results?: T[];
}

interface VpicMakeRaw {
	Make_Name?: string;
}

interface VpicModelRaw {
	Model_Name?: string;
}

interface VpicDecodeResultRaw {
	Make?: string;
	Model?: string;
	ModelYear?: string;
}

interface NhtsaRecallRaw {
	NHTSACampaignNumber?: string;
	ReportReceivedDate?: string;
	Component?: string;
	Summary?: string;
	Consequence?: string;
	Conequence?: string;
	Remedy?: string;
	Manufacturer?: string;
}

interface NhtsaRecallEnvelope {
	results?: NhtsaRecallRaw[];
	Results?: NhtsaRecallRaw[];
}

@Injectable({ providedIn: 'root' })
export class CarQueryApiService {
	private readonly _http = inject(HttpClient);
	private readonly _vpicBaseUrl = '/vpic/api/vehicles/';
	private readonly _nhtsaBaseUrl = '/nhtsa/recalls/recallsByVehicle';
	private readonly _requestTimeoutMs = 12000;
	private readonly _fallbackModelsByMake: Record<string, string[]> = {
		Toyota: ['Corolla', 'Yaris', 'Camry', 'RAV4', 'Hilux'],
		Nissan: ['Versa', 'Sentra', 'Altima', 'Kicks', 'Frontier'],
		Honda: ['Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot'],
		Mazda: ['Mazda2', 'Mazda3', 'CX-3', 'CX-30', 'CX-5'],
		Chevrolet: ['Aveo', 'Onix', 'Malibu', 'Tracker', 'Silverado'],
		Ford: ['Figo', 'Focus', 'Escape', 'Bronco', 'Ranger'],
		Volkswagen: ['Polo', 'Jetta', 'Golf', 'Tiguan', 'Taos'],
		Hyundai: ['i10', 'Accent', 'Elantra', 'Tucson', 'Santa Fe'],
		Kia: ['Rio', 'Forte', 'Soul', 'Sportage', 'Sorento'],
		BMW: ['Serie 1', 'Serie 3', 'Serie 5', 'X1', 'X3'],
		'Mercedes-Benz': ['Clase A', 'Clase C', 'Clase E', 'GLA', 'GLC'],
		Audi: ['A3', 'A4', 'A6', 'Q3', 'Q5'],
		Porsche: ['718 Cayman', '718 Boxster', 'Macan', 'Cayenne', '911'],
		Jeep: ['Renegade', 'Compass', 'Cherokee', 'Wrangler', 'Grand Cherokee'],
		Ram: ['700', '1200', '1500', '2500', 'ProMaster'],
		Subaru: ['Impreza', 'Legacy', 'Forester', 'Outback', 'WRX'],
		Volvo: ['S60', 'S90', 'XC40', 'XC60', 'XC90'],
	};

	public searchMakes(query: string): Observable<string[]> {
		const normalizedQuery = query.trim().toLowerCase();
		const url = `${this._vpicBaseUrl}GetAllMakes`;
		const params = new HttpParams().set('format', 'json');

		return this._http.get<VpicListEnvelope<VpicMakeRaw>>(url, { params }).pipe(
			timeout(this._requestTimeoutMs),
			map((response) => {
				const unique = new Set<string>();
				for (const item of response.Results ?? []) {
					const makeName = (item.Make_Name ?? '').trim();
					if (!makeName) {
						continue;
					}
					if (!normalizedQuery || makeName.toLowerCase().includes(normalizedQuery)) {
						unique.add(makeName);
					}
				}
				return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
			}),
			catchError(() => of(this.filterMakesFallback(normalizedQuery))),
		);
	}

	public searchModels(make: string, query: string): Observable<string[]> {
		const makeParam = make.trim();
		if (!makeParam) {
			return of([]);
		}

		const normalizedQuery = query.trim().toLowerCase();
		const url = `${this._vpicBaseUrl}GetModelsForMake/${encodeURIComponent(makeParam)}`;
		const params = new HttpParams().set('format', 'json');

		return this._http.get<VpicListEnvelope<VpicModelRaw>>(url, { params }).pipe(
			timeout(this._requestTimeoutMs),
			map((response) => {
				const unique = new Set<string>();
				for (const item of response.Results ?? []) {
					const modelName = (item.Model_Name ?? '').trim();
					if (!modelName) {
						continue;
					}
					if (!normalizedQuery || modelName.toLowerCase().includes(normalizedQuery)) {
						unique.add(modelName);
					}
				}
				return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
			}),
			catchError(() => of(this.filterModelsFallback(makeParam, normalizedQuery))),
		);
	}

	public searchYears(make: string, model: string): Observable<number[]> {
		const makeParam = make.trim();
		const modelParam = model.trim();
		if (!makeParam || !modelParam) {
			return of([]);
		}

		const currentYear = new Date().getFullYear();
		const years: number[] = [];
		for (let year = currentYear + 1; year >= 1990; year--) {
			years.push(year);
		}
		return of(years);
	}

	public decodeVin(vin: string): Observable<CarQueryDecodedVin | null> {
		const normalizedVin = vin.trim().toUpperCase();
		if (normalizedVin.length < 11) {
			return of(null);
		}

		const url = `${this._vpicBaseUrl}DecodeVinValuesExtended/${encodeURIComponent(normalizedVin)}`;
		const params = new HttpParams().set('format', 'json');

		return this._http.get<VpicListEnvelope<VpicDecodeResultRaw>>(url, { params }).pipe(
			timeout(this._requestTimeoutMs),
			map((response) => {
				const source = response.Results?.[0];
				if (!source) {
					return null;
				}

				const make = (source.Make ?? '').trim();
				const model = (source.Model ?? '').trim();
				const year = Number(source.ModelYear ?? '');
				if (!make && !model && !Number.isFinite(year)) {
					return null;
				}

				return {
					vin: normalizedVin,
					make,
					model,
					year: Number.isFinite(year) && year > 0 ? year : new Date().getFullYear(),
				};
			}),
			catchError(() => of(null)),
		);
	}

	public searchRecalls(make: string, model: string, modelYear: number): Observable<VehicleRecallItem[]> {
		const makeParam = make.trim();
		const modelParam = model.trim();
		if (!makeParam || !modelParam || !Number.isFinite(modelYear) || modelYear <= 0) {
			return of([]);
		}

		const params = new HttpParams().set('make', makeParam).set('model', modelParam).set('modelYear', String(modelYear));

		return this._http.get<NhtsaRecallEnvelope>(this._nhtsaBaseUrl, { params }).pipe(
			timeout(this._requestTimeoutMs),
			map((response) => {
				const source = response.results ?? response.Results ?? [];
				return source
					.map((item): VehicleRecallItem => ({
						campaignNumber: (item.NHTSACampaignNumber ?? '').trim(),
						reportDate: (item.ReportReceivedDate ?? '').trim(),
						component: (item.Component ?? '').trim(),
						summary: (item.Summary ?? '').trim(),
						consequence: (item.Consequence ?? item.Conequence ?? '').trim(),
						remedy: (item.Remedy ?? '').trim(),
						manufacturer: (item.Manufacturer ?? '').trim(),
					}))
					.filter((item) => item.campaignNumber || item.summary || item.component);
			}),
			catchError(() => of([])),
		);
	}

	private filterMakesFallback(normalizedQuery: string): string[] {
		const makes = Object.keys(this._fallbackModelsByMake).sort((a, b) => a.localeCompare(b));
		if (!normalizedQuery) {
			return makes;
		}
		return makes.filter((make) => make.toLowerCase().includes(normalizedQuery));
	}

	private filterModelsFallback(make: string, normalizedQuery: string): string[] {
		const models = this._fallbackModelsByMake[make] ?? [];
		if (!normalizedQuery) {
			return [...models];
		}
		return models.filter((model) => model.toLowerCase().includes(normalizedQuery));
	}
}
