import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { NotificationService } from '../../../../core';
import type { ClientDetail } from '../../models';
import { ClientsVehiclesService } from '../../services';

@Component({
	selector: 'spartan-client-detail-content',
	imports: [CommonModule, HlmCardImports, HlmTableImports, HlmBadgeImports, HlmButtonImports, HlmInputImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './client-detail-content.html',
	styleUrl: './client-detail-content.css',
})
export class ClientDetailContentComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _router = inject(Router);
	private readonly _service = inject(ClientsVehiclesService);
	private readonly _notification = inject(NotificationService);
	private readonly _params = toSignal(this._route.paramMap, { initialValue: this._route.snapshot.paramMap });

	protected readonly clientId = computed(() => this._params().get('id') ?? '');
	protected readonly detail = signal<ClientDetail | undefined>(undefined);
	protected readonly totalAdeudo = computed(() => this.detail()?.workOrders.filter((ot) => ot.paymentState === 'Pendiente').length ?? 0);
	protected readonly editFicha = signal(false);
	protected readonly nombreEdit = signal('');
	protected readonly telefonoEdit = signal('');
	protected readonly correoEdit = signal('');
	protected readonly rfcEdit = signal('');

	constructor() {
		effect(() => {
			const id = this.clientId();
			if (!id) {
				return;
			}

			this.detail.set(this._service.getClientById(id));
			this._service.loadClientDetail(id, (client) => {
				this.detail.set(client);
			});
		});

		effect(() => {
			const client = this.detail();
			if (!client) {
				return;
			}
			this.nombreEdit.set(client.nombre);
			this.telefonoEdit.set(client.telefono === '-' ? '' : client.telefono);
			this.correoEdit.set(client.correo === '-' ? '' : client.correo);
			this.rfcEdit.set(client.rfc === 'RFC pendiente' ? '' : client.rfc);
		});
	}

	protected goBack(): void {
		void this._router.navigate(['/app/clientes-vehiculos']);
	}

	protected openWorkOrder(otId: string): void {
		void this._router.navigate(['/app/ordenes-trabajo', otId]);
	}

	protected toggleEditFicha(): void {
		const isEditing = this.editFicha();
		this.editFicha.set(!isEditing);
	}

	protected saveFicha(): void {
		const client = this.detail();
		if (!client) {
			return;
		}

		const nextId = this._service.updateClient(client.id, {
			nombre: this.nombreEdit().trim(),
			telefono: this.telefonoEdit().trim(),
			correo: this.correoEdit().trim(),
			rfc: this.rfcEdit().trim(),
		});

		this.editFicha.set(false);
		this._notification.success('Ficha del cliente actualizada.');

		if (nextId && nextId !== client.id) {
			void this._router.navigate(['/app/clientes-vehiculos', nextId], { replaceUrl: true });
		}
	}

	protected tagClass(tag: string): string {
		switch (tag) {
			case 'Con adeudo':
				return 'client-tag-adeudo';
			case 'Frecuente':
				return 'client-tag-frecuente';
			case 'Nuevo':
			default:
				return 'client-tag-nuevo';
		}
	}

	protected paymentClass(state: string): string {
		return state === 'Pagado' ? 'payment-paid' : 'payment-pending';
	}
}
