import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { InventoryService } from '../../services';
import { ClientCustodySectionComponent } from '../client-custody-section';
import { SalePartsSectionComponent } from '../sale-parts-section';
import { StockItemsSectionComponent } from '../stock-items-section';

@Component({
	selector: 'spartan-inventory-content',
	standalone: true,
	imports: [
		CommonModule,
		HlmTabsImports,
		HlmBadgeImports,
		HlmInputImports,
		StockItemsSectionComponent,
		ClientCustodySectionComponent,
		SalePartsSectionComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './inventory-content.html',
	styleUrl: './inventory-content.css',
})
export class InventoryContentComponent {
	private readonly _service = inject(InventoryService);
	protected readonly search = signal('');
	protected readonly lowStock = this._service.lowStockItems;

	protected updateSearch(value: string): void {
		this.search.set(value);
	}
}
