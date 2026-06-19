import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { FormsModule } from '@angular/forms';
import { NotificationService, QrCodeService, ThemeService } from '../../../../core';
import { WorkOrdersService } from '../../services';

export interface ShareWorkOrderDialogContext {
	orderId: string;
	portalUrl: string;
	clientEmail?: string;
	clientPhone?: string;
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
	private readonly _theme = inject(ThemeService);

	protected readonly orderId = this._context.orderId;
	protected readonly portalUrl = this._context.portalUrl;
	protected readonly clientPhone = this._context.clientPhone ?? '';
	protected email = this._context.clientEmail ?? '';
	protected sending = signal(false);
	protected sendingWhatsApp = signal(false);
	protected readonly qrUrl = signal('');

	constructor() {
		effect(() => {
			const isDark = this._theme.isDark();
			void this.renderQr(isDark);
		});
	}

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

	protected sendWhatsApp(): void {
		if (!this.clientPhone.trim() || this.sendingWhatsApp()) {
			this._notification.error('Esta OT no tiene telefono del cliente.');
			return;
		}

		this.sendingWhatsApp.set(true);
		this._service.sendWhatsAppNotification(this.orderId).subscribe({
			next: (res) => {
				this._notification.success(res.message || 'WhatsApp enviado correctamente.');
				this.sendingWhatsApp.set(false);
			},
			error: () => {
				this._notification.error('No se pudo enviar el WhatsApp.');
				this.sendingWhatsApp.set(false);
			},
		});
	}

	protected close(): void {
		this._dialogRef.close();
	}

	private async renderQr(isDark: boolean): Promise<void> {
		const url = await this._qr.getStyledQrDataUrl(this.portalUrl, {
			foregroundColor: isDark ? '#f8fafc' : '#0f172a',
			backgroundColor: 'transparent',
			radius: 0.92,
			padding: 1.6,
		});
		this.qrUrl.set(url);
	}
}
