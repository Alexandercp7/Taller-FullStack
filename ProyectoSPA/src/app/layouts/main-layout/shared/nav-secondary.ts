import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun } from '@ng-icons/lucide';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { ThemeService } from '../../../core';

@Component({
	selector: 'spartan-nav-secondary',
	imports: [HlmSidebarImports, NgIcon, RouterLink],
	providers: [provideIcons({ lucideMoon, lucideSun })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<hlm-sidebar-group>
			<div hlmSidebarGroupContent>
				<ul hlmSidebarMenu>
					@for (item of items(); track $index) {
						<li hlmSidebarMenuItem>
							<a hlmSidebarMenuButton size="sm" [routerLink]="item.url">
								<ng-icon [name]="item.icon" />
								{{ item.title }}
							</a>
						</li>
					}
					<li hlmSidebarMenuItem>
						<button hlmSidebarMenuButton size="sm" type="button" (click)="toggleTheme()">
							<ng-icon [name]="isDark() ? 'lucideSun' : 'lucideMoon'" />
							{{ isDark() ? 'Light mode' : 'Dark mode' }}
						</button>
					</li>
				</ul>
			</div>
		</hlm-sidebar-group>
	`,
})
export class NavSecondary {
	private readonly _themeService = inject(ThemeService);

	public readonly items = input.required<
		{
			title: string;
			url: string;
			icon: string;
		}[]
	>();

	protected readonly isDark = this._themeService.isDark;

	protected toggleTheme(): void {
		this._themeService.toggleTheme();
	}
}
