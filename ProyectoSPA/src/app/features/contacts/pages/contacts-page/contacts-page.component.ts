import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ContactsSectionComponent } from '../../components';

@Component({
  selector: 'spartan-contacts-page',
  standalone: true,
  imports: [ContactsSectionComponent],
  template: `<spartan-contacts-section />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsPageComponent {}
