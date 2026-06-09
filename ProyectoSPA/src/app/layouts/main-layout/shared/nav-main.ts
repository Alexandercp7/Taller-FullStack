import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideBadgeCheck,
	lucideBookOpen,
	lucideChartPie,
	lucideCreditCard,
	lucideMap,
	lucidePackageSearch,
	lucideReceiptText,
	lucideSettings2,
	lucideSquareTerminal,
	lucideUsers,
} from '@ng-icons/lucide';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
	selector: 'spartan-nav-main',
	imports: [HlmSidebarImports, NgIcon, RouterLink],
	providers: [
		provideIcons({
			lucideSquareTerminal,
			lucideBookOpen,
			lucideUsers,
			lucidePackageSearch,
			lucideMap,
			lucideReceiptText,
			lucideBadgeCheck,
			lucideCreditCard,
			lucideChartPie,
			lucideSettings2,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@for (section of sections(); track section.label) {
			<hlm-sidebar-group>
				<div hlmSidebarGroupLabel>{{ section.label }}</div>
				<ul hlmSidebarMenu>
					@for (item of section.items; track item.title) {
						<li hlmSidebarMenuItem>
							<a hlmSidebarMenuButton [routerLink]="item.url" [isActive]="isRouteActive(item.url, item.exact)">
								<ng-icon [name]="item.icon" />
								{{ item.title }}
							</a>
						</li>
					}
				</ul>
			</hlm-sidebar-group>
		}
	`,
})
export class NavMain {
	private readonly _router = inject(Router);
	private readonly _currentUrl = toSignal(
		this._router.events.pipe(
			filter((event): event is NavigationEnd => event instanceof NavigationEnd),
			map((event) => event.urlAfterRedirects),
			startWith(this._router.url),
		),
		{ initialValue: this._router.url },
	);

	public readonly sections = input.required<
		{
			label: string;
			items: {
				title: string;
				url: string;
				icon: string;
				exact?: boolean;
				permission?: string;
			}[];
		}[]
	>();

	protected isRouteActive(url: string, exact = false): boolean {
		const current = this._currentUrl();
		return exact ? current === url : current === url || current.startsWith(`${url}/`);
	}
}
