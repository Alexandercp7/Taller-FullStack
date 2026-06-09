import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PortalOrderViewComponent } from '../components';

@Component({
	selector: 'spartan-portal-order-detail-page',
	imports: [PortalOrderViewComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<spartan-portal-order-view />`,
})
export class PortalOrderDetailPage {}
