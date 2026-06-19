import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideBadgeCheck,
	lucideBookOpen,
	lucideChartPie,
	lucideCreditCard,
	lucideMap,
	lucidePackageSearch,
	lucidePlus,
	lucideReceiptText,
	lucideSettings2,
	lucideUsers,
	lucideX,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/notifications/notification.service';
import type { QuickAccessItem } from '../../models/dashboard.models';

interface DashboardShortcutApiItem {
	id: string;
	shortcutId: string;
	sortOrder: number;
}

@Component({
	selector: 'spartan-quick-access',
	imports: [RouterLink, NgIcon, HlmCardImports, HlmButtonImports],
	providers: [
		provideIcons({
			lucideBadgeCheck,
			lucideBookOpen,
			lucideChartPie,
			lucideCreditCard,
			lucideMap,
			lucidePackageSearch,
			lucidePlus,
			lucideReceiptText,
			lucideSettings2,
			lucideUsers,
			lucideX,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './quick-access.html',
	styleUrl: './quick-access.css',
})
export class QuickAccessComponent {
	private readonly _auth = inject(AuthService);
	private readonly _http = inject(HttpClient);
	private readonly _notifications = inject(NotificationService);
	private readonly _selectedIds = signal<string[]>([]);
	private _loadedScope = '';

	protected readonly pickerOpen = signal(false);

	public readonly items = input.required<QuickAccessItem[]>();

	protected readonly userRoles = computed(() => this._auth.currentUser()?.roles ?? []);
	protected readonly userScope = computed(() => {
		const user = this._auth.currentUser();
		const roles = this.userRoles().slice().sort().join('-') || 'sin-rol';
		return user ? `${user.id}.${roles}` : '';
	});
	protected readonly availableItems = computed(() => {
		const roles = this.userRoles();
		return this.items().filter((item) => !item.roles || item.roles.some((role) => roles.includes(role)));
	});
	protected readonly selectedItems = computed(() => {
		const available = this.availableItems();
		const selected = new Set(this._selectedIds());
		return available.filter((item) => selected.has(item.id));
	});
	protected readonly addableItems = computed(() => {
		const selected = new Set(this._selectedIds());
		return this.availableItems().filter((item) => !selected.has(item.id));
	});

	constructor() {
		effect(() => {
			const scope = this.userScope();
			this.availableItems();
			if (!scope || scope === this._loadedScope) {
				return;
			}
			this._loadedScope = scope;
			this.loadSelection();
		});
	}

	protected togglePicker(): void {
		this.pickerOpen.update((open) => !open);
	}

	protected closePicker(): void {
		this.pickerOpen.set(false);
	}

	protected addShortcut(itemId: string): void {
		if (this._selectedIds().includes(itemId)) {
			return;
		}
		this.setSelection([...this._selectedIds(), itemId]);
		this.pickerOpen.set(false);
	}

	protected removeShortcut(itemId: string): void {
		this.setSelection(this._selectedIds().filter((id) => id !== itemId));
	}

	private setSelection(ids: string[]): void {
		const previous = this._selectedIds();
		const normalized = this.normalizeSelection(ids);
		this._selectedIds.set(normalized);
		this.persistSelection(normalized, previous);
	}

	private loadSelection(): void {
		this._http.get<{ data: DashboardShortcutApiItem[] }>('/api/v1/dashboard/shortcuts').subscribe({
			next: ({ data }) => {
				const ids = data
					.slice()
					.sort((a, b) => a.sortOrder - b.sortOrder)
					.map((shortcut) => shortcut.shortcutId);
				this._selectedIds.set(this.normalizeSelection(ids));
			},
			error: () => {
				this._selectedIds.set([]);
				this._notifications.error('No se pudieron cargar tus atajos.');
			},
		});
	}

	private persistSelection(ids: string[], previous: string[]): void {
		this._http.put<{ data: DashboardShortcutApiItem[] }>('/api/v1/dashboard/shortcuts', { shortcuts: ids }).subscribe({
			next: ({ data }) => {
				const savedIds = data
					.slice()
					.sort((a, b) => a.sortOrder - b.sortOrder)
					.map((shortcut) => shortcut.shortcutId);
				this._selectedIds.set(this.normalizeSelection(savedIds));
			},
			error: () => {
				this._selectedIds.set(previous);
				this._notifications.error('No se pudieron guardar tus atajos.');
			},
		});
	}

	private normalizeSelection(ids: string[]): string[] {
		const availableIds = new Set(this.availableItems().map((item) => item.id));
		return ids.filter((id, index) => availableIds.has(id) && ids.indexOf(id) === index);
	}
}
