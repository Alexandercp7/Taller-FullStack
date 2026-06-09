import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { hlmH2 } from '@spartan-ng/helm/typography';
import {
	lucideDownload,
	lucideFileText,
	lucideTable2,
	lucideBarChart3,
	lucideFile,
	lucideFileSpreadsheet,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { FinancesDataService } from '../../services/finances-data.service';
import { PdfExportService } from '../../services/pdf-export.service';
import { ExcelExportService } from '../../services/excel-export.service';

@Component({
	selector: 'app-reports-dashboard',
	standalone: true,
	imports: [CommonModule, NgIcon, HlmButtonImports, HlmCardImports],
	providers: [
		provideIcons({
			lucideDownload,
			lucideFileText,
			lucideTable2,
			lucideBarChart3,
			lucideFile,
			lucideFileSpreadsheet,
		}),
	],
	template: `
		<div class="space-y-6">
			<div class="space-y-2">
				<h2 class="text-2xl font-bold">Reportes y Exportaciones</h2>
				<p class="text-muted-foreground">Descarga reportes en PDF y Excel con datos reales del sistema</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<div hlmCard class="p-4 flex flex-col">
					<div class="flex items-center gap-2 mb-3">
						<ng-icon name="lucideTable2" class="w-5 h-5 text-blue-600" />
						<h3 class="font-semibold">Caja Diaria</h3>
					</div>
					<p class="text-sm text-muted-foreground mb-4 flex-1">Movimientos de dinero del día</p>
					<div class="flex gap-2">
						<button hlmBtn size="sm" variant="outline" (click)="exportDailyCashPDF()" title="Descargar PDF">
							<ng-icon name="lucideFile" class="w-4 h-4 text-red-600" />
							PDF
						</button>
						<button hlmBtn size="sm" variant="outline" (click)="exportDailyCashExcel()" title="Descargar Excel">
							<ng-icon name="lucideFileSpreadsheet" class="w-4 h-4 text-green-600" />
							Excel
						</button>
					</div>
				</div>

				<div hlmCard class="p-4 flex flex-col">
					<div class="flex items-center gap-2 mb-3">
						<ng-icon name="lucideFileText" class="w-5 h-5 text-green-600" />
						<h3 class="font-semibold">Cuentas por Cobrar</h3>
					</div>
					<p class="text-sm text-muted-foreground mb-4 flex-1">Saldos pendientes de clientes</p>
					<div class="flex gap-2">
						<button hlmBtn size="sm" variant="outline" (click)="exportReceivablesPDF()" title="Descargar PDF">
							<ng-icon name="lucideFile" class="w-4 h-4 text-red-600" />
							PDF
						</button>
						<button hlmBtn size="sm" variant="outline" (click)="exportReceivablesExcel()" title="Descargar Excel">
							<ng-icon name="lucideFileSpreadsheet" class="w-4 h-4 text-green-600" />
							Excel
						</button>
					</div>
				</div>

				<div hlmCard class="p-4 flex flex-col">
					<div class="flex items-center gap-2 mb-3">
						<ng-icon name="lucideFileText" class="w-5 h-5 text-orange-600" />
						<h3 class="font-semibold">Cuentas por Pagar</h3>
					</div>
					<p class="text-sm text-muted-foreground mb-4 flex-1">Adeudos con proveedores</p>
					<div class="flex gap-2">
						<button hlmBtn size="sm" variant="outline" (click)="exportPayablesPDF()" title="Descargar PDF">
							<ng-icon name="lucideFile" class="w-4 h-4 text-red-600" />
							PDF
						</button>
						<button hlmBtn size="sm" variant="outline" (click)="exportPayablesExcel()" title="Descargar Excel">
							<ng-icon name="lucideFileSpreadsheet" class="w-4 h-4 text-green-600" />
							Excel
						</button>
					</div>
				</div>

				<div hlmCard class="p-4 flex flex-col">
					<div class="flex items-center gap-2 mb-3">
						<ng-icon name="lucideBarChart3" class="w-5 h-5 text-purple-600" />
						<h3 class="font-semibold">Resumen de Servicios</h3>
					</div>
					<p class="text-sm text-muted-foreground mb-4 flex-1">Órdenes completadas y análisis</p>
					<div class="flex gap-2">
						<button hlmBtn size="sm" variant="outline" (click)="exportServicesSummaryPDF()" title="Descargar PDF">
							<ng-icon name="lucideFile" class="w-4 h-4 text-red-600" />
							PDF
						</button>
						<button hlmBtn size="sm" variant="outline" (click)="exportServicesSummaryExcel()" title="Descargar Excel">
							<ng-icon name="lucideFileSpreadsheet" class="w-4 h-4 text-green-600" />
							Excel
						</button>
					</div>
				</div>

				<div hlmCard class="p-4 flex flex-col">
					<div class="flex items-center gap-2 mb-3">
						<ng-icon name="lucideBarChart3" class="w-5 h-5 text-red-600" />
						<h3 class="font-semibold">Gastos</h3>
					</div>
					<p class="text-sm text-muted-foreground mb-4 flex-1">Detalles de gastos del período</p>
					<div class="flex gap-2">
						<button hlmBtn size="sm" variant="outline" (click)="exportExpensesExcel()" title="Descargar Excel">
							<ng-icon name="lucideFileSpreadsheet" class="w-4 h-4 text-green-600" />
							Excel
						</button>
					</div>
				</div>
			</div>
		</div>
	`,
	styles: [`
		:host {
			display: block;
		}
	`],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsDashboardComponent {
	private readonly dataService = inject(FinancesDataService);
	private readonly pdfService = inject(PdfExportService);
	private readonly excelService = inject(ExcelExportService);

	exportDailyCashPDF(): void {
		const entries = this.dataService.getDailyCashEntries();
		this.pdfService.exportDailyCash(entries);
	}

	exportDailyCashExcel(): void {
		const entries = this.dataService.getDailyCashEntries();
		this.excelService.exportDailyCash(entries);
	}

	exportReceivablesPDF(): void {
		const accounts = this.dataService.getAccountsReceivable();
		this.pdfService.exportAccountsReceivable(accounts);
	}

	exportReceivablesExcel(): void {
		const accounts = this.dataService.getAccountsReceivable();
		this.excelService.exportAccountsReceivable(accounts);
	}

	exportPayablesPDF(): void {
		const accounts = this.dataService.getAccountsPayable();
		this.pdfService.exportAccountsPayable(accounts);
	}

	exportPayablesExcel(): void {
		const accounts = this.dataService.getAccountsPayable();
		this.excelService.exportAccountsPayable(accounts);
	}

	exportServicesSummaryPDF(): void {
		const workOrders = this.dataService.getCompletedWorkOrders();
		this.pdfService.exportServicesSummary(workOrders);
	}

	exportServicesSummaryExcel(): void {
		const workOrders = this.dataService.getCompletedWorkOrders();
		this.excelService.exportServicesSummary(workOrders);
	}

	exportExpensesExcel(): void {
		const expenses = this.dataService.getExpenses();
		this.excelService.exportExpenses(expenses);
	}
}
