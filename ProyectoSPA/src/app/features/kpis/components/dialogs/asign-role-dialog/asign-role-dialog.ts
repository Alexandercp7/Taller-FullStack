import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { KpisService } from '../../../services';
import type { RoleType } from '../../../models';
import { NotificationService } from '../../../../../core';

import type { Employee } from '../../../models';

export interface AsignRoleDialogContext {
	role: RoleType;
	isEditing?: boolean;
	employee?: Employee;
}

@Component({
	selector: 'app-asign-role-dialog',
	standalone: true,
	imports: [CommonModule, FormsModule, HlmInputImports, HlmButtonImports, HlmLabelImports],
	template: `
		<div class="space-y-6 w-full">
			<div class="space-y-2">
				@if (context.isEditing) {
					<h2 class="text-lg font-semibold">Editar empleado</h2>
					<p class="text-sm text-muted-foreground">Actualiza los datos del empleado</p>
				} @else {
					<h2 class="text-lg font-semibold">Asignar empleado a <span class="text-primary">{{ context.role }}</span></h2>
					<p class="text-sm text-muted-foreground">Completa los datos del nuevo empleado</p>
				}
			</div>

			<div class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<label hlmLabel for="nombre">Nombre *</label>
						<input hlmInput id="nombre" [(ngModel)]="nombre" placeholder="Ej: Juan" />
					</div>

					<div class="space-y-2">
						<label hlmLabel for="apellido">Apellido</label>
						<input hlmInput id="apellido" [(ngModel)]="apellido" placeholder="Ej: Pérez" />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<label hlmLabel for="email">Email *</label>
						<input hlmInput id="email" type="email" [(ngModel)]="email" placeholder="Ej: juan@example.com" />
					</div>

					<div class="space-y-2">
						<label hlmLabel for="telefono">Teléfono</label>
						<input hlmInput id="telefono" [(ngModel)]="telefono" placeholder="Ej: +1234567890" />
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-2 pt-4">
				<button hlmBtn type="button" variant="outline" (click)="onCancel()">Cancelar</button>
				@if (context.isEditing) {
					<button hlmBtn type="button" (click)="onUpdate()" [disabled]="!nombre() || !email()">
						Actualizar
					</button>
				} @else {
					<button hlmBtn type="button" (click)="onAssign()" [disabled]="!nombre() || !email()">
						Asignar
					</button>
				}
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsignRoleDialogComponent {
	protected readonly dialogRef = inject(BrnDialogRef<void>);
	protected readonly context = injectBrnDialogContext<AsignRoleDialogContext>();
	private readonly kpisService = inject(KpisService);
	private readonly notification = inject(NotificationService);

	protected nombre = signal('');
	protected apellido = signal('');
	protected email = signal('');
	protected telefono = signal('');

	constructor() {
		if (this.context.isEditing && this.context.employee) {
			this.nombre.set(this.context.employee.nombre);
			this.apellido.set(this.context.employee.apellido);
			this.email.set(this.context.employee.email);
			this.telefono.set(this.context.employee.telefono);
		}
	}

	protected onUpdate(): void {
		const nombreVal = this.nombre().trim();
		const emailVal = this.email().trim();

		if (!nombreVal || !emailVal) {
			this.notification.error('Por favor completa nombre y email');
			return;
		}

		if (this.context.isEditing && this.context.employee) {
			this.kpisService.updateEmployee(this.context.employee.id, {
				nombre: nombreVal,
				apellido: this.apellido().trim(),
				email: emailVal,
				telefono: this.telefono().trim(),
			});
			this.notification.success('Empleado actualizado');
			this.dialogRef.close();
		}
	}

	protected onCancel(): void {
		this.dialogRef.close();
	}

	protected onAssign(): void {
		const nombreVal = this.nombre().trim();
		const emailVal = this.email().trim();

		if (!nombreVal || !emailVal) {
			this.notification.error('Por favor completa nombre y email');
			return;
		}

		this.kpisService.createEmployee({
			nombre: nombreVal,
			apellido: this.apellido().trim(),
			email: emailVal,
			telefono: this.telefono().trim(),
			role: this.context.role,
			fotoUrl: '',
		});

		this.notification.success(`${nombreVal} asignado a ${this.context.role}`);
		this.dialogRef.close();
	}
}
