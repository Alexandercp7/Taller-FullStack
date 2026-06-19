import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { NotificationService } from '../../../../core';
import { workOrderPriorityVariant, workOrderStatusVariant, type WorkOrderPriority, type WorkOrderStatus } from '../../models';
import { WorkOrdersService } from '../../services';
import { ShareWorkOrderDialogComponent, type ShareWorkOrderDialogContext } from '../share-work-order-dialog';
import {
	WorkOrderChecklistSectionComponent,
	WorkOrderDetailsSectionComponent,
	WorkOrderGallerySectionComponent,
	WorkOrderNotesSectionComponent,
	WorkOrderQuotationsSectionComponent,
	WorkOrderTimelineSectionComponent,
} from './sections';

@Component({
	selector: 'spartan-work-order-detail-content',
	imports: [
		CommonModule,
		HlmBadgeImports,
		HlmButtonImports,
		HlmTabsImports,
		WorkOrderDetailsSectionComponent,
		WorkOrderChecklistSectionComponent,
		WorkOrderGallerySectionComponent,
		WorkOrderTimelineSectionComponent,
		WorkOrderNotesSectionComponent,
		WorkOrderQuotationsSectionComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './work-order-detail-content.html',
	styleUrl: './work-order-detail-content.css',
})
export class WorkOrderDetailContentComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _router = inject(Router);
	private readonly _service = inject(WorkOrdersService);
	private readonly _notification = inject(NotificationService);
	private readonly _dialog = inject(HlmDialogService);
	private readonly _params = toSignal(this._route.paramMap, { initialValue: this._route.snapshot.paramMap });
	private readonly _sendingWhatsApp = signal(false);

	protected readonly statusVariant = workOrderStatusVariant;
	protected readonly priorityVariant = workOrderPriorityVariant;
	protected readonly orderId = computed(() => this._params().get('id') ?? '');
	protected readonly order = computed(() => this._service.getById(this.orderId()));
	protected readonly canSendWhatsApp = computed(() => !!this.order()?.clientData.telefono.trim());
	protected readonly isDeliveryDay = computed(() => {
		const order = this.order();
		if (!order?.fechaProgramada) return false;
		const today = new Date();
		const deliveryDate = new Date(order.fechaProgramada);
		return deliveryDate.toDateString() === today.toDateString();
	});
	protected readonly whatsappActionLabel = computed(() => this.isDeliveryDay() ? 'Enviar recordatorio WhatsApp' : 'Enviar WhatsApp');
	protected readonly sendingWhatsApp = this._sendingWhatsApp.asReadonly();

	constructor() {
		this._service.loadDetail(this.orderId());
	}

	protected goBack(): void {
		void this._router.navigate(['/app/ordenes-trabajo']);
	}

	protected shareWithClient(id: string): void {
		this._service.getOrCreatePortalToken(id).subscribe({
			next: (token) => {
				const portalUrl = `${window.location.origin}/portal/${token}`;
				const context: ShareWorkOrderDialogContext = {
					orderId: id,
					portalUrl,
					clientEmail: this.order()?.clientData.correo ?? '',
					clientPhone: this.order()?.clientData.telefono ?? '',
				};
				this._dialog.open(ShareWorkOrderDialogComponent, {
					context,
					contentClass: 'share-work-order-dialog-content',
				});
			},
			error: () => this._notification.error('No se pudo generar el enlace del portal.'),
		});
	}

	protected sendWhatsApp(id: string): void {
		if (!this.canSendWhatsApp() || this.sendingWhatsApp()) {
			return;
		}

		this._sendingWhatsApp.set(true);
		this._service.sendWhatsAppNotification(id).subscribe({
			next: (res) => {
				this._notification.success(res.message || 'WhatsApp enviado correctamente.');
				this._sendingWhatsApp.set(false);
			},
			error: () => {
				this._sendingWhatsApp.set(false);
				this._notification.error('No se pudo enviar el WhatsApp.');
			},
		});
	}

	protected cerrarOrden(): void {
		const order = this.order();
		if (!order) return;
		this._service.updateStatus(order.id, 'Terminado', 'Supervisor');
		this._notification.success('OT terminada. Cargo enviado a finanzas.');
	}

	protected statusChipClass(status: WorkOrderStatus): string {
		switch (status) {
			case 'Agendado':
				return 'wo-chip-status-agendado';
			case 'En Espera':
				return 'wo-chip-status-espera';
			case 'En Proceso':
				return 'wo-chip-status-proceso';
			case 'Terminado':
				return 'wo-chip-status-terminado';
			case 'En Garantia':
				return 'wo-chip-status-garantia';
			case 'Rezagado':
				return 'wo-chip-status-rezagado';
			case 'Entregado':
				return 'wo-chip-status-entregado';
			default:
				return '';
		}
	}

	protected priorityChipClass(priority: WorkOrderPriority): string {
		switch (priority) {
			case 'Alta':
				return 'wo-chip-priority-alta';
			case 'Media':
				return 'wo-chip-priority-media';
			case 'Baja':
				return 'wo-chip-priority-baja';
			default:
				return '';
		}
	}
}
