import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { FormsModule } from '@angular/forms';
import { NotificationService, QrCodeService } from '../../../../core';
import { WorkOrdersService } from '../../services';

export interface ShareWorkOrderDialogContext {
	orderId: string;
	portalUrl: string;
	clientEmail?: string;
}

@Component({
	selector: 'spartan-share-work-order-dialog',
	imports: [CommonModule, FormsModule, HlmButtonImports, HlmInputImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './share-work-order-dialog.html',
	styleUrl: './share-work-order-dialog.css',
})
export class ShareWorkOrderDialogComponent {
	private readonly _dialogRef = inject(BrnDialogRef<unknown>);
	private readonly _context = injectBrnDialogContext<ShareWorkOrderDialogContext>();
	private readonly _service = inject(WorkOrdersService);
	private readonly _qr = inject(QrCodeService);
	private readonly _notification = inject(NotificationService);

	protected readonly orderId = this._context.orderId;
	protected readonly portalUrl = this._context.portalUrl;
	protected email = this._context.clientEmail ?? '';
	protected sending = signal(false);
	protected readonly qrUrl = this._qr.getQrUrl(this._context.portalUrl, 220);

	protected copyLink(): void {
		navigator.clipboard.writeText(this.portalUrl).then(() => {
			this._notification.success('Enlace copiado al portapapeles.');
		});
	}

	protected sendEmail(): void {
		const correo = this.email.trim();
		if (!correo) {
			this._notification.error('Escribe un correo válido para enviar la OT.');
			return;
		}

				this.sending.set(true);
		this._service.sendPortalShareEmail(this.orderId, correo).subscribe({
			next: () => {
				this._notification.success('Correo enviado con el QR y el enlace del portal.');
						this.sending.set(false);
			},
			error: () => {
				this._notification.error('No se pudo enviar el correo.');
						this.sending.set(false);
			},
		});
	}

	protected close(): void {
		this._dialogRef.close();
	}
}
