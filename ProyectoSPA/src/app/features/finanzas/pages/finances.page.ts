import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideLayout,
	lucideDollarSign,
	lucideFileText,
	lucideBarChart3,
	lucideLineChart,
} from '@ng-icons/lucide';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { DailyCashComponent } from '../components/daily-cash/daily-cash';
import { AccountsReceivableComponent } from '../components/accounts-receivable/accounts-receivable';
import { AccountsPayableComponent } from '../components/accounts-payable/accounts-payable';
import { ReportsDashboardComponent } from '../components/reports-dashboard/reports-dashboard';
import { ChartsComparativeComponent } from '../components/charts-comparative/charts-comparative';

type FinanceTabType = 'caja' | 'cobrar' | 'pagar' | 'reportes' | 'graficas';

@Component({
	selector: 'app-finanzas-page',
	standalone: true,
	imports: [
		CommonModule,
		NgIcon,
		HlmTabsImports,
		DailyCashComponent,
		AccountsReceivableComponent,
		AccountsPayableComponent,
		ReportsDashboardComponent,
		ChartsComparativeComponent,
	],
	providers: [
		provideIcons({
			lucideLayout,
			lucideDollarSign,
			lucideFileText,
			lucideBarChart3,
			lucideLineChart,
		}),
	],
	template: `
		<div class="detail-page">
			<div class="detail-header">
				<div>
					<h1 class="text-xl font-semibold">Finanzas y Reportes</h1>
					<p class="text-muted-foreground text-sm">Gestión de caja, cuentas y análisis financiero del taller</p>
				</div>
			</div>

			<section hlmTabs [tab]="selectedTab()" class="w-full">
				<div hlmTabsList class="tabs-grid">
					<button hlmTabsTrigger="caja" (click)="selectedTab.set('caja')" class="flex items-center gap-2">
						<ng-icon name="lucideDollarSign" class="w-4 h-4" />
						<span>Caja Diaria</span>
					</button>
					<button hlmTabsTrigger="cobrar" (click)="selectedTab.set('cobrar')" class="flex items-center gap-2">
						<ng-icon name="lucideFileText" class="w-4 h-4" />
						<span>Cuentas por Cobrar</span>
					</button>
					<button hlmTabsTrigger="pagar" (click)="selectedTab.set('pagar')" class="flex items-center gap-2">
						<ng-icon name="lucideFileText" class="w-4 h-4" />
						<span>Cuentas por Pagar</span>
					</button>
					<button hlmTabsTrigger="reportes" (click)="selectedTab.set('reportes')" class="flex items-center gap-2">
						<ng-icon name="lucideBarChart3" class="w-4 h-4" />
						<span>Reportes</span>
					</button>
					<button hlmTabsTrigger="graficas" (click)="selectedTab.set('graficas')" class="flex items-center gap-2">
						<ng-icon name="lucideLineChart" class="w-4 h-4" />
						<span>Análisis Comparativo</span>
					</button>
				</div>

				<div [hlmTabsContent]="'caja'" class="space-y-4 pt-4">
					<app-daily-cash></app-daily-cash>
				</div>

				<div [hlmTabsContent]="'cobrar'" class="space-y-4 pt-4">
					<app-accounts-receivable></app-accounts-receivable>
				</div>

				<div [hlmTabsContent]="'pagar'" class="space-y-4 pt-4">
					<app-accounts-payable></app-accounts-payable>
				</div>

				<div [hlmTabsContent]="'reportes'" class="space-y-4 pt-4">
					<app-reports-dashboard></app-reports-dashboard>
				</div>

				<div [hlmTabsContent]="'graficas'" class="space-y-4 pt-4">
					<app-charts-comparative></app-charts-comparative>
				</div>
			</section>
		</div>
	`,
	styleUrl: './finances.page.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancesPageComponent {
	readonly selectedTab = signal<FinanceTabType>('caja');
}
