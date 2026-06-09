import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronsUpDown, lucideLogOut, lucideSettings } from '@ng-icons/lucide';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmSidebarImports, HlmSidebarService } from '@spartan-ng/helm/sidebar';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
	selector: 'spartan-nav-user',
	imports: [HlmSidebarImports, HlmAvatarImports, NgIcon, HlmDropdownMenuImports],
	providers: [
		provideIcons({
			lucideChevronsUpDown,
			lucideSettings,
			lucideLogOut,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './nav-user.html',
	styleUrl: './nav-user.css',
})
export class NavUser {
	private readonly _sidebarService = inject(HlmSidebarService);
	private readonly _router = inject(Router);
	private readonly _authService = inject(AuthService);

	protected readonly _menuSide = computed(() => (this._sidebarService.isMobile() ? 'top' : 'right'));

	protected readonly user = computed(() => {
		const u = this._authService.currentUser();
		return {
			name: u?.name ?? '',
			email: u?.email ?? '',
			initials: (u?.name ?? '??').slice(0, 2).toUpperCase(),
		};
	});

	protected goToSettings(): void {
		void this._router.navigate(['/settings']);
	}

	protected logout(): void {
		this._authService.logout();
		void this._router.navigate(['/login']);
	}
}
