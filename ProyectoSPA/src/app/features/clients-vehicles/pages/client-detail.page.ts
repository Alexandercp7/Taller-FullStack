import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ClientDetailContentComponent } from '../components';

@Component({
	selector: 'spartan-client-detail-page',
	imports: [ClientDetailContentComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '<spartan-client-detail-content />',
})
export class ClientDetailPageComponent {}
