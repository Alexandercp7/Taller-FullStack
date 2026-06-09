import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class PdfExportService {

	exportDailyCash(entries: any[]): void {
		const today    = new Date().toLocaleDateString('es-MX');
		const ingresos = entries.filter((e: any) => e.tipo === 'Ingreso').reduce((s, e: any) => s + e.monto, 0);
		const egresos  = entries.filter((e: any) => e.tipo === 'Egreso').reduce((s, e: any) => s + e.monto, 0);
		const saldo    = ingresos - egresos;
		const mxn      = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

		const doc   = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
		const pageW = doc.internal.pageSize.getWidth();
		const M     = 40;

		doc.setFontSize(16).setFont('helvetica', 'bold').setTextColor(44, 62, 80);
		doc.text('REPORTE DE CAJA DIARIA', M, 55);
		doc.setFontSize(11).setFont('helvetica', 'normal').setTextColor(52, 73, 94);
		doc.text(`Fecha: ${today}`, M, 72);

		// métricas
		const col = (pageW - 2 * M) / 3;
		doc.setFontSize(10).setTextColor(39, 174, 96);
		doc.text(`Ingresos: ${mxn(ingresos)}`, M, 100);
		doc.setTextColor(192, 57, 43);
		doc.text(`Egresos: ${mxn(egresos)}`, M + col, 100);
		doc.setFont('helvetica', 'bold').setTextColor(44, 62, 80);
		doc.text(`Saldo: ${mxn(saldo)}`, M + col * 2, 100);

		autoTable(doc, {
			startY: 118,
			margin: { left: M, right: M },
			head: [['Fecha', 'Concepto', 'Tipo', 'Monto', 'Método']],
			body: entries.map((e: any) => [e.fecha, e.concepto, e.tipo, mxn(e.monto), e.metodoPago]),
			headStyles: { fillColor: [44, 62, 80], textColor: 255, fontSize: 9 },
			bodyStyles: { fontSize: 9 },
			theme: 'striped',
		});

		doc.save('caja-diaria.pdf');
	}

	exportAccountsReceivable(accounts: any[]): void {
		const total    = accounts.reduce((s, a: any) => s + a.monto, 0);
		const received = accounts.reduce((s, a: any) => s + a.montoRecibido, 0);
		const pending  = accounts.reduce((s, a: any) => s + a.montoPendiente, 0);
		const mxn      = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

		const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
		const M   = 40;

		doc.setFontSize(16).setFont('helvetica', 'bold').setTextColor(44, 62, 80);
		doc.text('REPORTE DE CUENTAS POR COBRAR', M, 55);
		doc.setFontSize(11).setFont('helvetica', 'normal').setTextColor(100);
		doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, M, 72);

		doc.setFontSize(9).setFont('helvetica', 'bold');
		doc.setTextColor(192, 57, 43);  doc.text(`Total: ${mxn(total)}`, M, 98);
		doc.setTextColor(39, 174, 96);  doc.text(`Recibido: ${mxn(received)}`, M + 160, 98);
		doc.setTextColor(231, 76, 60);  doc.text(`Pendiente: ${mxn(pending)}`, M + 320, 98);

		autoTable(doc, {
			startY: 114,
			margin: { left: M, right: M },
			head: [['OT', 'Cliente', 'Concepto', 'Total', 'Pendiente', 'Vencimiento', 'Estado']],
			body: accounts.map((a: any) => [
				a.otId, a.cliente, a.concepto,
				mxn(a.monto), mxn(a.montoPendiente),
				a.fechaVencimiento, a.estado,
			]),
			headStyles: { fillColor: [44, 62, 80], textColor: 255, fontSize: 8 },
			bodyStyles: { fontSize: 8 },
			theme: 'striped',
		});

		doc.save('cuentas-por-cobrar.pdf');
	}

	exportAccountsPayable(accounts: any[]): void {
		const total   = accounts.reduce((s, a: any) => s + a.monto, 0);
		const paid    = accounts.reduce((s, a: any) => s + a.montoPagado, 0);
		const pending = accounts.reduce((s, a: any) => s + a.montoPendiente, 0);
		const mxn     = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

		const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
		const M   = 40;

		doc.setFontSize(16).setFont('helvetica', 'bold').setTextColor(44, 62, 80);
		doc.text('REPORTE DE CUENTAS POR PAGAR', M, 55);
		doc.setFontSize(11).setFont('helvetica', 'normal').setTextColor(100);
		doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, M, 72);

		doc.setFontSize(9).setFont('helvetica', 'bold');
		doc.setTextColor(192, 57, 43);  doc.text(`Total: ${mxn(total)}`, M, 98);
		doc.setTextColor(39, 174, 96);  doc.text(`Pagado: ${mxn(paid)}`, M + 160, 98);
		doc.setTextColor(231, 76, 60);  doc.text(`Pendiente: ${mxn(pending)}`, M + 320, 98);

		autoTable(doc, {
			startY: 114,
			margin: { left: M, right: M },
			head: [['Proveedor', 'Concepto', 'Total', 'Pendiente', 'Vencimiento', 'Estado']],
			body: accounts.map((a: any) => [
				a.proveedor, a.concepto,
				mxn(a.monto), mxn(a.montoPendiente),
				a.fechaVencimiento, a.estado,
			]),
			headStyles: { fillColor: [44, 62, 80], textColor: 255, fontSize: 8 },
			bodyStyles: { fontSize: 8 },
			theme: 'striped',
		});

		doc.save('cuentas-por-pagar.pdf');
	}

	exportServicesSummary(workOrders: any[]): void {
		const summary = new Map<string, { count: number; total: number }>();
		workOrders.forEach((wo: any) => {
			const cur = summary.get(wo.servicios) || { count: 0, total: 0 };
			summary.set(wo.servicios, { count: cur.count + 1, total: cur.total + wo.monto });
		});
		const mxn        = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
		const totalIncome = workOrders.reduce((s: number, wo: any) => s + wo.monto, 0);

		const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
		const M   = 40;

		doc.setFontSize(16).setFont('helvetica', 'bold').setTextColor(44, 62, 80);
		doc.text('RESUMEN DE SERVICIOS', M, 55);
		doc.setFontSize(11).setFont('helvetica', 'normal').setTextColor(100);
		doc.text(`Período: ${new Date().toLocaleDateString('es-MX')}`, M, 72);

		doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(44, 62, 80);
		doc.text(`Órdenes completadas: ${workOrders.length}`, M, 98);
		doc.setTextColor(39, 174, 96);
		doc.text(`Ingresos: ${mxn(totalIncome)}`, M + 220, 98);

		autoTable(doc, {
			startY: 114,
			margin: { left: M, right: M },
			head: [['Servicio', 'Cantidad', 'Total']],
			body: Array.from(summary.entries()).map(([servicio, data]) => [
				servicio, data.count.toString(), mxn(data.total),
			]),
			headStyles: { fillColor: [44, 62, 80], textColor: 255, fontSize: 9 },
			bodyStyles: { fontSize: 9 },
			columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
			theme: 'striped',
		});

		doc.save('resumen-servicios.pdf');
	}
}
