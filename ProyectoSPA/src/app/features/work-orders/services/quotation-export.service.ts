import { inject, Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { PdfMakerService } from '../../../core';
import type { AssignedServiceItem, WorkOrder } from '../models';

@Injectable({ providedIn: 'root' })
export class QuotationExportService {
	private readonly _pdf = inject(PdfMakerService);

	private getServicePrice(service: AssignedServiceItem, tipoVehiculo: string): number {
		switch (tipoVehiculo) {
			case 'Camioneta': return service.precioCamioneta ?? service.precio;
			case 'Camión':    return service.precioCamion    ?? service.precio;
			default:          return service.precioAuto      ?? service.precio;
		}
	}

	private fmt(n: number): string {
		return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
	}

	// ── Excel ────────────────────────────────────────────────────────────────────

	exportExcel(order: WorkOrder): void {
		const totalParts = order.refaccionesAsignadas.reduce(
			(s, p) => s + p.cantidad * p.costoUnitario, 0,
		);
		const totalServices = order.serviciosAsignados.reduce(
			(s, sv) => s + this.getServicePrice(sv, order.tipoVehiculo), 0,
		);

		const rows: (string | number)[][] = [
			['COTIZACIÓN — ORDEN DE TRABAJO'],
			[],
			['N° Orden:', order.id],
			['Cliente:', order.cliente],
			['Vehículo:', `${order.vehicle.marca} ${order.vehicle.modelo} ${order.vehicle.anio}`],
			['Placas:', order.vehicle.placas || '—'],
			['Tipo:', order.tipoVehiculo],
			['Técnico:', order.tecnico],
			['Fecha:', order.fechaIngreso],
			[],
			['REFACCIONES E INVENTARIO'],
			['Refacción', 'Cantidad', 'Costo Unitario', 'Subtotal'],
			...order.refaccionesAsignadas.map(p => [p.nombre, p.cantidad, p.costoUnitario, p.cantidad * p.costoUnitario]),
			['', '', 'Subtotal refacciones:', totalParts],
			[],
			['SERVICIOS'],
			['Servicio', 'Precio'],
			...order.serviciosAsignados.map(s => [s.nombre, this.getServicePrice(s, order.tipoVehiculo)]),
			['', `Subtotal servicios: ${this.fmt(totalServices)}`],
			[],
			['TOTAL COTIZACIÓN:', '', '', totalParts + totalServices],
		];

		const ws = XLSX.utils.aoa_to_sheet(rows);
		ws['!cols'] = [{ wch: 36 }, { wch: 12 }, { wch: 18 }, { wch: 14 }];
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Cotización');
		XLSX.writeFile(wb, `Cotizacion_${order.id}_${order.fechaIngreso}.xlsx`);
	}

	// ── PDF ──────────────────────────────────────────────────────────────────────

	exportPdf(order: WorkOrder): void {
		const totalParts    = order.refaccionesAsignadas.reduce((s, p) => s + p.cantidad * p.costoUnitario, 0);
		const totalServices = order.serviciosAsignados.reduce((s, sv) => s + this.getServicePrice(sv, order.tipoVehiculo), 0);
		const totalCotizacion = totalParts + totalServices;
		const fmt = this.fmt.bind(this);

		const doc    = this._pdf.create();
		const pageW  = doc.internal.pageSize.getWidth();
		const margin = 40;
		let y = 60;

		// Título
		doc.setFontSize(22).setFont('helvetica', 'bold').setTextColor(17);
		doc.text('COTIZACIÓN', margin, y);
		y += 20;
		doc.setFontSize(12).setFont('helvetica', 'normal').setTextColor(100);
		doc.text(`Orden de Trabajo: ${order.id}`, margin, y);
		y += 12;
		doc.setDrawColor(220).line(margin, y, pageW - margin, y);
		y += 16;

		// Info cliente / vehículo
		doc.setFontSize(9).setFont('helvetica', 'bold').setTextColor(140);
		doc.text('CLIENTE', margin, y);
		doc.text('VEHÍCULO', pageW / 2, y);
		y += 12;

		doc.setFontSize(11).setFont('helvetica', 'normal').setTextColor(17);
		doc.text(order.cliente, margin, y);
		doc.text(`${order.vehicle.marca} ${order.vehicle.modelo} ${order.vehicle.anio}`, pageW / 2, y);
		y += 14;

		doc.setFontSize(10).setTextColor(85);
		doc.text(`Técnico: ${order.tecnico}`, margin, y);
		doc.text(`Placas: ${order.vehicle.placas || '—'}`, pageW / 2, y);
		y += 12;
		doc.text(`Fecha: ${order.fechaIngreso}`, margin, y);
		doc.text(`Tipo: ${order.tipoVehiculo}`, pageW / 2, y);
		y += 20;

		// Refacciones
		doc.setFontSize(11).setFont('helvetica', 'bold').setTextColor(34);
		doc.text('REFACCIONES E INVENTARIO', margin, y);
		y += 6;

		if (order.refaccionesAsignadas.length > 0) {
			this._pdf.addTable(doc, {
				startY: y,
				margin: { left: margin, right: margin },
				head: [['Refacción', 'Cant.', 'Costo Unit.', 'Subtotal']],
				body: [
					...order.refaccionesAsignadas.map(p => [
						p.nombre, String(p.cantidad), fmt(p.costoUnitario), fmt(p.cantidad * p.costoUnitario),
					]),
					[{ content: 'Subtotal refacciones', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, fmt(totalParts)],
				],
				headStyles:   { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold', fontSize: 10 },
				bodyStyles:   { fontSize: 10 },
				columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
				theme: 'plain',
				tableLineColor: [220, 220, 220],
				tableLineWidth: 0.5,
			});
			y = (doc as any).lastAutoTable.finalY + 18;
		} else {
			doc.setFontSize(10).setFont('helvetica', 'italic').setTextColor(153);
			doc.text('Sin refacciones asignadas.', margin, y + 12);
			y += 30;
		}

		// Servicios
		doc.setFontSize(11).setFont('helvetica', 'bold').setTextColor(34);
		doc.text('SERVICIOS', margin, y);
		y += 6;

		if (order.serviciosAsignados.length > 0) {
			this._pdf.addTable(doc, {
				startY: y,
				margin: { left: margin, right: margin },
				head: [['Servicio', 'Precio']],
				body: [
					...order.serviciosAsignados.map(s => [s.nombre, fmt(this.getServicePrice(s, order.tipoVehiculo))]),
					[{ content: 'Subtotal servicios', styles: { halign: 'right', fontStyle: 'bold' } }, fmt(totalServices)],
				],
				headStyles:   { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold', fontSize: 10 },
				bodyStyles:   { fontSize: 10 },
				columnStyles: { 1: { halign: 'right' } },
				theme: 'plain',
				tableLineColor: [220, 220, 220],
				tableLineWidth: 0.5,
			});
			y = (doc as any).lastAutoTable.finalY + 14;
		} else {
			doc.setFontSize(10).setFont('helvetica', 'italic').setTextColor(153);
			doc.text('Sin servicios asignados.', margin, y + 12);
			y += 30;
		}

		// Total
		doc.setDrawColor(50).line(margin, y, pageW - margin, y);
		y += 18;
		doc.setFontSize(15).setFont('helvetica', 'bold').setTextColor(17);
		doc.text('TOTAL COTIZACIÓN', margin, y);
		doc.text(fmt(totalCotizacion), pageW - margin, y, { align: 'right' });

		doc.save(`Cotizacion_${order.id}_${order.fechaIngreso}.pdf`);
	}
}
