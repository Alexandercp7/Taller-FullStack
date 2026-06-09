import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WorkOrderDetailContentComponent } from '../components/work-order-detail-content';

@Component({
	selector: 'spartan-work-order-detail-page',
	imports: [WorkOrderDetailContentComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '<spartan-work-order-detail-content />',
})
export class WorkOrderDetailPageComponent {}
