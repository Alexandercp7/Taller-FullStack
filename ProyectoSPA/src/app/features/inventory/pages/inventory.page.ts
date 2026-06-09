import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InventoryContentComponent } from '../components';

@Component({
	selector: 'spartan-inventory-page',
	imports: [InventoryContentComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '<spartan-inventory-content />',
})
export class InventoryPageComponent {}
