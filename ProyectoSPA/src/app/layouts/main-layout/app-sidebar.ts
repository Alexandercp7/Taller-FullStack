import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCar } from '@ng-icons/lucide';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { AuthService } from '../../core/auth/auth.service';
import { navMainSections, navSecondary } from './shared/data';
import { NavMain } from './shared/nav-main';
import { NavSecondary } from './shared/nav-secondary';
import { NavUser } from './shared/nav-user';

@Component({
	selector: 'spartan-app-sidebar-inset',
	imports: [HlmSidebarImports, NgIcon, NavMain, NavUser, NavSecondary],
	providers: [provideIcons({ lucideCar })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div hlmSidebarWrapper>
			<hlm-sidebar variant="inset">
				<hlm-sidebar-header>
					<ul hlmSidebarMenu>
						<li hlmSidebarMenuItem>
							<a hlmSidebarMenuButton size="lg" href="#">
								<div
									class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
								>
									<ng-icon name="lucideCar" class="text-base" />
								</div>
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-medium">Servicio Automotriz</span>
									<span class="truncate text-xs">Colosio</span>
								</div>
							</a>
						</li>
					</ul>
				</hlm-sidebar-header>

				<hlm-sidebar-content>
					<spartan-nav-main [sections]="filteredSections()" />
					<spartan-nav-secondary class="mt-auto" [items]="navSecondary" />
				</hlm-sidebar-content>
				<hlm-sidebar-footer>
					<spartan-nav-user />
				</hlm-sidebar-footer>
			</hlm-sidebar>
			<ng-content />
		</div>
	`,
})
export class AppSidebarInset {
	private readonly _authService = inject(AuthService);

	protected readonly navSecondary = navSecondary;

	protected readonly filteredSections = computed(() => {
		const roles = this._authService.currentUser()?.roles ?? [];
		return navMainSections
			.map(section => ({
				...section,
				items: section.items.filter(item => !item.roles || item.roles.some(r => roles.includes(r))),
			}))
			.filter(section => section.items.length > 0);
	});
}
