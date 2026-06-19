import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { NotificationService } from '../../../../core';
import { CreateVehicleDialogComponent, type CreateVehicleDialogContext } from '../create-vehicle-dialog';
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
	private readonly _dialog = inject(HlmDialogService);
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

		const nombre = this.nombreEdit().trim();
		const telefono = this.telefonoEdit().trim();
		const correo = this.correoEdit().trim();
		const rfc = this.rfcEdit().trim();

		this._service.updateClient(client.id, { nombre, telefono, correo, rfc });

		this.detail.update(d => d ? {
			...d,
			nombre: nombre || d.nombre,
			telefono: telefono || '-',
			correo: correo || '-',
			rfc: rfc || 'RFC pendiente',
		} : d);

		this.editFicha.set(false);
		this._notification.success('Ficha del cliente actualizada.');
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

	protected addVehicle(): void {
		const client = this.detail();
		if (!client) {
			return;
		}

		const context: CreateVehicleDialogContext = {
			title: 'Agregar vehículo al cliente',
			description: 'Asigna un vehículo a este cliente para reutilizarlo al crear OTs.',
			onCreate: (payload) => {
				const vehicle = this._service.addLocalVehicleToClient(client.id, payload);
				this.detail.update(current => current ? { ...current, vehicles: [vehicle, ...current.vehicles] } : current);
				this._notification.success('Vehículo agregado al cliente.');
			},
		};

		this._dialog.open(CreateVehicleDialogComponent, {
			context,
			contentClass: 'client-dialog-content',
		});
	}
}
