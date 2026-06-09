import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WorkOrdersContentComponent } from '../components/work-orders-content';

@Component({
	selector: 'spartan-work-orders-page',
	imports: [WorkOrdersContentComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '<spartan-work-orders-content />',
})
export class WorkOrdersPageComponent {}
