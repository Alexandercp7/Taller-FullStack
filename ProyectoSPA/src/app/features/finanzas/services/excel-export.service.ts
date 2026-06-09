import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({ providedIn: 'root' })
export class ExcelExportService {

	exportDailyCash(entries: any[]): void {
		const data = [
			['REPORTE DE CAJA DIARIA', '', '', '', ''],
			['Fecha:', new Date().toLocaleDateString('es-MX'), '', '', ''],
			['', '', '', '', ''],
			['Fecha', 'Concepto', 'Tipo', 'Monto', 'Método de Pago'],
			...entries.map((e) => [e.fecha, e.concepto, e.tipo, e.monto, e.metodoPago]),
		];

		const ingresos = entries.filter((e: any) => e.tipo === 'Ingreso').reduce((sum, e: any) => sum + e.monto, 0);
		const egresos = entries.filter((e: any) => e.tipo === 'Egreso').reduce((sum, e: any) => sum + e.monto, 0);
		const saldo = ingresos - egresos;

		data.push(['', '', '', '', '']);
		data.push(['RESUMEN', '', '', '', '']);
		data.push(['Ingresos', '', '', ingresos, '']);
		data.push(['Egresos', '', '', egresos, '']);
		data.push(['Saldo Final', '', '', saldo, '']);

		this.createAndDownloadExcel(data, 'caja-diaria.xlsx');
	}

	exportAccountsReceivable(accounts: any[]): void {
		const total = accounts.reduce((sum, a: any) => sum + a.monto, 0);
		const received = accounts.reduce((sum, a: any) => sum + a.montoRecibido, 0);
		const pending = accounts.reduce((sum, a: any) => sum + a.montoPendiente, 0);

		const data = [
			['REPORTE DE CUENTAS POR COBRAR', '', '', '', '', '', ''],
			['Generado:', new Date().toLocaleDateString('es-MX'), '', '', '', '', ''],
			['', '', '', '', '', '', ''],
			['OT', 'Cliente', 'Concepto', 'Total', 'Recibido', 'Pendiente', 'Estado'],
			...accounts.map((a) => [
				a.otId,
				a.cliente,
				a.concepto,
				a.monto,
				a.montoRecibido,
				a.montoPendiente,
				a.estado,
			]),
		];

		data.push(['', '', '', '', '', '', '']);
		data.push(['RESUMEN', '', '', '', '', '', '']);
		data.push(['Total Facturado', '', '', total, '', '', '']);
		data.push(['Total Recibido', '', '', received, '', '', '']);
		data.push(['Total Pendiente', '', '', pending, '', '', '']);

		this.createAndDownloadExcel(data, 'cuentas-por-cobrar.xlsx');
	}

	exportAccountsPayable(accounts: any[]): void {
		const total = accounts.reduce((sum, a: any) => sum + a.monto, 0);
		const paid = accounts.reduce((sum, a: any) => sum + a.montoPagado, 0);
		const pending = accounts.reduce((sum, a: any) => sum + a.montoPendiente, 0);

		const data = [
			['REPORTE DE CUENTAS POR PAGAR', '', '', '', '', '', ''],
			['Generado:', new Date().toLocaleDateString('es-MX'), '', '', '', '', ''],
			['', '', '', '', '', '', ''],
			['Proveedor', 'Concepto', 'Total', 'Pagado', 'Pendiente', 'Vencimiento', 'Estado'],
			...accounts.map((a) => [
				a.proveedor,
				a.concepto,
				a.monto,
				a.montoPagado,
				a.montoPendiente,
				a.fechaVencimiento,
				a.estado,
			]),
		];

		data.push(['', '', '', '', '', '', '']);
		data.push(['RESUMEN', '', '', '', '', '', '']);
		data.push(['Total', '', total, paid, pending, '', '']);

		this.createAndDownloadExcel(data, 'cuentas-por-pagar.xlsx');
	}

	
	exportServicesSummary(workOrders: any[]): void {
		const serviceSummary = new Map<string, { count: number; total: number }>();

		workOrders.forEach((wo: any) => {
			const current = serviceSummary.get(wo.servicios) || { count: 0, total: 0 };
			serviceSummary.set(wo.servicios, {
				count: current.count + 1,
				total: current.total + wo.monto,
			});
		});

		const data = [
			['RESUMEN DE SERVICIOS', '', ''],
			['Período:', new Date().toLocaleDateString('es-MX'), ''],
			['', '', ''],
			['Servicio', 'Cantidad', 'Monto Total'],
			...Array.from(serviceSummary.entries()).map(([servicio, summary]) => [
				servicio,
				summary.count,
				summary.total,
			]),
		];

		this.createAndDownloadExcel(data, 'resumen-servicios.xlsx');
	}

	exportExpenses(expenses: any[]): void {
		const data = [
			['REPORTE DE GASTOS', '', '', '', ''],
			['Período:', new Date().toLocaleDateString('es-MX'), '', '', ''],
			['', '', '', '', ''],
			['Concepto', 'Monto', 'Categoría', 'Fecha', 'Proveedor'],
			...expenses.map((e) => [e.concepto, e.monto, e.categoria, e.fecha, e.proveedor]),
		];

		const totalGastos = expenses.reduce((sum: number, e: any) => sum + e.monto, 0);
		data.push(['', '', '', '', '']);
		data.push(['TOTAL', totalGastos, '', '', '']);

		this.createAndDownloadExcel(data, 'gastos.xlsx');
	}

	private createAndDownloadExcel(data: any[][], filename: string): void {
		try {
			const worksheet = XLSX.utils.aoa_to_sheet(data);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

			const maxWidth = 30;
			const colWidths = data[0].map(() => ({ wch: maxWidth }));
			worksheet['!cols'] = colWidths;

			XLSX.writeFile(workbook, filename);
		} catch (error) {
			console.error('Error generando Excel:', error);
			alert('Error al generar el Excel. Revisa la consola.');
		}
	}
}
