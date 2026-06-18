import { inject, Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { PdfMakerService } from '../../../core';
import type { AssignedServiceItem, WorkOrder } from '../models';

@Injectable({ providedIn: 'root' })
export class QuotationExportService {
	private readonly _pdf = inject(PdfMakerService);

	private getServicePrice(service: AssignedServiceItem, tipoVehiculo: string): number {
		switch (tipoVehiculo) {
			case 'Camioneta':
				return service.precioCamioneta ?? service.precio;
			case 'Camion':
			case 'Camion ':
			case 'CamiÃ³n':
				return service.precioCamion ?? service.precio;
			default:
				return service.precioAuto ?? service.precio;
		}
	}

	private fmtCurrency(n: number): string {
		return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	private fmtDate(value: string | undefined): string {
		if (!value) return '-';
		const [year, month, day] = value.split('T')[0].split('-');
		if (!year || !month || !day) return value;
		return `${day}/${month}/${year}`;
	}

	private splitBullets(text: string | undefined): string[] {
		if (!text?.trim()) return ['-'];
		return text
			.split(/\r?\n+/)
			.flatMap((line) => line.split(/(?<=[.!?;])\s+/))
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line) => (line.startsWith('-') ? line : `- ${line}`));
	}

	private drawSectionTitle(doc: any, title: string, x: number, y: number, width: number): number {
		doc.setFillColor(245, 247, 250);
		doc.roundedRect(x, y, width, 20, 4, 4, 'F');
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(10);
		doc.setTextColor(31, 41, 55);
		doc.text(title, x + 10, y + 13);
		return y + 28;
	}

	private drawLabelValue(doc: any, label: string, value: string, x: number, y: number, labelWidth: number): void {
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(10);
		doc.setTextColor(17, 24, 39);
		doc.text(label, x, y);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(31, 41, 55);
		doc.text(value || '-', x + labelWidth, y);
	}

	exportExcel(order: WorkOrder): void {
		const totalParts = order.refaccionesAsignadas.reduce((s, p) => s + p.cantidad * p.costoUnitario, 0);
		const totalServices = order.serviciosAsignados.reduce((s, sv) => s + this.getServicePrice(sv, order.tipoVehiculo), 0);

		const rows: (string | number)[][] = [
			['COTIZACION - ORDEN DE TRABAJO'],
			[],
			['No. Orden:', order.code || order.id],
			['Cliente:', order.clientData.nombre || order.cliente],
			['Vehiculo:', `${order.vehicle.marca} ${order.vehicle.modelo} ${order.vehicle.anio}`.trim()],
			['Placas:', order.vehicle.placas || '-'],
			['Tecnico:', order.tecnico || '-'],
			['Fecha ingreso:', order.fechaIngreso],
			[],
			['CONCEPTOS'],
			['Cantidad', 'Descripcion', 'Precio Unitario', 'Importe'],
			...order.refaccionesAsignadas.map((p) => [p.cantidad, p.nombre, p.costoUnitario, p.cantidad * p.costoUnitario]),
			...order.serviciosAsignados.map((s) => [1, `Servicio: ${s.nombre}`, this.getServicePrice(s, order.tipoVehiculo), this.getServicePrice(s, order.tipoVehiculo)]),
			['', '', 'Subtotal:', totalParts + totalServices],
		];

		const ws = XLSX.utils.aoa_to_sheet(rows);
		ws['!cols'] = [{ wch: 12 }, { wch: 48 }, { wch: 18 }, { wch: 16 }];
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Cotizacion');
		XLSX.writeFile(wb, `Cotizacion_${order.code || order.id}_${order.fechaIngreso}.xlsx`);
	}

	exportPdf(order: WorkOrder, includeIva = false): void {
		const totalParts = order.refaccionesAsignadas.reduce((sum, part) => sum + part.cantidad * part.costoUnitario, 0);
		const totalServices = order.serviciosAsignados.reduce((sum, service) => sum + this.getServicePrice(service, order.tipoVehiculo), 0);
		const subtotal = totalParts + totalServices;
		const iva = includeIva ? subtotal * 0.16 : 0;
		const total = subtotal + iva;
		const fmt = this.fmtCurrency.bind(this);

		const doc = this._pdf.create();
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const margin = 36;
		const contentWidth = pageWidth - margin * 2;
		const leftColX = margin;
		const rightColX = margin + contentWidth / 2 + 8;
		const colWidth = contentWidth / 2 - 8;
		let y = 36;

		doc.setFillColor(15, 23, 42);
		doc.roundedRect(margin, y, contentWidth, 64, 8, 8, 'F');
		doc.setTextColor(255, 255, 255);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(20);
		doc.text('Cotizacion de Orden de Trabajo', margin + 16, y + 24);
		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.text(`Cliente: ${order.clientData.nombre || order.cliente || '-'}`, margin + 16, y + 42);
		doc.text(`Vehiculo: ${`${order.vehicle.marca} ${order.vehicle.modelo}`.trim() || '-'}`, margin + 16, y + 56);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(11);
		doc.text(`OT No. ${order.code || order.id}`, pageWidth - margin - 16, y + 26, { align: 'right' });
		doc.setFont('helvetica', 'normal');
		doc.text(`Fecha ingreso: ${this.fmtDate(order.fechaIngreso)}`, pageWidth - margin - 16, y + 42, { align: 'right' });

		y += 72;
		y = this.drawSectionTitle(doc, 'Datos generales', margin, y, contentWidth);

		this.drawLabelValue(doc, 'Cliente:', order.clientData.nombre || order.cliente || '-', leftColX, y, 72);
		this.drawLabelValue(doc, 'Telefono:', order.clientData.telefono || '-', rightColX, y, 72);
		y += 16;
		this.drawLabelValue(doc, 'Correo:', order.clientData.correo || '-', leftColX, y, 72);
		this.drawLabelValue(doc, 'Tipo:', order.tipoVehiculo || '-', rightColX, y, 72);
		y += 16;
		this.drawLabelValue(doc, 'Vehiculo:', `${order.vehicle.marca} - ${order.vehicle.modelo}`.trim() || '-', leftColX, y, 72);
		this.drawLabelValue(doc, 'Placas:', order.vehicle.placas || '-', rightColX, y, 72);
		y += 16;
		this.drawLabelValue(doc, 'Año:', order.vehicle.anio ? String(order.vehicle.anio) : '-', leftColX, y, 72);
		this.drawLabelValue(doc, 'VIN:', order.vehicle.vin || '-', rightColX, y, 72);
		y += 16;
		this.drawLabelValue(doc, 'Fecha programada:', this.fmtDate(order.fechaProgramada), leftColX, y, 110);

		y += 28;
		y = this.drawSectionTitle(doc, 'Reporte tecnico', margin, y, contentWidth);

		doc.setFont('helvetica', 'bold');
		doc.setFontSize(10);
		doc.setTextColor(17, 24, 39);
		doc.text('Fallas reportadas', leftColX, y);
		doc.text('Diagnostico / trabajos realizados', rightColX, y);
		y += 8;

		const issueLines = doc.splitTextToSize(this.splitBullets(order.problema).join('\n'), colWidth);
		const diagnosisLines = doc.splitTextToSize(this.splitBullets(order.diagnostico).join('\n'), colWidth);
		const reportHeight = Math.max(issueLines.length, diagnosisLines.length) * 12 + 18;

		doc.setDrawColor(226, 232, 240);
		doc.roundedRect(leftColX, y, colWidth, reportHeight, 6, 6);
		doc.roundedRect(rightColX, y, colWidth, reportHeight, 6, 6);
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(9);
		doc.setTextColor(31, 41, 55);
		doc.text(issueLines, leftColX + 10, y + 14);
		doc.text(diagnosisLines, rightColX + 10, y + 14);
		y += reportHeight + 18;

		y = this.drawSectionTitle(doc, 'Conceptos cotizados', margin, y, contentWidth);

		const conceptRows: Array<[string, string, string, string]> = [
			...order.refaccionesAsignadas.map<[string, string, string, string]>((part) => [
				String(part.cantidad),
				part.nombre,
				fmt(part.costoUnitario),
				fmt(part.cantidad * part.costoUnitario),
			]),
			...order.serviciosAsignados.map<[string, string, string, string]>((service) => {
				const amount = this.getServicePrice(service, order.tipoVehiculo);
				return ['1', `Servicio: ${service.nombre}`, fmt(amount), fmt(amount)];
			}),
		];

		this._pdf.addTable(doc, {
			startY: y,
			margin: { left: margin, right: margin },
			head: [['Cantidad', 'Descripcion', 'Precio Unitario', 'Importe']],
			body: conceptRows.length > 0 ? conceptRows : [['-', 'Sin conceptos asignados', '-', '-']],
			theme: 'grid',
			styles: {
				fontSize: 9,
				cellPadding: 6,
				lineColor: [226, 232, 240],
				lineWidth: 0.5,
				textColor: [31, 41, 55],
			},
			headStyles: {
				fillColor: [241, 245, 249],
				textColor: [15, 23, 42],
				fontStyle: 'bold',
			},
			columnStyles: {
				0: { halign: 'center', cellWidth: 58 },
				1: { cellWidth: 292 },
				2: { halign: 'right', cellWidth: 102 },
				3: { halign: 'right', cellWidth: 92 },
			},
		});

		y = (doc as any).lastAutoTable.finalY + 18;
		const totalsBoxWidth = 190;
		const totalsX = pageWidth - margin - totalsBoxWidth;

		doc.setFillColor(248, 250, 252);
		doc.roundedRect(totalsX, y, totalsBoxWidth, 62, 8, 8, 'F');
		doc.setDrawColor(203, 213, 225);
		doc.roundedRect(totalsX, y, totalsBoxWidth, 62, 8, 8);
		doc.setFontSize(10);
		doc.setTextColor(71, 85, 105);
		doc.setFont('helvetica', 'normal');
		doc.text('Subtotal:', totalsX + 12, y + 18);
		doc.text(fmt(subtotal), totalsX + totalsBoxWidth - 12, y + 18, { align: 'right' });
		doc.text('IVA:', totalsX + 12, y + 34);
		doc.text(includeIva ? fmt(iva) : 'No incluido', totalsX + totalsBoxWidth - 12, y + 34, { align: 'right' });
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(15, 23, 42);
		doc.text('Total:', totalsX + 12, y + 50);
		doc.text(fmt(total), totalsX + totalsBoxWidth - 12, y + 50, { align: 'right' });

		doc.save(`Cotizacion_${order.code || order.id}_${order.fechaIngreso}.pdf`);
	}
}
