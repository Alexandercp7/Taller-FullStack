import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTrash2, lucideX } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { NotificationService } from '../../../../core';

interface SystemUser {
	id: number;
	name: string;
	email: string;
	role: string;
}

type RoleApiItem = string | { name?: string | null };

@Component({
	selector: 'spartan-roles-users-settings',
	imports: [HlmCardImports, HlmTableImports, HlmButtonImports, HlmInputImports, HlmLabelImports, HlmSelectImports, NgIcon, FormsModule],
	providers: [provideIcons({ lucideTrash2, lucideX })],
	templateUrl: './roles-users-settings.component.html',
	styleUrl: './roles-users-settings.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesUsersSettingsComponent implements OnInit {
	private readonly _http = inject(HttpClient);
	private readonly _notification = inject(NotificationService);

	protected readonly users = signal<SystemUser[]>([]);
	protected readonly roles = signal<string[]>([]);
	protected readonly isLoading = signal(false);
	protected readonly showForm = signal(false);
	protected readonly deletingId = signal<number | null>(null);

	protected readonly newName = signal('');
	protected readonly newEmail = signal('');
	protected readonly newPassword = signal('');
	protected readonly newRole = signal('');
	protected readonly isSubmitting = signal(false);

	protected readonly canSubmit = computed(
		() =>
			this.newName().trim().length > 0 &&
			this.newEmail().trim().length > 0 &&
			this.newPassword().trim().length >= 8 &&
			this.newRole().length > 0
	);

	ngOnInit(): void {
		this.loadUsers();
		this.loadRoles();
	}

	private loadUsers(): void {
		this.isLoading.set(true);
		this._http.get<{ data: SystemUser[] }>('/api/v1/users').subscribe({
			next: (res) => {
				this.users.set(res.data);
				this.isLoading.set(false);
			},
			error: () => {
				this._notification.error('No se pudieron cargar los usuarios.');
				this.isLoading.set(false);
			},
		});
	}

	private loadRoles(): void {
		this._http.get<{ data: RoleApiItem[] }>('/api/v1/roles').subscribe({
			next: (res) => {
				const normalizedRoles = (res.data ?? [])
					.map((role) => (typeof role === 'string' ? role : (role?.name ?? '')))
					.filter((role) => role.length > 0);
				this.roles.set(normalizedRoles);
				if (normalizedRoles.length > 0) this.newRole.set(normalizedRoles[0]);
			},
			error: () => {
				this.roles.set([]);
				this._notification.error('No se pudieron cargar los roles.');
			},
		});
	}

	protected openForm(): void {
		this.newName.set('');
		this.newEmail.set('');
		this.newPassword.set('');
		this.newRole.set(this.roles()[0] ?? '');
		this.showForm.set(true);
	}

	protected cancelForm(): void {
		this.showForm.set(false);
	}

	protected submitUser(): void {
		if (!this.canSubmit() || this.isSubmitting()) return;

		this.isSubmitting.set(true);
		this._http
			.post<{ data: SystemUser }>('/api/v1/users', {
				name: this.newName().trim(),
				email: this.newEmail().trim(),
				password: this.newPassword(),
				role: this.newRole(),
			})
			.subscribe({
				next: (res) => {
					this.users.update((list) => [...list, res.data]);
					this.isSubmitting.set(false);
					this.showForm.set(false);
					this._notification.success('Usuario creado correctamente.');
				},
				error: (err) => {
					const msg = err?.error?.message ?? 'No se pudo crear el usuario.';
					this._notification.error(msg);
					this.isSubmitting.set(false);
				},
			});
	}

	protected deleteUser(id: number): void {
		if (this.deletingId() === id) {
			this._http.delete<{ message: string }>(`/api/v1/users/${id}`).subscribe({
				next: () => {
					this.users.update((list) => list.filter((u) => u.id !== id));
					this.deletingId.set(null);
					this._notification.success('Usuario eliminado.');
				},
				error: (err) => {
					const msg = err?.error?.message ?? 'No se pudo eliminar el usuario.';
					this._notification.error(msg);
					this.deletingId.set(null);
				},
			});
		} else {
			this.deletingId.set(id);
		}
	}

	protected cancelDelete(): void {
		this.deletingId.set(null);
	}
}
