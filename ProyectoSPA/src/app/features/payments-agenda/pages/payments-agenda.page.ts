import { PaymentsAgendaSectionComponent } from '../components/payments-agenda-section.component';
import { Component } from '@angular/core';

@Component({
  selector: 'spartan-payments-agenda-page',
  standalone: true,
  imports: [PaymentsAgendaSectionComponent],
  template: `<spartan-payments-agenda-section />`
})
export class PaymentsAgendaPage {}
