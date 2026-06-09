import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PortalSearchContentComponent } from '../components';

@Component({
	selector: 'spartan-portal-lookup-page',
	imports: [PortalSearchContentComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `<spartan-portal-search-content />`,
})
export class PortalLookupPage {}
