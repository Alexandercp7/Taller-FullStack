import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCarouselImports } from '@spartan-ng/helm/carousel';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { NotificationService } from '../../../../../../core';
import { WorkOrdersService } from '../../../../services';

@Component({
	selector: 'spartan-wo-gallery-section',
	imports: [CommonModule, HlmCardImports, HlmInputImports, HlmButtonImports, HlmCarouselImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './gallery-section.html',
	styleUrl: './gallery-section.css',
})
export class WorkOrderGallerySectionComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _service = inject(WorkOrdersService);
	private readonly _notification = inject(NotificationService);
	private readonly _params = toSignal(this._route.paramMap, { initialValue: this._route.snapshot.paramMap });

	protected readonly orderId = computed(() => this._params().get('id') ?? '');
	protected readonly order = computed(() => this._service.getById(this.orderId()));
	protected readonly newPhotoUrl = signal('');
	protected readonly previewPhoto = signal<string | null>(null);

	protected addPhotoByUrl(): void {
		const order = this.order();
		const url = this.newPhotoUrl().trim();
		if (!order || !url) return;
		this._service.addPhoto(order.id, url);
		this.newPhotoUrl.set('');
		this._notification.success('Foto agregada a la galeria.');
	}

	protected onPhotoFileSelected(event: Event): void {
		const input = event.target as HTMLInputElement | null;
		const file = input?.files?.[0];
		const order = this.order();
		if (!file || !order) return;
		const objectUrl = URL.createObjectURL(file);
		this._service.addPhoto(order.id, objectUrl);
		if (input) input.value = '';
		this._notification.success('Foto agregada desde archivo.');
	}

	protected openPhoto(photo: string): void {
		this.previewPhoto.set(photo);
	}

	protected closePhotoPreview(): void {
		this.previewPhoto.set(null);
	}
}
