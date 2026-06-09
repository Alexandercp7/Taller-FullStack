import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
	selector: 'spartan-portal-layout',
	imports: [RouterOutlet],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="portal-shell">
			<header class="portal-header">
				<div class="portal-header-inner">
					<span class="portal-brand">Portal de cliente</span>
				</div>
			</header>
			<main class="portal-main">
				<router-outlet />
			</main>
		</div>
	`,
	styleUrl: './portal-layout.css',
})
export default class PortalLayout {}
