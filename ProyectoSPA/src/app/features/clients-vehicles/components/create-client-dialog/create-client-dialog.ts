import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import type { UpsertClientInput } from '../../models';

export interface CreateClientDialogContext {
	onCreate: (payload: UpsertClientInput) => void;
}

@Component({
	selector: 'spartan-create-client-dialog',
	imports: [CommonModule, HlmInputImports, HlmButtonImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './create-client-dialog.html',
	styleUrl: './create-client-dialog.css',
})
export class CreateClientDialogComponent {
	private readonly _dialogRef = inject(BrnDialogRef<unknown>);
	private readonly _context = injectBrnDialogContext<CreateClientDialogContext>();

	protected readonly nombre = signal('');
	protected readonly telefono = signal('');
	protected readonly correo = signal('');
	protected readonly rfc = signal('');

	protected readonly canCreate = computed(() => this.nombre().trim().length > 0);

	protected submit(): void {
		if (!this.canCreate()) {
			return;
		}
		this._context.onCreate({
			nombre: this.nombre().trim(),
			telefono: this.telefono().trim(),
			correo: this.correo().trim(),
			rfc: this.rfc().trim(),
		});
		this._dialogRef.close();
	}

	protected cancel(): void {
		this._dialogRef.close();
	}
}
