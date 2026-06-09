import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

/**
 * Stores the current visual theme and applies it to the document root.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
	private static readonly STORAGE_KEY = 'colosio-theme';

	private readonly _document = inject(DOCUMENT);
	private readonly _theme = signal<Theme>('light');

	public readonly theme = this._theme.asReadonly();
	public readonly isDark = computed(() => this._theme() === 'dark');

	public initializeTheme(): void {
		const persistedTheme = this.readPersistedTheme();
		const initialTheme = persistedTheme ?? this.getSystemTheme();
		this.setTheme(initialTheme, false);
	}

	public toggleTheme(): void {
		this.setTheme(this.isDark() ? 'light' : 'dark');
	}

	public setTheme(theme: Theme, persist = true): void {
		this._theme.set(theme);
		this.applyTheme(theme);

		if (persist) {
			this.persistTheme(theme);
		}
	}

	private applyTheme(theme: Theme): void {
		const root = this._document.documentElement;
		root.classList.toggle('dark', theme === 'dark');
		root.style.colorScheme = theme;
	}

	private readPersistedTheme(): Theme | null {
		try {
			const theme = localStorage.getItem(ThemeService.STORAGE_KEY);
			return this.isValidTheme(theme) ? theme : null;
		} catch {
			return null;
		}
	}

	private persistTheme(theme: Theme): void {
		try {
			localStorage.setItem(ThemeService.STORAGE_KEY, theme);
		} catch {
			// Ignore storage errors
		}
	}

	private getSystemTheme(): Theme {
		if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
			return 'light';
		}

		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	private isValidTheme(value: string | null): value is Theme {
		return value === 'light' || value === 'dark';
	}
}
