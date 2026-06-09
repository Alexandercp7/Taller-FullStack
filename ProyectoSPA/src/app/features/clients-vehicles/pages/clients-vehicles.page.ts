import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ClientsVehiclesContentComponent } from '../components';

@Component({
	selector: 'spartan-clients-vehicles-page',
	imports: [ClientsVehiclesContentComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '<spartan-clients-vehicles-content />',
})
export class ClientsVehiclesPageComponent {}
