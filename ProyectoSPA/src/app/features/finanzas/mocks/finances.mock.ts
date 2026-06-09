import type {
	DailyCashEntry,
	DailyCashSummary,
	AccountReceivable,
	AccountPayable,
	ServicePopularity,
	TechnicianKPIData,
	MonthComparative,
} from '../models/finances.models';

export const dailyCashEntriesMock: DailyCashEntry[] = [
	{
		id: 'cash-001',
		fecha: new Date().toISOString().split('T')[0],
		concepto: 'Pago OT-2024-001 - Cambio aceite',
		tipo: 'Ingreso',
		monto: 1500,
		metodoPago: 'Efectivo',
		referencia: 'OT-2024-001',
		usuario: 'Juan Pérez',
	},
	{
		id: 'cash-002',
		fecha: new Date().toISOString().split('T')[0],
		concepto: 'Pago OT-2024-002 - Reparación motor',
		tipo: 'Ingreso',
		monto: 3500,
		metodoPago: 'Transferencia',
		referencia: 'OT-2024-002',
		usuario: 'María García',
	},
	{
		id: 'cash-003',
		fecha: new Date().toISOString().split('T')[0],
		concepto: 'Pago OT-2024-003 - Diagnóstico',
		tipo: 'Ingreso',
		monto: 800,
		metodoPago: 'Tarjeta',
		referencia: 'OT-2024-003',
		usuario: 'Carlos López',
	},
	{
		id: 'cash-004',
		fecha: new Date().toISOString().split('T')[0],
		concepto: 'Compra de refacciones',
		tipo: 'Egreso',
		monto: 2000,
		metodoPago: 'Transferencia',
		referencia: 'PROV-001',
		usuario: 'Admin',
	},
	{
		id: 'cash-005',
		fecha: new Date().toISOString().split('T')[0],
		concepto: 'Pago servicios (agua, luz, internet)',
		tipo: 'Egreso',
		monto: 500,
		metodoPago: 'Transferencia',
		usuario: 'Admin',
	},
];

export const accountsReceivableMock: AccountReceivable[] = [
	{
		id: 'cxc-001',
		otId: 'OT-2024-001',
		cliente: 'Juan Carlos Martínez',
		concepto: 'Servicios de reparación - Motor',
		monto: 5000,
		montoRecibido: 3500,
		montoPendiente: 1500,
		fechaEmision: '2024-01-10',
		fechaVencimiento: '2024-02-10',
		estado: 'Parcial',
		notas: 'Cliente pagó 70%, saldo en siguiente visita',
	},
	{
		id: 'cxc-002',
		otId: 'OT-2024-004',
		cliente: 'Empresa TransExpress',
		concepto: 'Reparación de flotilla (5 vehículos)',
		monto: 12000,
		montoRecibido: 0,
		montoPendiente: 12000,
		fechaEmision: '2024-01-15',
		fechaVencimiento: '2024-02-15',
		estado: 'Pendiente',
		notas: 'Credito 30 días, factura emitida',
	},
	{
		id: 'cxc-003',
		otId: 'OT-2024-005',
		cliente: 'María González',
		concepto: 'Cambio de aceite y filtros',
		monto: 1200,
		montoRecibido: 1200,
		montoPendiente: 0,
		fechaEmision: '2024-01-20',
		fechaVencimiento: '2024-02-20',
		estado: 'Pagado',
	},
	{
		id: 'cxc-004',
		otId: 'OT-2024-006',
		cliente: 'Taller Gonzalo',
		concepto: 'Diagnóstico y ajuste de motor',
		monto: 2500,
		montoRecibido: 0,
		montoPendiente: 2500,
		fechaEmision: '2023-12-20',
		fechaVencimiento: '2024-01-20',
		estado: 'Vencido',
		notas: 'Se ha intentado contactar al cliente',
	},
	{
		id: 'cxc-005',
		otId: 'OT-2024-007',
		cliente: 'Roberto Sánchez',
		concepto: 'Instalación de kit turbo',
		monto: 8500,
		montoRecibido: 5000,
		montoPendiente: 3500,
		fechaEmision: '2024-01-22',
		fechaVencimiento: '2024-02-22',
		estado: 'Parcial',
	},
];

export const accountsPayableMock: AccountPayable[] = [
	{
		id: 'cxp-001',
		proveedor: 'AutoParts México',
		concepto: 'Refacciones generales (50 piezas)',
		monto: 8500,
		montoPagado: 0,
		montoPendiente: 8500,
		fechaEmision: '2024-01-05',
		fechaVencimiento: '2024-02-05',
		estado: 'Pendiente',
		notas: 'Crédito 30 días, factura #APRT-2024-001',
	},
	{
		id: 'cxp-002',
		proveedor: 'Shell Lubricantes',
		concepto: 'Aceite sintético 20L y aditivos',
		monto: 2200,
		montoPagado: 2200,
		montoPendiente: 0,
		fechaEmision: '2023-12-20',
		fechaVencimiento: '2024-01-20',
		estado: 'Pagado',
	},
	{
		id: 'cxp-003',
		proveedor: 'Eléctricos López',
		concepto: 'Alternadores y starter (6 piezas)',
		monto: 4800,
		montoPagado: 2400,
		montoPendiente: 2400,
		fechaEmision: '2024-01-08',
		fechaVencimiento: '2024-02-08',
		estado: 'Parcial',
		notas: 'Primer pago realizado el 15/01',
	},
	{
		id: 'cxp-004',
		proveedor: 'Bosch México',
		concepto: 'Sistemas de inyección electrónica',
		monto: 6200,
		montoPagado: 0,
		montoPendiente: 6200,
		fechaEmision: '2023-12-15',
		fechaVencimiento: '2024-01-15',
		estado: 'Vencido',
		notas: 'Contactar para reprogramar pago',
	},
	{
		id: 'cxp-005',
		proveedor: 'Filtros express',
		concepto: 'Filtros de aire, aceite y gasolina',
		monto: 1500,
		montoPagado: 0,
		montoPendiente: 1500,
		fechaEmision: '2024-01-18',
		fechaVencimiento: '2024-02-18',
		estado: 'Pendiente',
	},
];

