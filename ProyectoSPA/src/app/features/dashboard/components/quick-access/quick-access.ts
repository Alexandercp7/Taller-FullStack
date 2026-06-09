import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePackageSearch, lucideReceiptText, lucideSquarePlus, lucideUsers } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import type { QuickAccessItem } from '../../models/dashboard.models';

@Component({
	selector: 'spartan-quick-access',
	imports: [RouterLink, NgIcon, HlmCardImports, HlmButtonImports],
	providers: [provideIcons({ lucideSquarePlus, lucidePackageSearch, lucideReceiptText, lucideUsers })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './quick-access.html',
	styleUrl: './quick-access.css',
})
export class QuickAccessComponent {
	public readonly items = input.required<QuickAccessItem[]>();
}
