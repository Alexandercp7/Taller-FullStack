import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { AuthService, type AuthUser } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core';

@Component({
	selector: 'spartan-profile-settings',
	imports: [FormsModule, HlmCardImports, HlmLabelImports, HlmInputImports, HlmButtonImports],
	templateUrl: './profile-settings.component.html',
	styleUrl: './profile-settings.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSettingsComponent implements OnInit {
	private readonly _http = inject(HttpClient);
	private readonly _auth = inject(AuthService);
	private readonly _notification = inject(NotificationService);

	protected readonly isLoading = signal(false);
	protected readonly isSaving = signal(false);
	protected readonly name = signal('');
	protected readonly email = signal('');

	protected readonly canSave = computed(() => this.name().trim().length > 0 && this.email().trim().length > 0);

	ngOnInit(): void {
		const currentUser = this._auth.currentUser();
		if (currentUser) {
			this.syncFromUser(currentUser);
		}

		this.isLoading.set(true);
		this._http.get<{ data: AuthUser }>('/api/v1/auth/me').subscribe({
			next: (res) => {
				this.syncFromUser(res.data);
				this._auth.setCurrentUser(res.data);
				this.isLoading.set(false);
			},
			error: () => {
				this.isLoading.set(false);
				if (!currentUser) {
					this._notification.error('No se pudo cargar tu perfil.');
				}
			},
		});
	}

	protected saveProfile(): void {
		if (!this.canSave() || this.isSaving()) return;

		this.isSaving.set(true);
		this._http
			.put<{ data: AuthUser }>('/api/v1/auth/me', {
				name: this.name().trim(),
				email: this.email().trim(),
			})
			.subscribe({
				next: (res) => {
					this._auth.setCurrentUser(res.data);
					this.syncFromUser(res.data);
					this._notification.success('Perfil actualizado correctamente.');
					this.isSaving.set(false);
				},
				error: (err) => {
					const message = err?.error?.message ?? 'No se pudo guardar el perfil.';
					this._notification.error(message);
					this.isSaving.set(false);
				},
			});
	}

	private syncFromUser(user: AuthUser): void {
		this.name.set(user.name ?? '');
		this.email.set(user.email ?? '');
	}
}
