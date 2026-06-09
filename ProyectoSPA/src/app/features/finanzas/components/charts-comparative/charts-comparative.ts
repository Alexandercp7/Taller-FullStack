import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmCard }	from '@spartan-ng/helm/card';
import {
	lucideBarChart3,
	lucideLineChart,
	lucideTrendingUp,
	lucideTrendingDown,
} from '@ng-icons/lucide';
import { FinancesService } from '../../services/finances.service';

@Component({
	selector: 'app-charts-comparative',
	standalone: true,
	imports: [CommonModule, NgIcon, HlmCard],
	providers: [
		provideIcons({
			lucideBarChart3,
			lucideLineChart,
			lucideTrendingUp,
			lucideTrendingDown,
		}),
	],
	template: `
		<div class="charts-container">
			<div class="header-section">
				<div class="title">
					<h2>Análisis Comparativo</h2>
					<p>Datos mes a mes y servicios más solicitados</p>
				</div>
			</div>

			<div class="section">
				<h3>Comparación Mensual</h3>
				<div hlmCard>
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="border-b bg-muted">
								<tr>
									<th class="text-left p-3">Mes</th>
									<th class="text-right p-3">Ingresos</th>
									<th class="text-right p-3">Egresos</th>
									<th class="text-right p-3">Saldo</th>
									<th class="text-center p-3">OTs</th>
									<th class="text-center p-3">Tendencia</th>
								</tr>
							</thead>
							<tbody>
								<tr
									*ngFor="let month of monthComparatives(); let i = index"
									class="border-b hover:bg-muted"
								>
									<td class="p-3 font-medium">{{ month.mes }}</td>
									<td class="p-3 text-right" [style.color]="'var(--success-foreground)'">\${{ month.ingresos | number }}</td>
									<td class="p-3 text-right" [style.color]="'var(--destructive-foreground)'">\${{ month.egresos | number }}</td>
									<td
										class="p-3 text-right font-semibold"
										[style.color]="month.saldo > 0 ? 'var(--success-foreground)' : 'var(--destructive-foreground)'"
									>
										\${{ month.saldo | number }}
									</td>
									<td class="p-3 text-center">{{ month.otsCantidad }}</td>
									<td class="p-3 text-center">
										<div
											class="inline-flex items-center gap-1 text-xs"
											[style.color]="i > 0 && month.ingresos > monthComparatives()[i - 1].ingresos ? 'var(--success-foreground)' : 'var(--destructive-foreground)'"
										>
											<ng-icon
												[name]="i > 0 && month.ingresos > monthComparatives()[i - 1].ingresos ? 'lucideTrendingUp' : 'lucideTrendingDown'"
												class="w-4 h-4"
											/>
										</div>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div class="section">
				<h3>Servicios Más Solicitados</h3>
				<div class="services-grid">
					<div hlmCard
						*ngFor="let service of servicesPopularity()"
						class="service-card"
						[class.trending-up]="service.tendencia === 'up'"
						[class.trending-stable]="service.tendencia === 'stable'"
						[class.trending-down]="service.tendencia === 'down'"
					>
						<div class="service-header">
							<h4>{{ service.servicio }}</h4>
							<div class="trend-badge" [class]="'trend-' + service.tendencia">
								<ng-icon
									[name]="service.tendencia === 'up' ? 'lucideTrendingUp' : service.tendencia === 'down' ? 'lucideTrendingDown' : 'lucideLineChart'"
								/>
								{{ service.tendencia === 'up' ? 'Subida' : service.tendencia === 'down' ? 'Baja' : 'Estable' }}
							</div>
						</div>

						<div class="service-stats">
							<div class="stat-item">
								<span class="stat-label">Cantidad</span>
								<span class="stat-value">{{ service.cantidad }}</span>
							</div>
							<div class="stat-item">
								<span class="stat-label">Ingreso</span>
								<span class="stat-value">\${{ service.ingresoTotal | number }}</span>
							</div>
							<div class="stat-item">
								<span class="stat-label">% del Total</span>
								<span class="stat-value">{{ service.porcentaje | number: '1.1-1' }}%</span>
							</div>
						</div>

						<div class="progress-bar">
							<div class="progress-fill" [style.width.%]="service.porcentaje"></div>
						</div>
					</div>
				</div>
			</div>

			<div class="section">
				<h3>Aspectos Destacados</h3>
				<div class="highlights-grid">
					<div hlmCard class="highlight-card">
						<span class="highlight-label">Ingreso Total (6 meses)</span>
						<span class="highlight-value">\${{ totalIncome() | number }}</span>
						<span class="highlight-trend positive">
							<ng-icon name="lucideTrendingUp" />
							Crecimiento positivo
						</span>
					</div>

					<div hlmCard class="highlight-card">
						<span class="highlight-label">Gasto Total (6 meses)</span>
						<span class="highlight-value">\${{ totalExpenses() | number }}</span>
						<span class="highlight-trend">
							Bajo control
						</span>
					</div>

					<div hlmCard class="highlight-card">
						<span class="highlight-label">Saldo Neto (6 meses)</span>
						<span class="highlight-value" [class.positive]="totalBalance() > 0">
							\${{ totalBalance() | number }}
						</span>
						<span class="highlight-trend positive">
							Rentabilidad
						</span>
					</div>

					<div hlmCard class="highlight-card">
						<span class="highlight-label">Servicio #1</span>
						<span class="highlight-value">{{ getMostPopularService().servicio }}</span>
						<span class="highlight-detail">
							{{ getMostPopularService().cantidad }} servicios • \${{ getMostPopularService().ingresoTotal | number }}
						</span>
					</div>

					<div hlmCard class="highlight-card">
						<span class="highlight-label">Técnico #1</span>
						<span class="highlight-value">{{ getTopTechnician().tecnico }}</span>
						<span class="highlight-detail">
							\${{ getTopTechnician().ingresoGenerado | number }} generados
						</span>
					</div>

					<div hlmCard class="highlight-card">
						<span class="highlight-label">Promedio Mensual</span>
						<span class="highlight-value">{{ getAverageMonthlyIncome() | number: '1.0-0' }}</span>
						<span class="highlight-detail">
							\$ de ingreso promedio
						</span>
					</div>
				</div>
			</div>

			<div class="section">
				<h3>Distribución de Ingresos vs Egresos</h3>
				<div class="chart-container">
					<div *ngFor="let month of monthComparatives()" class="chart-bar-group">
						<div class="chart-label">{{ month.mes }}</div>
						<div class="chart-bars">
							<div class="bar-item income-bar" [style.height.%]="(month.ingresos / getMaxIncome()) * 100">
								<span class="bar-value">\${{ month.ingresos / 1000 | number: '1.0-0' }}k</span>
							</div>
							<div class="bar-item expense-bar" [style.height.%]="(month.egresos / getMaxIncome()) * 100">
								<span class="bar-value">\${{ month.egresos / 1000 | number: '1.0-0' }}k</span>
							</div>
						</div>
					</div>
				</div>
				<div class="chart-legend">
					<div class="legend-item">
						<span class="legend-color income-bar"></span>
						<span>Ingresos</span>
					</div>
					<div class="legend-item">
						<span class="legend-color expense-bar"></span>
						<span>Egresos</span>
					</div>
				</div>
			</div>
		</div>
	`,
	styleUrl: './charts-comparative.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartsComparativeComponent {
	private readonly financesService = inject(FinancesService);

	readonly monthComparatives = this.financesService.monthComparatives;
	readonly servicesPopularity = this.financesService.servicesPopularity;
	readonly totalIncome = this.financesService.totalIncome;
	readonly totalExpenses = this.financesService.totalExpenses;
	readonly totalBalance = this.financesService.totalBalance;

	getTopTechnician() {
		return this.financesService.getTopTechnicians(1)[0] ?? { tecnico: '-', ingresoGenerado: 0 };
	}

	getMostPopularService() {
		return this.financesService.getMostPopularServices(1)[0] ?? { servicio: '-', cantidad: 0, ingresoTotal: 0 };
	}

	getAverageMonthlyIncome(): number {
		const months = this.monthComparatives();
		if (!months.length) return 0;
		return months.reduce((sum, m) => sum + m.ingresos, 0) / months.length;
	}

	getMaxIncome(): number {
		const months = this.monthComparatives();
		return Math.max(...months.map((m) => m.ingresos), 1);
	}
}