export const servicesPopularityMock: ServicePopularity[] = [
	{
		servicio: 'Cambio de aceite',
		cantidad: 45,
		ingresoTotal: 22500,
		porcentaje: 18,
		tendencia: 'up',
	},
	{
		servicio: 'Diagnóstico',
		cantidad: 38,
		ingresoTotal: 15200,
		porcentaje: 12,
		tendencia: 'up',
	},
	{
		servicio: 'Reparación de motor',
		cantidad: 22,
		ingresoTotal: 85000,
		porcentaje: 68,
		tendencia: 'stable',
	},
	{
		servicio: 'Alineación',
		cantidad: 18,
		ingresoTotal: 9000,
		porcentaje: 7,
		tendencia: 'down',
	},
	{
		servicio: 'Balanceo de llantas',
		cantidad: 12,
		ingresoTotal: 4800,
		porcentaje: 4,
		tendencia: 'stable',
	},
	{
		servicio: 'Instalación de accesorios',
		cantidad: 8,
		ingresoTotal: 16000,
		porcentaje: 13,
		tendencia: 'up',
	},
];

export const technicianKPIMock: TechnicianKPIData[] = [
	{
		tecnico: 'Carlos López',
		otsTotales: 28,
		otsCompletadas: 26,
		tasaCompletacion: 92.8,
		ingresoGenerado: 65000,
		tiempoPromedio: 4.5,
		satisfaccion: 4.7,
	},
	{
		tecnico: 'Juan Pérez',
		otsTotales: 24,
		otsCompletadas: 22,
		tasaCompletacion: 91.6,
		ingresoGenerado: 52000,
		tiempoPromedio: 4.8,
		satisfaccion: 4.5,
	},
	{
		tecnico: 'María García',
		otsTotales: 32,
		otsCompletadas: 30,
		tasaCompletacion: 93.7,
		ingresoGenerado: 95000,
		tiempoPromedio: 4.2,
		satisfaccion: 4.8,
	},
	{
		tecnico: 'Luis Fernández',
		otsTotales: 20,
		otsCompletadas: 18,
		tasaCompletacion: 90,
		ingresoGenerado: 38000,
		tiempoPromedio: 5.1,
		satisfaccion: 4.3,
	},
	{
		tecnico: 'Andrea Ruiz',
		otsTotales: 19,
		otsCompletadas: 17,
		tasaCompletacion: 89.4,
		ingresoGenerado: 42000,
		tiempoPromedio: 5.3,
		satisfaccion: 4.4,
	},
];

export const monthComparativeMock: MonthComparative[] = [
	{
		mes: 'Octubre',
		ingresos: 85000,
		egresos: 35000,
		saldo: 50000,
		otsCantidad: 65,
	},
	{
		mes: 'Noviembre',
		ingresos: 92000,
		egresos: 38000,
		saldo: 54000,
		otsCantidad: 72,
	},
	{
		mes: 'Diciembre',
		ingresos: 78000,
		egresos: 41000,
		saldo: 37000,
		otsCantidad: 58,
	},
	{
		mes: 'Enero',
		ingresos: 105000,
		egresos: 39000,
		saldo: 66000,
		otsCantidad: 85,
	},
	{
		mes: 'Febrero',
		ingresos: 98000,
		egresos: 36000,
		saldo: 62000,
		otsCantidad: 78,
	},
	{
		mes: 'Marzo',
		ingresos: 112000,
		egresos: 40000,
		saldo: 72000,
		otsCantidad: 92,
	},
];

export function generateDailyCashSummary(): DailyCashSummary {
	const today = new Date().toISOString().split('T')[0];
	const ingresos = dailyCashEntriesMock
		.filter((e) => e.tipo === 'Ingreso')
		.reduce((sum, e) => sum + e.monto, 0);
	const egresos = dailyCashEntriesMock
		.filter((e) => e.tipo === 'Egreso')
		.reduce((sum, e) => sum + e.monto, 0);

	return {
		fecha: today,
		ingresosCaja: ingresos,
		egresosCaja: egresos,
		saldoFinal: ingresos - egresos,
		transacciones: dailyCashEntriesMock,
		detalleMetodoPago: {
			efectivo: dailyCashEntriesMock
				.filter((e) => e.metodoPago === 'Efectivo')
				.reduce((sum, e) => sum + e.monto, 0),
			transferencia: dailyCashEntriesMock
				.filter((e) => e.metodoPago === 'Transferencia')
				.reduce((sum, e) => sum + e.monto, 0),
			tarjeta: dailyCashEntriesMock
				.filter((e) => e.metodoPago === 'Tarjeta')
				.reduce((sum, e) => sum + e.monto, 0),
		},
	};
}
