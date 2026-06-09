import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrnDialogState } from '@spartan-ng/brain/dialog';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucidePencil, lucideTrash2, lucidePlus } from '@ng-icons/lucide';
import { NotificationService } from '../../../../core';
import { PricesService } from '../../services/prices.service';
import { Servicio, ServicioAutomotriz, ServicioTorno, PriceFilter } from '../../models/price.model';
import { CreatePriceDialogComponent } from '../create-price-dialog/create-price-dialog';
import { PriceQuoterComponent } from '../price-quoter/price-quoter.component';

@Component({
  selector: 'spartan-prices-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmCardImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmInputImports,
    HlmSelectImports,
    HlmTableImports,
    HlmLabelImports,
    HlmPopoverImports,
    HlmTabsImports,
    NgIcon,
    PriceQuoterComponent,
  ],
  providers: [provideIcons({ lucideEye, lucidePencil, lucideTrash2, lucidePlus })],
  templateUrl: './prices-list.html',
  styleUrl: './prices-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricesListComponent {
  private readonly pricesService = inject(PricesService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(HlmDialogService);

  protected readonly searchText = signal<string>('');
  protected readonly selectedCategoria = signal<string>('Todas');
  protected readonly selectedSistema = signal<string>('');
  protected readonly selectedFamilia = signal<string>('');
  protected readonly pageSize = signal<number>(10);
  protected readonly pageNumber = signal<number>(0);
  protected readonly showQuoter = signal<boolean>(false);

  private readonly popoverStates = new Map<number, ReturnType<typeof signal<BrnDialogState | null>>>();

  protected getPopoverState(id: number) {
    if (!this.popoverStates.has(id)) {
      this.popoverStates.set(id, signal<BrnDialogState | null>(null));
    }
    return this.popoverStates.get(id)!;
  }

  protected readonly sistemaOptions = computed(() => {
    return this.pricesService.getSistemasPorCategoria(this.selectedCategoria());
  });

  protected readonly familiaOptions = computed(() => {
    return this.pricesService.getFamiliasPorSistema(this.selectedCategoria(), this.selectedSistema() || undefined);
  });

  protected readonly filteredData = computed(() => {
    const filter: PriceFilter = {
      searchText: this.searchText(),
      categoriaPrincipal: this.selectedCategoria(),
      sistema: this.selectedSistema() || undefined,
      familia: this.selectedFamilia() || undefined,
      pageSize: this.pageSize(),
      pageNumber: this.pageNumber(),
    };
    return this.pricesService.filterServicios(filter);
  });

  protected readonly servicios = computed(() => this.filteredData().items);
  protected readonly totalItems = computed(() => this.filteredData().total);
  protected readonly totalPages = computed(() =>
    Math.ceil(this.totalItems() / this.pageSize())
  );

  protected readonly categorias = ['Todas', 'Afinación y Otros', 'Mecánica Rápida', 'Mecánica General', 'Servicio de Torno'];

  protected isTorno(servicio: Servicio): boolean {
    return this.pricesService.isTorno(servicio);
  }

  protected selectCategoria(categoria: string): void {
    this.selectedCategoria.set(categoria);
    this.selectedSistema.set('');
    this.selectedFamilia.set('');
    this.pageNumber.set(0);
  }

  protected selectSistema(sistema: string): void {
    this.selectedSistema.set(sistema);
    this.selectedFamilia.set('');
    this.pageNumber.set(0);
  }

  protected selectFamilia(familia: string): void {
    this.selectedFamilia.set(familia);
    this.pageNumber.set(0);
  }

  protected onSearch(text: string): void {
    this.searchText.set(text);
    this.pageNumber.set(0);
  }

  protected changePageSize(size: number): void {
    this.pageSize.set(size);
    this.pageNumber.set(0);
  }

  protected goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.pageNumber.set(page);
    }
  }

  protected createServicio(): void {
    const context = {
      categoria: this.selectedCategoria(),
      onCreate: (servicio: Servicio) => {
        this.onCreateServicio(servicio);
      },
    };
    this.dialog.open(CreatePriceDialogComponent, { context });
  }

  protected editServicio(servicio: Servicio): void {
    const context = {
      servicio,
      onUpdate: (id: number, updated: Servicio) => {
        this.onUpdateServicio(id, updated);
      },
    };
    this.dialog.open(CreatePriceDialogComponent, { context });
  }

  protected deleteServicio(id: number): void {
    if (confirm('¿Seguro que deseas eliminar este servicio?')) {
      this.pricesService.deleteServicio(id);
      this.notification.success('Servicio eliminado');
    }
  }

  private onCreateServicio(servicio: Servicio): void {
    this.pricesService.addServicio(servicio);
    this.notification.success('Servicio creado');
  }

  private onUpdateServicio(id: number, updated: Servicio): void {
    this.pricesService.updateServicio(id, updated);
    this.notification.success('Servicio actualizado');
  }

  protected getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxButtons = 5;
    const totalPages = this.totalPages();
    const currentPage = this.pageNumber();

    let startPage = Math.max(0, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons);

    if (endPage - startPage < maxButtons) {
      startPage = Math.max(0, endPage - maxButtons);
    }

    for (let i = startPage; i < endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  protected readonly Math = Math;
}
