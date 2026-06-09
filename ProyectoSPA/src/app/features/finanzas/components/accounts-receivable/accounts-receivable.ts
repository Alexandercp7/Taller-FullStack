import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideCheck, lucideX, lucideClock } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { FinancesDataService } from '../../services/finances-data.service';
import type { AccountReceivable, ReceivableStatus } from '../../models/finances.models';

@Component({
	selector: 'app-accounts-receivable',
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
					<h2 class="text-2xl font-bold">Cuentas por Cobrar</h2>
					<p class="text-sm text-muted-foreground">Registro de clientes con pagos pendientes</p>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div hlmCard class="p-4">
					<div class="text-sm text-muted-foreground mb-2">Total a Cobrar</div>
					<div hlmCardTitle class="text-2xl text-success">{{ summary().total | currency:'MXN':'symbol':'1.0-0' }}</div>
				</div>
				<div hlmCard class="p-4">
					<div class="text-sm text-muted-foreground mb-2">Pendiente</div>
					<div hlmCardTitle class="text-2xl">{{ summary().pendiente | currency:'MXN':'symbol':'1.0-0' }}</div>
				</div>
				<div hlmCard class="p-4">
					<div class="text-sm text-muted-foreground mb-2">Pagado</div>
					<div hlmCardTitle class="text-2xl">{{ summary().pagado | currency:'MXN':'symbol':'1.0-0' }}</div>
				</div>
				<div hlmCard class="p-4">
					<div class="text-sm text-muted-foreground mb-2">Vencido</div>
					<div hlmCardTitle class="text-2xl">{{ summary().vencido | currency:'MXN':'symbol':'1.0-0' }}</div>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div hlmCard class="p-4">
					<div class="text-xs font-semibold text-[var(--warning-foreground)] mb-2">PENDIENTE</div>
					<div hlmCardTitle class="text-2xl">{{ summary().countPendiente }}</div>
				</div>
				<div hlmCard class="p-4">
					<div class="text-xs font-semibold text-[var(--primary)] mb-2">PARCIAL</div>
					<div hlmCardTitle class="text-2xl">{{ summary().countParcial }}</div>
				</div>
				<div hlmCard class="p-4">
					<div class="text-xs font-semibold text-[var(--success-foreground)] mb-2">PAGADO</div>
					<div hlmCardTitle class="text-2xl">{{ summary().countPagado }}</div>
				</div>
				<div hlmCard class="p-4">
					<div class="text-xs font-semibold text-[var(--destructive-foreground)] mb-2">VENCIDO</div>
					<div hlmCardTitle class="text-2xl">{{ summary().countVencido }}</div>
				</div>
			</div>

			<div>
				<h3 class="font-semibold mb-3">Detalle de Cuentas</h3>
				<div hlmCard>
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="border-b">
								<tr>
									<th class="text-left p-3">Cliente</th>
									<th class="text-left p-3">Referencia</th>
									<th class="text-right p-3">Total</th>
									<th class="text-right p-3">Pagado</th>
									<th class="text-right p-3">Pendiente</th>
									<th class="text-left p-3">Estado</th>
									<th class="text-left p-3">Vence</th>
									<th class="text-center p-3">Acción</th>
								</tr>
							</thead>
							<tbody>
								<tr *ngFor="let account of accounts()" class="border-b hover:bg-muted">
									<td class="p-3 font-medium">{{ account.cliente }}</td>
									<td class="p-3 text-xs">{{ account.otId }}</td>
									<td class="p-3 text-right font-semibold">{{ account.monto | currency:'MXN':'symbol':'1.0-0' }}</td>
									<td class="p-3 text-right">{{ account.montoRecibido | currency:'MXN':'symbol':'1.0-0' }}</td>
									<td class="p-3 text-right font-bold" [class.text-[var(--destructive-foreground)]]="account.montoPendiente > 0">{{ account.montoPendiente | currency:'MXN':'symbol':'1.0-0' }}</td>
									<td class="p-3">
										<span class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full" [ngClass]="getStatusClass(account.estado)">
											<ng-icon [name]="getStatusIcon(account.estado)" class="w-3 h-3" />
											{{ account.estado }}
										</span>
									</td>
									<td class="p-3 text-xs">{{ account.fechaVencimiento }}</td>
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
				<div hlmCard class="p-4 bg-[var(--info)]">
					<h3 class="font-semibold mb-2">Información General</h3>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span>Total Documentos:</span>
							<span class="font-bold">{{ accounts().length }}</span>
						</div>
						<div class="flex justify-between">
							<span>% Cobrado:</span>
							<span class="font-bold">{{ summary().porcentajeCobrado }}%</span>
						</div>
						<div class="flex justify-between">
							<span>Promedio por Documento:</span>
							<span class="font-bold">{{ summary().promedio | currency:'MXN':'symbol':'1.0-0' }}</span>
						</div>
					</div>
				</div>
				<div hlmCard class="p-4 bg-[var(--destructive-border)]">
					<h3 class="font-semibold mb-2">Cuentas Vencidas</h3>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span>Cuentas Vencidas:</span>
							<span class="font-bold text-[var(--destructive-foreground)]">{{ summary().countVencido }}</span>
						</div>
						<div class="flex justify-between">
							<span>Monto Vencido:</span>
							<span class="font-bold text-[var(--destructive-foreground)]">{{ summary().vencido | currency:'MXN':'symbol':'1.0-0' }}</span>
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
export class AccountsReceivableComponent {
	private readonly dataService = inject(FinancesDataService);

	readonly accounts = this.dataService.accountsReceivable;

	readonly summary = computed(() => {
		const data = this.accounts();
		const total = data.reduce((sum, a) => sum + a.monto, 0);
		const pagado = data.reduce((sum, a) => sum + a.montoRecibido, 0);
		const pendiente = data.filter((a) => a.estado === 'Pendiente').reduce((sum, a) => sum + a.montoPendiente, 0);
		const parcial = data.filter((a) => a.estado === 'Parcial').reduce((sum, a) => sum + a.montoPendiente, 0);
		const vencido = data.filter((a) => a.estado === 'Vencido').reduce((sum, a) => sum + a.montoPendiente, 0);
		const countPendiente = data.filter((a) => a.estado === 'Pendiente').length;
		const countParcial = data.filter((a) => a.estado === 'Parcial').length;
		const countPagado = data.filter((a) => a.estado === 'Pagado').length;
		const countVencido = data.filter((a) => a.estado === 'Vencido').length;

		return {
			total,
			pagado,
			pendiente: pendiente + parcial,
			vencido,
			countPendiente,
			countParcial,
			countPagado,
			countVencido,
			porcentajeCobrado: Math.round((pagado / total) * 100) || 0,
			promedio: total / data.length || 0,
		};
	});

	getStatusClass(status: ReceivableStatus): string {
		const classes: Record<ReceivableStatus, string> = {
			Pendiente: 'bg-[var(--warning)] text-[var(--warning-foreground)]',
			Parcial: 'bg-[var(--primary)] text-[var(--primary-foreground)]',
			Pagado: 'bg-[var(--success)] text-[var(--success-foreground)]',
			Vencido: 'bg-[var(--destructive-border)] text-[var(--destructive-foreground)]',
		};
		return classes[status] || classes['Pendiente'];
	}

	getStatusIcon(status: ReceivableStatus): string {
		const icons: Record<ReceivableStatus, string> = {
			Pendiente: 'lucideClock',
			Parcial: 'lucideClock',
			Pagado: 'lucideCheck',
			Vencido: 'lucideX',
		};
		return icons[status] || 'lucideClock';
	}
}
