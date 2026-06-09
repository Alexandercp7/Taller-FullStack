export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Tarjeta';

export type CashTransactionType = 'Ingreso' | 'Egreso';

export interface DailyCashEntry {
	id: string;
	fecha: string;
	concepto: string;
	tipo: CashTransactionType;
	monto: number;
	metodoPago: PaymentMethod;
	referencia?: string;
	notas?: string;
	usuario: string;
}

export interface DailyCashSummary {
	fecha: string;
	ingresosCaja: number;
	egresosCaja: number;
	saldoFinal: number;
	transacciones: DailyCashEntry[];
	detalleMetodoPago: {
		efectivo: number;
		transferencia: number;
		tarjeta: number;
	};
}

export interface AccountReceivable {
	id: string;
	otId: string;
	cliente: string;
	concepto: string;
	monto: number;
	montoRecibido: number;
	montoPendiente: number;
	fechaEmision: string;
	fechaVencimiento?: string;
	estado: ReceivableStatus;
	notas?: string;
}

export type ReceivableStatus = 'Pendiente' | 'Parcial' | 'Pagado' | 'Vencido';

export interface AccountPayable {
	id: string;
	proveedor: string;
	concepto: string;
	monto: number;
	montoPagado: number;
	montoPendiente: number;
	fechaEmision: string;
	fechaVencimiento: string;
	estado: PayableStatus;
	notas?: string;
}

export type PayableStatus = 'Pendiente' | 'Parcial' | 'Pagado' | 'Vencido';

export interface OTsByPeriodData {
	periodo: string;
	cantidad: number;
	ingresoTotal: number;
	tiempoPromedio: number;
}

export interface IncomeByCategory {
	categoria: string;
	monto: number;
	porcentaje: number;
	cantidad: number;
}

export interface ExpenseData {
	concepto: string;
	monto: number;
	porcentaje: number;
	fecha: string;
}

export interface TechnicianKPIData {
	tecnico: string;
	otsTotales: number;
	otsCompletadas: number;
	tasaCompletacion: number;
	ingresoGenerado: number;
	tiempoPromedio: number;
	satisfaccion?: number;
}

export interface MonthComparative {
	mes: string;
	ingresos: number;
	egresos: number;
	saldo: number;
	otsCantidad: number;
}

export interface ServicePopularity {
	servicio: string;
	cantidad: number;
	ingresoTotal: number;
	porcentaje: number;
	tendencia: 'up' | 'down' | 'stable';
}

export interface ReportFilter {
	startDate: string;
	endDate: string;
	categories?: string[];
	tecnicos?: string[];
	clientes?: string[];
	proveedores?: string[];
}

export interface ExportFormat {
	type: 'pdf' | 'excel';
	reportType: 'ots' | 'ingresos' | 'gastos' | 'kpis' | 'completo';
	filters: ReportFilter;
}
