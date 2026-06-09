import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ChangeDetectorRef } from '@angular/core';
import {
	lucidePlus,
	lucideTrash2,
	lucideArrowUpRight,
	lucideArrowDownLeft,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { FinancesDataService } from '../../services/finances-data.service';
import type { DailyCashEntry, PaymentMethod, CashTransactionType } from '../../models/finances.models';
import { HlmInput } from "@spartan-ng/helm/input";

@Component({
	selector: 'app-daily-cash',
	standalone: true,
	imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    HlmButtonImports,
    HlmCardImports,
    HlmSelectImports,
    HlmInput
],
	providers: [
		provideIcons({
			lucidePlus,
			lucideTrash2,
			lucideArrowUpRight,
			lucideArrowDownLeft,
		}),
	],
	template: `
		<div class="space-y-6">
			<div class="flex justify-between items-start">
				<div>
					<h2 class="text-2xl font-bold">Caja Diaria</h2>
					<p class="text-sm text-muted-foreground">Registro de movimientos de dinero actuales</p>
				</div>
				<button
					hlmBtn
					(click)="toggleForm()"
					class="gap-2"
				>
					<ng-icon name="lucidePlus" />
					Nuevo Movimiento
				</button>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div hlmCard class="p-4">
					<div class="text-sm mb-2">Ingresos</div>
					<div hlmCardTitle class="text-2xl">{{ summary().ingresos | currency:'MXN':'symbol':'1.0-0' }}</div>
				</div>
				<div hlmCard class="p-4">
					<div class="text-sm mb-2">Egresos</div>
					<div hlmCardTitle class="text-2xl">{{ summary().egresos | currency:'MXN':'symbol':'1.0-0' }}</div>
				</div>
				<div hlmCard class="p-4">
					<div class="text-sm mb-2">Saldo</div>
					<div hlmCardTitle class="text-2xl" [class.text-emerald-600]="summary().saldo >= 0" [class.text-[var(--destructive)]]="summary().saldo < 0">
						{{ summary().saldo | currency:'MXN':'symbol':'1.0-0' }}
					</div>
				</div>
				<div hlmCard class="p-4">
					<div class="text-sm text-muted-foreground mb-2">Movimientos</div>
					<div hlmCardTitle class="text-2xl">{{ entries().length }}</div>
				</div>
			</div>

			<div *ngIf="showForm()" hlmCard class="p-6">
				<h3 class="font-semibold mb-4">Nuevo Movimiento</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="text-sm font-medium mb-2 block">Tipo</label>
						<hlm-select [value]="formData.tipo" (valueChange)="onTipoChange($event)">
							<hlm-select-trigger class="w-full">
								<hlm-select-value placeholder="Selecciona tipo" />
							</hlm-select-trigger>
					
							<hlm-select-content *hlmSelectPortal>
								<hlm-select-group>
									<hlm-select-item value="Ingreso">Ingreso</hlm-select-item>
									<hlm-select-item value="Egreso">Egreso</hlm-select-item>
								</hlm-select-group>
							</hlm-select-content>
						</hlm-select>
					</div>
					<div>
						<label class="text-sm font-medium mb-2 block">Concepto</label>
						<input hlmInput [(ngModel)]="formData.concepto" type="text" placeholder="Descripción" class="w-full" />
					</div>
					<div>
						<label class="text-sm font-medium mb-2 block">Monto</label>
						<input hlmInput [(ngModel)]="formData.monto" type="number" placeholder="0.00" step="0.01" class="w-full" />
					</div>
					<div>
						<label class="text-sm font-medium mb-2 block">Método</label>
						<hlm-select [value]="formData.metodoPago" (valueChange)="onMetodoChange($event)">
							<hlm-select-trigger class="w-full">
								<hlm-select-value placeholder="Selecciona método" />
							</hlm-select-trigger>
					
							<hlm-select-content *hlmSelectPortal>
								<hlm-select-group>
									<hlm-select-item value="Efectivo">Efectivo</hlm-select-item>
									<hlm-select-item value="Transferencia">Transferencia</hlm-select-item>
									<hlm-select-item value="Tarjeta">Tarjeta</hlm-select-item>
								</hlm-select-group>
							</hlm-select-content>
						</hlm-select>
					</div>
				</div>
				<div class="flex gap-2 mt-4">
					<button hlmBtn variant="outline" (click)="toggleForm()">Cancelar</button>
					<button hlmBtn (click)="addEntry()">Guardar</button>
				</div>
			</div>

			<div>
				<h3 class="font-semibold mb-3">Desglose por Método de Pago</h3>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div hlmCard class="p-4">
						<div class="text-sm text-muted-foreground">Efectivo</div>
						<div hlmCardTitle class="text-xl">{{ summary().efectivo | currency:'MXN':'symbol':'1.0-0' }}</div>
					</div>
					<div hlmCard class="p-4">
						<div class="text-sm text-muted-foreground">Transferencia</div>
						<div hlmCardTitle class="text-xl">{{ summary().transferencia | currency:'MXN':'symbol':'1.0-0' }}</div>
					</div>
					<div hlmCard class="p-4">
						<div class="text-sm text-muted-foreground">Tarjeta</div>
						<div hlmCardTitle class="text-xl">{{ summary().tarjeta | currency:'MXN':'symbol':'1.0-0' }}</div>
					</div>
				</div>
			</div>

			<div>
				<h3 class="font-semibold mb-3">Movimientos Recientes</h3>
				<div hlmCard>
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="border-b">
								<tr>
									<th class="text-left p-3">Fecha</th>
									<th class="text-left p-3">Concepto</th>
									<th class="text-left p-3">Tipo</th>
									<th class="text-right p-3">Monto</th>
									<th class="text-left p-3">Método</th>
									<th class="text-center p-3">Acción</th>
								</tr>
							</thead>
							<tbody>
								<tr *ngFor="let entry of entries()" class="border-b hover:bg-muted">
									<td class="p-3 text-xs">{{ entry.fecha }}</td>
									<td class="p-3">{{ entry.concepto }}</td>
									<td class="p-3">
										<span class="inline-flex items-center gap-1 text-xs" [class.text-green-600]="entry.tipo === 'Ingreso'" [class.text-red-600]="entry.tipo === 'Egreso'">
											<ng-icon [name]="entry.tipo === 'Ingreso' ? 'lucideArrowUpRight' : 'lucideArrowDownLeft'" class="w-3 h-3" />
											{{ entry.tipo }}
										</span>
									</td>
									<td class="p-3 text-right font-semibold text-xs" [class.text-green-600]="entry.tipo === 'Ingreso'" [class.text-red-600]="entry.tipo === 'Egreso'">
										{{ (entry.tipo === 'Ingreso' ? entry.monto : entry.monto) | currency:'MXN':'symbol':'1.0-0' }}
									</td>
									<td class="p-3 text-xs">{{ entry.metodoPago }}</td>
									<td class="p-3 text-center">
										<button hlmBtn variant="ghost" size="sm" (click)="deleteEntry(entry.id)">
											<ng-icon name="lucideTrash2" class="w-4 h-4 text-red-500" />
										</button>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyCashComponent {
	private readonly dataService = inject(FinancesDataService);
	private readonly cdr = inject(ChangeDetectorRef);

	readonly showForm = signal(false);
	readonly entries = this.dataService.dailyCashEntries;

	formData = {
		concepto: '',
		tipo: 'Ingreso' as CashTransactionType,
		monto: 0,
		metodoPago: 'Efectivo' as PaymentMethod,
		referencia: '',
		notas: '',
		usuario: 'Usuario',
	};

	readonly summary = computed(() => {
		const data = this.entries();
		const ingresos = data.filter((e) => e.tipo === 'Ingreso').reduce((sum, e) => sum + e.monto, 0);
		const egresos = data.filter((e) => e.tipo === 'Egreso').reduce((sum, e) => sum + e.monto, 0);
		const efectivo = data.filter((e) => e.metodoPago === 'Efectivo').reduce((sum, e) => sum + (e.tipo === 'Ingreso' ? e.monto : -e.monto), 0);
		const transferencia = data.filter((e) => e.metodoPago === 'Transferencia').reduce((sum, e) => sum + (e.tipo === 'Ingreso' ? e.monto : -e.monto), 0);
		const tarjeta = data.filter((e) => e.metodoPago === 'Tarjeta').reduce((sum, e) => sum + (e.tipo === 'Ingreso' ? e.monto : -e.monto), 0);

		return {
			ingresos,
			egresos,
			saldo: ingresos - egresos,
			efectivo,
			transferencia,
			tarjeta,
		};
	});

	toggleForm(): void {
		this.showForm.update((v) => !v);
	}

	addEntry(): void {
		if (!this.formData.concepto || this.formData.monto <= 0) {
			alert('Completa concepto y monto');
			return;
		}

		this.dataService.addDailyCashEntry({
			id: `cash-${Date.now()}`,
			fecha: new Date().toISOString().split('T')[0],
			concepto: this.formData.concepto,
			tipo: this.formData.tipo,
			monto: this.formData.monto,
			metodoPago: this.formData.metodoPago,
			referencia: this.formData.referencia,
			notas: this.formData.notas,
			usuario: this.formData.usuario,
		});

		this.resetForm();
		this.showForm.set(false);
	}

	deleteEntry(id: string): void {
		if (confirm('¿Eliminar este movimiento?')) {
			this.dataService.removeDailyCashEntry(id);
		}
	}

	onTipoChange(value: any): void {
		this.formData.tipo = value as CashTransactionType;
		this.cdr.detectChanges();
	}

	onMetodoChange(value: any): void {
		this.formData.metodoPago = value as PaymentMethod;
		this.cdr.detectChanges(); 
	}

	private resetForm(): void {
		this.formData = {
			concepto: '',
			tipo: 'Ingreso',
			monto: 0,
			metodoPago: 'Efectivo',
			referencia: '',
			notas: '',
			usuario: 'Usuario',
		};
	}
}
