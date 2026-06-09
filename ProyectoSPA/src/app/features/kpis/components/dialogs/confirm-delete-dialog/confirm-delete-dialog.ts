import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';

export interface ConfirmDeleteDialogContext {
	title: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
}

@Component({
	selector: 'app-confirm-delete-dialog',
	standalone: true,
	imports: [CommonModule, HlmButtonImports],
	template: `
		<div class="space-y-4 w-full max-w-sm">
			<div class="space-y-2">
				<h2 class="text-lg font-semibold">{{ context.title }}</h2>
				@if (context.description) {
					<p class="text-sm text-muted-foreground">{{ context.description }}</p>
				}
			</div>

			<div class="flex justify-end gap-2 pt-4">
				<button hlmBtn type="button" variant="outline" (click)="dialogRef.close(false)">
					{{ context.cancelText || 'Cancelar' }}
				</button>
				<button hlmBtn type="button" variant="destructive" (click)="dialogRef.close(true)">
					{{ context.confirmText || 'Eliminar' }}
				</button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteDialogComponent {
	protected readonly dialogRef = inject(BrnDialogRef<boolean>);
	protected readonly context = injectBrnDialogContext<ConfirmDeleteDialogContext>();
}
