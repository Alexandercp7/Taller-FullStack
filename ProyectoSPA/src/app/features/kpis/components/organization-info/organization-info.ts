import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KpisService } from '../../services';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

@Component({
	selector: 'app-organization-info',
	standalone: true,
	imports: [CommonModule, FormsModule, HlmCardImports, HlmButtonImports, HlmInputImports, HlmTextareaImports],
	template: `
		<div class="space-y-6">
			<h2 class="text-2xl font-semibold">Información Institucional</h2>

			@if (orgInfo(); as org) {
				<div class="grid gap-6">
					<div hlmCard>
						<div class="flex flex-col gap-4 p-6">
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-semibold">Misión</h3>
								<button type="button" hlmBtn size="sm" (click)="toggleMision()">
									{{ editingMision() ? 'Cancelar' : 'Editar' }}
								</button>
							</div>
							@if (editingMision()) {
								<textarea 
									hlmTextarea 
									rows="3"
									[(ngModel)]="tempMision"
									class="w-full"
								></textarea>
								<button hlmBtn class="w-full" (click)="saveMision()">Guardar Misión</button>
							} @else {
								<p class="leading-relaxed">{{ org.mision }}</p>
							}
						</div>
					</div>

					<div hlmCard>
						<div class="flex flex-col gap-4 p-6">
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-semibold">Visión</h3>
								<button type="button" hlmBtn size="sm" (click)="toggleVision()">
									{{ editingVision() ? 'Cancelar' : 'Editar' }}
								</button>
							</div>
							@if (editingVision()) {
								<textarea 
									hlmTextarea 
									rows="3"
									[(ngModel)]="tempVision"
									class="w-full"
								></textarea>
								<button hlmBtn class="w-full" (click)="saveVision()">Guardar Visión</button>
							} @else {
								<p class="leading-relaxed">{{ org.vision }}</p>
							}
						</div>
					</div>

					<div hlmCard>
						<div class="flex flex-col gap-4 p-6">
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-semibold">Valores ({{ org.valores.length }})</h3>
								<button type="button" hlmBtn size="sm" (click)="toggleValores()">
									{{ editingValores() ? 'Cancelar' : '+ Agregar' }}
								</button>
							</div>
							@if (editingValores()) {
								<div class="space-y-3">
									<input 
										hlmInput 
										type="text"
										placeholder="Nuevo valor"
										[(ngModel)]="nuevoValor"
										(keyup.enter)="agregarValor()"
									/>
									<button hlmBtn class="w-full" (click)="agregarValor()">Agregar Valor</button>
								</div>
							}
							<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
								@for (valor of org.valores; track valor) {
									<div class="flex items-center justify-between rounded-lg p-3 border">
										<span class="font-medium text-sm">{{ valor }}</span>
										<button 
											type="button" 
											class="text-red-500 hover:text-red-700 text-xs font-semibold"
											(click)="removerValor(valor)"
										>
											✕
										</button>
									</div>
								}
							</div>
						</div>
					</div>
				</div>
			}
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationInfoComponent {
	private readonly kpisService = inject(KpisService);
	protected readonly orgInfo = this.kpisService.organizationInfo;

	protected editingMision = signal(false);
	protected editingVision = signal(false);
	protected editingValores = signal(false);

	protected tempMision = '';
	protected tempVision = '';
	protected nuevoValor = '';

	protected toggleMision(): void {
		if (!this.editingMision()) {
			this.tempMision = this.orgInfo().mision;
		}
		this.editingMision.update(v => !v);
	}

	protected toggleVision(): void {
		if (!this.editingVision()) {
			this.tempVision = this.orgInfo().vision;
		}
		this.editingVision.update(v => !v);
	}

	protected toggleValores(): void {
		this.editingValores.update(v => !v);
		this.nuevoValor = '';
	}

	protected saveMision(): void {
		this.kpisService.updateOrganizationInfo({ mision: this.tempMision });
		this.editingMision.set(false);
	}

	protected saveVision(): void {
		this.kpisService.updateOrganizationInfo({ vision: this.tempVision });
		this.editingVision.set(false);
	}

	protected agregarValor(): void {
		if (!this.nuevoValor.trim()) return;
		const nuevosValores = [...this.orgInfo().valores, this.nuevoValor];
		this.kpisService.updateOrganizationInfo({ valores: nuevosValores });
		this.nuevoValor = '';
	}

	protected removerValor(valor: string): void {
		const nuevosValores = this.orgInfo().valores.filter(v => v !== valor);
		this.kpisService.updateOrganizationInfo({ valores: nuevosValores });
	}
}
