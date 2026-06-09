import { Component } from '@angular/core';
import { PricesListComponent } from './components/prices-list/prices-list.component';

@Component({
  selector: 'spartan-prices-page',
  standalone: true,
  imports: [PricesListComponent],
  template: '<spartan-prices-list></spartan-prices-list>',
})
export class PricesPageComponent {}
