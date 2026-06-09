import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { KpisService } from '../../../services';
import type { Activity, RoleType } from '../../../models';
import { NotificationService } from '../../../../../core';
import { DatePickerFieldComponent } from '../../../../../shared';

export interface AddActivityDialogContext {
	activity?: Activity;
	role?: RoleType;
	isEditing?: boolean;
}

@Component({
	selector: 'app-add-activity-dialog',
	standalone: true,
	imports: [CommonModule, FormsModule, HlmInputImports, HlmButtonImports, HlmLabelImports, HlmSelectImports, HlmTextareaImports, DatePickerFieldComponent],
	template: `
		<div class="space-y-4 w-full">
			<div class="space-y-2">
				<h2 class="text-lg font-semibold">
					@if (context.isEditing) {
						Editar actividad
					} @else {
						Nueva actividad para
						<span class="text-primary">{{ context.role }}</span>
					}
				</h2>
				<p class="text-sm text-muted-foreground">Completa los datos de la actividad</p>
			</div>

			<div class="space-y-4">
				<div class="space-y-2">
					<label hlmLabel for="titulo">Título *</label>
					<input hlmInput id="titulo" [(ngModel)]="titulo" placeholder="Ej: Revisar sistema de frenos" />
				</div>

				<div class="space-y-2">
					<label hlmLabel for="descripcion">Descripción</label>
					<textarea hlmTextarea id="descripcion" [(ngModel)]="descripcion" placeholder="Detalles adicionales..." rows="3"></textarea>
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<label hlmLabel for="estado">Estado</label>
						<hlm-select [(ngModel)]="estado">
							<hlm-select-trigger>
								<hlm-select-value />
							</hlm-select-trigger>
							<hlm-select-content *hlmSelectPortal>
								<hlm-select-group>
									<hlm-select-item value="Pendiente">Pendiente</hlm-select-item>
									<hlm-select-item value="En Proceso">En Proceso</hlm-select-item>
									<hlm-select-item value="Completada">Completada</hlm-select-item>
									<hlm-select-item value="Cancelada">Cancelada</hlm-select-item>
								</hlm-select-group>
							</hlm-select-content>
						</hlm-select>
					</div>

					<div class="space-y-2">
						<label hlmLabel for="prioridad">Prioridad</label>
						<hlm-select [(ngModel)]="prioridad">
							<hlm-select-trigger>
								<hlm-select-value />
							</hlm-select-trigger>
							<hlm-select-content *hlmSelectPortal>
								<hlm-select-group>
									<hlm-select-item value="Baja">Baja</hlm-select-item>
									<hlm-select-item value="Normal">Normal</hlm-select-item>
									<hlm-select-item value="Alta">Alta</hlm-select-item>
								</hlm-select-group>
							</hlm-select-content>
						</hlm-select>
					</div>
				</div>

				<div class="space-y-2">
					<label hlmLabel>Fecha de vencimiento</label>
					<spartan-date-picker-field
						[value]="fechaVencimiento()"
						placeholder="Seleccionar fecha"
						(valueChange)="fechaVencimiento.set($event)"
					/>
				</div>
			</div>

			<div class="flex justify-end gap-2 pt-4">
				<button hlmBtn type="button" variant="outline" (click)="onCancel()">Cancelar</button>
				<button hlmBtn type="button" (click)="onSave()" [disabled]="!titulo()">
					@if (context.isEditing) {
						Guardar cambios
					} @else {
						Agregar actividad
					}
				</button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddActivityDialogComponent {
	protected readonly dialogRef = inject(BrnDialogRef<void>);
	protected readonly context = injectBrnDialogContext<AddActivityDialogContext>();
	private readonly kpisService = inject(KpisService);
	private readonly notification = inject(NotificationService);

	protected titulo = signal('');
	protected descripcion = signal('');
	protected estado = signal('Pendiente');
	protected prioridad = signal('Normal');
	protected fechaVencimiento = signal('');

	constructor() {
		if (this.context.activity) {
			this.titulo.set(this.context.activity.titulo);
			this.descripcion.set(this.context.activity.descripcion);
			this.estado.set(this.context.activity.status);
			this.prioridad.set(this.context.activity.prioridad);
			this.fechaVencimiento.set(this.context.activity.fechaVencimiento || '');
		}
	}

	protected onCancel(): void {
		this.dialogRef.close();
	}

	protected onSave(): void {
		const tituloVal = this.titulo().trim();

		if (!tituloVal) {
			this.notification.error('Por favor completa el título');
			return;
		}

		if (this.context.isEditing && this.context.activity) {
			this.kpisService.updateActivity(this.context.activity.id, {
				titulo: tituloVal,
				descripcion: this.descripcion().trim(),
				status: this.estado().trim() as any,
				prioridad: this.prioridad().trim() as any,
				fechaVencimiento: this.fechaVencimiento().trim(),
			});
			this.notification.success('Actividad actualizada');
		} else {
			this.kpisService.createActivity({
				titulo: tituloVal,
				descripcion: this.descripcion().trim(),
				roleAsignado: this.context.role!,
				tags: [],
				fechaVencimiento: this.fechaVencimiento().trim(),
				prioridad: this.prioridad().trim() as any,
			});
			this.notification.success('Actividad creada');
		}

		this.dialogRef.close();
	}
}
