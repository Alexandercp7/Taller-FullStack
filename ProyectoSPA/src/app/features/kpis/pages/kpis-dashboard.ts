import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLayout, lucideInfo, lucideBarChart3, lucideCheckCircle } from '@ng-icons/lucide';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { OrgChartComponent, OrganizationInfoComponent, ActivitiesKanbanRolesComponent } from '../components';
import { IndicatorsDashboardComponent } from '../components/indicators-dashboard/indicators-dashboard';

type TabView = 'organigrama' | 'info' | 'indicadores' | 'actividades';

@Component({
	selector: 'app-kpis-dashboard',
	standalone: true,
	imports: [
		CommonModule,
		NgIcon,
		HlmTabsImports,
		OrgChartComponent,
		OrganizationInfoComponent,
		ActivitiesKanbanRolesComponent,
		IndicatorsDashboardComponent,
	],
	providers: [provideIcons({ lucideLayout, lucideInfo, lucideBarChart3, lucideCheckCircle })],
	template: `
		<div class="detail-page">
			<div class="detail-header">
				<div>
					<h1 class="text-xl font-semibold">KPIs y Actividades</h1>
					<p class="text-muted-foreground text-sm">Gestión de organización e indicadores del taller</p>
				</div>
			</div>

			<section hlmTabs [tab]="selectedTab()" class="w-full">
				<div hlmTabsList class="tabs-grid">
					<button hlmTabsTrigger="organigrama" (click)="selectedTab.set('organigrama')" class="flex items-center gap-2">
						<ng-icon name="lucideLayout" class="w-4 h-4" />
						<span>Organigrama</span>
					</button>
					<button hlmTabsTrigger="info" (click)="selectedTab.set('info')" class="flex items-center gap-2">
						<ng-icon name="lucideInfo" class="w-4 h-4" />
						<span>Información</span>
					</button>
					<button hlmTabsTrigger="indicadores" (click)="selectedTab.set('indicadores')" class="flex items-center gap-2">
						<ng-icon name="lucideBarChart3" class="w-4 h-4" />
						<span>Indicadores</span>
					</button>
					<button hlmTabsTrigger="actividades" (click)="selectedTab.set('actividades')" class="flex items-center gap-2">
						<ng-icon name="lucideCheckCircle" class="w-4 h-4" />
						<span>Actividades</span>
					</button>
				</div>

				<div [hlmTabsContent]="'organigrama'" class="space-y-4 pt-4">
					<app-org-chart></app-org-chart>
				</div>

				<div [hlmTabsContent]="'info'" class="space-y-4 pt-4">
					<app-organization-info></app-organization-info>
				</div>

				<div [hlmTabsContent]="'indicadores'" class="space-y-4 pt-4">
					<app-indicators-dashboard></app-indicators-dashboard>
				</div>

				<div [hlmTabsContent]="'actividades'" class="space-y-4 pt-4">
					<app-activities-kanban-roles></app-activities-kanban-roles>
				</div>
			</section>
		</div>
	`,
	styleUrl: './kpis-dashboard.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpisDashboardComponent {
	readonly selectedTab = signal<TabView>('organigrama');
}
