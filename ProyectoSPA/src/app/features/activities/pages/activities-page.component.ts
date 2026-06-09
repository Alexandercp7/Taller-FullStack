import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivitiesSectionComponent } from '../components/activities-section.component';

@Component({
  selector: 'spartan-activities-page',
  standalone: true,
  imports: [ActivitiesSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<spartan-activities-section />',
})
export class ActivitiesPageComponent {}
