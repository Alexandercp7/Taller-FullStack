import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendarDays, lucideMoon, lucideSearch, lucideSun } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { ThemeService } from '../../../../core';

interface PortalSearchResult {
	portalToken: string;
	code: string;
	fecha_programada: string;
	vehiculo: { marca: string; modelo: string; anio: number; placas?: string } | null;
}

@Component({
	selector: 'spartan-portal-search-content',
	imports: [CommonModule, HlmCardImports, HlmButtonImports, HlmInputImports, HlmTableImports, NgIcon],
	providers: [provideIcons({ lucideCalendarDays, lucideMoon, lucideSearch, lucideSun })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './portal-search-content.html',
	styleUrl: './portal-search-content.css',
})
export class PortalSearchContentComponent {
	private readonly _http = inject(HttpClient);
	private readonly _router = inject(Router);
	private readonly _themeService = inject(ThemeService);

	protected readonly searchTerm = signal('');
	protected readonly hasSearched = signal(false);
	protected readonly results = signal<PortalSearchResult[]>([]);
	protected readonly isDark = this._themeService.isDark;

	protected search(): void {
		const term = this.searchTerm().trim().replace(/\s+/g, ' ');
		if (!term) {
			this.results.set([]);
			this.hasSearched.set(true);
			return;
		}
		this._http.get<{ data: PortalSearchResult[] }>('/api/v1/portal/search', { params: { q: term } }).subscribe({
			next: (res) => {
				this.results.set(res.data);
				this.hasSearched.set(true);
			},
			error: () => {
				this.results.set([]);
				this.hasSearched.set(true);
			},
		});
	}

	protected openOrder(token: string): void {
		void this._router.navigate(['/portal', token]);
	}

	protected toggleTheme(): void {
		this._themeService.toggleTheme();
	}
}
