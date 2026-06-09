import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpisService } from '../../services';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { AsignRoleDialogComponent } from '../dialogs';
import { NotificationService } from '../../../../core';
import type { Employee } from '../../models';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil } from '@ng-icons/lucide';

@Component({
	selector: 'app-org-chart',
	standalone: true,
	imports: [CommonModule, HlmCardImports, HlmButtonImports, HlmBadgeImports, NgIcon],
	providers: [provideIcons({ lucidePencil })],
	template: `
		<div class="space-y-6">
			<h2 class="text-2xl font-semibold">Organigrama</h2>

			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				@for (roleGroup of kpisService.employeesByRole(); track roleGroup.role) {
					<div hlmCard class="overflow-hidden">
						<div class="flex flex-col gap-4 p-4">
							<div class="flex items-center justify-between">
								<h3 class="font-semibold text-lg">{{ roleGroup.role }}</h3>
								<span hlmBadge variant="secondary">{{ roleGroup.employees.length }}</span>
							</div>

							<div class="space-y-3">
								@if (roleGroup.employees.length > 0) {
									@for (employee of roleGroup.employees; track employee.id) {
										<div class="flex items-center gap-3 rounded-lg p-3 border">
											<div class="flex-1 min-w-0">
												<p class="font-medium text-sm">{{ employee.nombre }} {{ employee.apellido }}</p>
												<p class="text-xs truncate">{{ employee.email }}</p>
											</div>
											<button
												type="button"
												hlmBtn
												size="sm"
												variant="outline"
												(click)="editEmployee(employee)"
											>
												<ng-icon name="lucidePencil" class="w-4 h-4"></ng-icon>
											</button>
										</div>
									}
								} @else {
									<p class="py-4 text-center text-sm">Sin asignación</p>
								}
							</div>

							<button
								type="button"
								hlmBtn
								class="mt-2 w-full"
								(click)="assignEmployee(roleGroup.role)"
							>
								+ Asignar
							</button>
						</div>
					</div>
				}
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgChartComponent {
	protected readonly kpisService = inject(KpisService);
	private readonly dialog = inject(HlmDialogService);
	private readonly notification = inject(NotificationService);

	protected assignEmployee(role: string): void {
		this.dialog.open(AsignRoleDialogComponent, {
			context: { role: role as any },
			contentClass: 'kpis-dialog-content',
		});
	}

	protected editEmployee(employee: Employee): void {
		this.dialog.open(AsignRoleDialogComponent, {
			context: { role: employee.role, isEditing: true, employee },
			contentClass: 'kpis-dialog-content',
		});
	}
}

