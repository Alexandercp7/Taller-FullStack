import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { AppSidebarInset } from './app-sidebar';
import { SiteHeader } from './site-header';

@Component({
	selector: 'spartan-sidebar-inset',
	imports: [HlmSidebarImports, SiteHeader, AppSidebarInset, RouterOutlet],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'block',
	},
	styleUrl: '../../../styles.css',
	template: `
		<spartan-app-sidebar-inset>
			<main hlmSidebarInset>
				<spartan-site-header-inset />
				<router-outlet />
			</main>
		</spartan-app-sidebar-inset>
	`,
})
export default class SidebarInsetPage {}
