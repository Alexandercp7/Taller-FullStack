import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTrash2 } from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmAlertDialogImports } from '../../../../components/ui/alert-dialog/src';
import { NotificationService } from '../../../../core';
import { CreateClientDialogComponent, type CreateClientDialogContext } from '../create-client-dialog';
import { ClientsVehiclesService } from '../../services';

@Component({
	selector: 'spartan-clients-vehicles-content',
	imports: [CommonModule, HlmCardImports, HlmTableImports, HlmInputImports, HlmBadgeImports, HlmButtonImports, HlmAlertDialogImports, NgIcon],
	providers: [provideIcons({ lucideTrash2 })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './clients-vehicles-content.html',
	styleUrl: './clients-vehicles-content.css',
})
export class ClientsVehiclesContentComponent {
	private readonly _router = inject(Router);
	private readonly _service = inject(ClientsVehiclesService);
	private readonly _dialog = inject(HlmDialogService);
	private readonly _notification = inject(NotificationService);

	protected readonly search = signal('');
	protected readonly clients = this._service.clients;
	protected readonly filteredClients = computed(() => {
		const term = this.search().trim().toLowerCase();
		if (!term) {
			return this.clients();
		}

		return this.clients().filter((client) => {
			const byName = client.nombre.toLowerCase().includes(term);
			const byPhone = client.telefono.toLowerCase().includes(term);
			const byPlate = client.placas.some((plate) => plate.toLowerCase().includes(term));
			return byName || byPhone || byPlate;
		});
	});

	protected updateSearch(value: string): void {
		this.search.set(value);
	}

	protected goToDetail(clientId: string): void {
		void this._router.navigate(['/app/clientes-vehiculos', clientId]);
	}

	protected canDeleteClient(clientId: string): boolean {
		return this._service.canDeleteClient(clientId).canDelete;
	}

	protected deleteDisabledReason(clientId: string): string {
		return this._service.canDeleteClient(clientId).reason ?? '';
	}

	protected confirmDeleteClient(clientId: string): void {
		const result = this._service.deleteClient(clientId);
		if (!result.deleted) {
			this._notification.error(result.reason ?? 'No se pudo eliminar el cliente.');
			return;
		}
		this._notification.success('Cliente eliminado.');
	}

	protected createClient(): void {
		const context: CreateClientDialogContext = {
			onCreate: (payload) => {
				const id = this._service.createClient(payload);
				this._notification.success('Cliente creado correctamente.');
				if (id) {
					void this._router.navigate(['/app/clientes-vehiculos', id]);
				}
			},
		};

		this._dialog.open(CreateClientDialogComponent, {
			context,
			contentClass: 'client-dialog-content',
		});
	}

	protected tagClass(tag: string): string {
		switch (tag) {
			case 'Con adeudo':
			case 'Vencido':
				return 'client-tag-adeudo';
			case 'Frecuente':
			case 'Al corriente':
				return 'client-tag-frecuente';
			case 'Nuevo':
			case 'Sin historial':
			case 'Pendiente':
			default:
				return 'client-tag-nuevo';
		}
	}
}
