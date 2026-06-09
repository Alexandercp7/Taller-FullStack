import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmCardImports } from '@spartan-ng/helm/card';
import type { FinancialSummaryItem } from '../../models/dashboard.models';

@Component({
	selector: 'spartan-financial-summary',
	imports: [HlmCardImports, HlmBadgeImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './financial-summary.html',
	styleUrl: './financial-summary.css',
})
export class FinancialSummaryComponent {
	public readonly items = input.required<FinancialSummaryItem[]>();
}
