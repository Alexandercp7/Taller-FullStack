import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideCheck, lucideX, lucideClock } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { FinancesDataService } from '../../services/finances-data.service';
import type { AccountPayable, PayableStatus } from '../../models/finances.models';

@Component({
	selector: 'app-accounts-payable',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		NgIcon,
		HlmButtonImports,
		HlmCardImports,
	],
	providers: [
		provideIcons({
			lucidePlus,
			lucideCheck,
			lucideX,
			lucideClock,
		}),
	],
	template: `
		<div class="space-y-6">
			<div class="flex justify-between items-start">
				<div>
					<h2 class="text-2xl font-bold">Cuentas por Pagar</h2>
					<p class="text-sm text-muted-foreground">Adeudos con proveedores y obligaciones pendientes</p>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div hlmCard class="p-4">
					<div class="text-sm text-muted-foreground mb-2">Total Adeudado</div>
					<div hlmCardTitle class="text-2xl">{{ summary().total | currency:'MXN':'symbol':'1.0-0' }}</div>
				</div>
				<div hlmCard class="p-4">
					<div class="text-sm text-muted-foreground mb-2">Pagado</div>
					<div hlmCardTitle class="text-2xl">{{ summary().pagado | currency:'MXN':'symbol':'1.0-0' }}</div>
				</div>
				<div hlmCard class="p-4">
					<div class="text-sm text-muted-foreground mb-2">Pendiente</div>
					<div hlmCardTitle class="text-2xl" >{{ summary().pendiente | currency:'MXN':'symbol':'1.0-0' }}</div>
				</div>
				<div hlmCard class="p-4">
					<div class="text-sm text-muted-foreground mb-2">Vencido</div>
					<div hlmCardTitle class="text-2xl">{{ summary().vencido | currency:'MXN':'symbol':'1.0-0' }}</div>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div hlmCard class="p-4">
					<div class="text-xs font-semibold mb-2" [style.color]="'var(--warning-foreground)'">PENDIENTE</div>
					<div hlmCardTitle class="text-2xl">{{ summary().countPendiente }}</div>
				</div>
				<div hlmCard class="p-4">
					<div class="text-xs font-semibold mb-2" [style.color]="'var(--info-foreground)'">PARCIAL</div>
					<div hlmCardTitle class="text-2xl">{{ summary().countParcial }}</div>
				</div>
				<div hlmCard class="p-4">
					<div class="text-xs font-semibold mb-2" [style.color]="'var(--success-foreground)'">PAGADO</div>
					<div hlmCardTitle class="text-2xl">{{ summary().countPagado }}</div>
				</div>
				<div hlmCard class="p-4">
					<div class="text-xs font-semibold mb-2" [style.color]="'var(--destructive-foreground)'">VENCIDO</div>
					<div hlmCardTitle class="text-2xl">{{ summary().countVencido }}</div>
				</div>
			</div>

			<div>
				<h3 class="font-semibold mb-3">Detalle de Adeudos</h3>
				<div hlmCard>
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="border-b">
								<tr>
									<th class="text-left p-3">Proveedor</th>
									<th class="text-left p-3">Concepto</th>
									<th class="text-right p-3">Total</th>
									<th class="text-right p-3">Pagado</th>
									<th class="text-right p-3">Pendiente</th>
									<th class="text-left p-3">Estado</th>
									<th class="text-left p-3">Vence</th>
									<th class="text-center p-3">Acción</th>
								</tr>
							</thead>
							<tbody>
								<tr *ngFor="let payable of payables()" class="border-b hover:bg-muted">
									<td class="p-3 font-medium">{{ payable.proveedor }}</td>
									<td class="p-3 text-xs">{{ payable.concepto }}</td>
									<td class="p-3 text-right font-semibold">{{ payable.monto | currency:'MXN':'symbol':'1.0-0' }}</td>
									<td class="p-3 text-right">{{ payable.montoPagado | currency:'MXN':'symbol':'1.0-0' }}</td>
									<td class="p-3 text-right font-bold" [style.color]="payable.montoPendiente > 0 ? 'var(--destructive-foreground)' : 'inherit'">{{ payable.montoPendiente | currency:'MXN':'symbol':'1.0-0' }}</td>
									<td class="p-3">
										<span class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full" [attr.style]="getStatusClass(payable.estado)">
											<ng-icon [name]="getStatusIcon(payable.estado)" class="w-3 h-3" />
											{{ payable.estado }}
										</span>
									</td>
									<td class="p-3 text-xs">{{ payable.fechaVencimiento }}</td>
									<td class="p-3 text-center">
										<button hlmBtn variant="ghost" size="sm" title="Ver detalles">
											•••
										</button>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div hlmCard class="p-4" [style.backgroundColor]="'var(--info)'">
					<h3 class="font-semibold mb-2">Información General</h3>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span>Total Facturas:</span>
							<span class="font-bold">{{ payables().length }}</span>
						</div>
						<div class="flex justify-between">
							<span>% Pagado:</span>
							<span class="font-bold">{{ summary().porcentajePagado }}%</span>
						</div>
						<div class="flex justify-between">
							<span>Promedio por Factura:</span>
							<span class="font-bold">{{ summary().promedio | currency:'MXN':'symbol':'1.0-0' }}</span>
						</div>
					</div>
				</div>
				<div hlmCard class="p-4 bg-[var(--destructive-border)]">
					<h3 class="font-semibold mb-2">Cuentas Vencidas</h3>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span>Facturas Vencidas:</span>
							<span class="font-bold text-[var(--destructive-foreground)]">{{ summary().countVencido }}</span>
						</div>
						<div class="flex justify-between">
							<span>Monto Vencido:</span>
							<span class="font-bold text-[var(--destructive-foreground)]" >{{ summary().vencido | currency:'MXN':'symbol':'1.0-0' }}</span>
						</div>
						<div class="flex justify-between">
							<span>% del Total:</span>
							<span class="font-bold text-[var(--destructive-foreground)]">{{ ((summary().vencido / summary().total) * 100 | number: '1.0-0') }}%</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsPayableComponent {
	private readonly dataService = inject(FinancesDataService);

	readonly payables = this.dataService.accountsPayable;

	readonly summary = computed(() => {
		const data = this.payables();
		const total = data.reduce((sum, p) => sum + p.monto, 0);
		const pagado = data.reduce((sum, p) => sum + p.montoPagado, 0);
		const pendiente = data.filter((p) => p.estado === 'Pendiente').reduce((sum, p) => sum + p.montoPendiente, 0);
		const parcial = data.filter((p) => p.estado === 'Parcial').reduce((sum, p) => sum + p.montoPendiente, 0);
		const vencido = data.filter((p) => p.estado === 'Vencido').reduce((sum, p) => sum + p.montoPendiente, 0);
		const countPendiente = data.filter((p) => p.estado === 'Pendiente').length;
		const countParcial = data.filter((p) => p.estado === 'Parcial').length;
		const countPagado = data.filter((p) => p.estado === 'Pagado').length;
		const countVencido = data.filter((p) => p.estado === 'Vencido').length;

		return {
			total,
			pagado,
			pendiente: pendiente + parcial,
			vencido,
			countPendiente,
			countParcial,
			countPagado,
			countVencido,
			porcentajePagado: Math.round((pagado / total) * 100) || 0,
			promedio: total / data.length || 0,
		};
	});

	getStatusClass(status: PayableStatus): string {
		const statusColors: Record<PayableStatus, { bg: string; text: string }> = {
			Pendiente: { bg: 'var(--warning)', text: 'var(--warning-foreground)' },
			Parcial: { bg: 'var(--primary)', text: 'var(--primary-foreground)' },
			Pagado: { bg: 'var(--success)', text: 'var(--success-foreground)' },
			Vencido: { bg: 'var(--destructive-border)', text: 'var(--destructive-foreground)' },
		};
		const colors = statusColors[status] || statusColors['Pendiente'];
		return `background-color: ${colors.bg}; color: ${colors.text};`;
	}

	getStatusIcon(status: PayableStatus): string {
		const icons: Record<PayableStatus, string> = {
			Pendiente: 'lucideClock',
			Parcial: 'lucideClock',
			Pagado: 'lucideCheck',
			Vencido: 'lucideX',
		};
		return icons[status] || 'lucideClock';
	}
}
