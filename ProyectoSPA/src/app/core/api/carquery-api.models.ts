export interface CarQueryMake {
	id: string;
	name: string;
}

export interface CarQueryModel {
	name: string;
}

export interface CarQueryDecodedVin {
	vin: string;
	make: string;
	model: string;
	year: number;
	trim?: string;
}

export interface VehicleRecallItem {
	campaignNumber: string;
	reportDate: string;
	component: string;
	summary: string;
	consequence: string;
	remedy: string;
	manufacturer: string;
}
