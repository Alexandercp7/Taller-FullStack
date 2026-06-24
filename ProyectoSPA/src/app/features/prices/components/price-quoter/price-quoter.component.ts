import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTrash2, lucidePlus, lucideDownload } from '@ng-icons/lucide';
import { NotificationService, PdfMakerService } from '../../../../core';
import { PricesService } from '../../services/prices.service';
import { Servicio, ServicioAutomotriz, ServicioTorno, QuoteLineItem } from '../../models/price.model';

@Component({
  selector: 'spartan-price-quoter',
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
    NgIcon,
  ],
  providers: [provideIcons({ lucideTrash2, lucidePlus, lucideDownload })],
  templateUrl: './price-quoter.html',
  styleUrl: './price-quoter.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceQuoterComponent {
  private readonly service = inject(PricesService);
  private readonly notification = inject(NotificationService);
  private readonly pdfMaker = inject(PdfMakerService);

  public readonly servicios = computed(() => this.service.getServicios());

  protected readonly selectedService = signal<Servicio | null>(null);
  protected readonly selectedQuantity = signal<number>(1);
  protected readonly quoteItems = signal<QuoteLineItem[]>([]);

  protected readonly selectedServiceLabel = computed(() => {
    const service = this.selectedService();
    if (!service) return '';
    return 'concepto' in service
      ? (service as ServicioAutomotriz).concepto
      : (service as ServicioTorno).tamano;
  });

  protected readonly subtotal = computed(() => {
    return this.quoteItems().reduce((sum, item) => sum + item.subtotal, 0);
  });

  protected readonly taxAmount = computed(() => {
    return Math.round(this.subtotal() * 0.2 * 100) / 100;
  });

  protected readonly total = computed(() => {
    return this.roundPrice(this.subtotal() + this.taxAmount());
  });

  protected readonly serviceItemToString = (item: unknown): string => {
    const service = item as Servicio | null;
    if (!service) return '';
    return 'concepto' in service ? service.concepto : service.tamano;
  };

  protected readonly isSameService = (service: Servicio | null, value: Servicio | null): boolean => {
    return !!service && !!value && service.id === value.id;
  };

  protected onServiceSelected(value: unknown): void {
    this.selectedService.set((value as Servicio | null) ?? null);
  }

  protected addServiceToQuote(): void {
    const service = this.selectedService();
    if (!service) {
      this.notification.error('Selecciona un servicio');
      return;
    }

    const quantity = Math.max(1, this.selectedQuantity());
    
    let priceStr = '';
    if ('precioAuto' in service) {
      priceStr = service['precioAuto'];
    } else if ('precio' in service) {
      priceStr = service['precio'];
    }

    const precioUnitario = this.parsePrice(priceStr);
    const subtotal = this.roundPrice(precioUnitario * quantity);
    
    const nombreServicio = 'concepto' in service ? service['concepto'] : service['tamano'];

    const item: QuoteLineItem = {
      id: `${service.id}-${Date.now()}`,
      nombre: nombreServicio,
      tipo: 'servicio',
      cantidad: quantity,
      precioUnitario,
      subtotal,
    };

    this.quoteItems.update(items => [...items, item]);
    this.selectedService.set(null);
    this.selectedQuantity.set(1);
    this.notification.success(`${nombreServicio} agregado a la cotización`);
  }

  protected removeItem(itemId: string): void {
    this.quoteItems.update(items => items.filter(item => item.id !== itemId));
  }

  protected async generatePDF(): Promise<void> {
    const items = this.quoteItems();
    if (items.length === 0) return;

    try {
      const date = new Date().toLocaleDateString('es-MX');
      const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const subtotal  = this.subtotal();
      const taxAmount = this.taxAmount();
      const total     = this.total();

      const doc = await this.pdfMaker.create();
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 40;

      doc.setFontSize(22).setFont('helvetica', 'bold');
      doc.text('COTIZACIÓN', margin, 60);

      doc.setFontSize(11).setFont('helvetica', 'normal').setTextColor(100);
      doc.text(`Fecha: ${date}`, margin, 80);

      doc.setDrawColor(220).line(margin, 92, pageW - margin, 92);

      await this.pdfMaker.addTable(doc, {
        startY: 102,
        margin: { left: margin, right: margin },
        head: [['Descripción', 'Cantidad', 'Precio Unitario', 'Subtotal']],
        body: items.map(item => [
          item.nombre,
          String(item.cantidad),
          fmt(item.precioUnitario),
          fmt(item.subtotal),
        ]),
        headStyles:   { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold', fontSize: 10 },
        bodyStyles:   { fontSize: 10 },
        columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
        theme: 'plain',
        tableLineColor: [220, 220, 220],
        tableLineWidth: 0.5,
      });

      const afterTable = (doc as any).lastAutoTable.finalY + 14;
      doc.setDrawColor(220).line(margin, afterTable, pageW - margin, afterTable);

      const col2x = pageW - margin - 180;
      let y = afterTable + 18;

      doc.setFontSize(10).setFont('helvetica', 'normal').setTextColor(50);
      doc.text('Subtotal:', col2x, y);
      doc.text(fmt(subtotal), pageW - margin, y, { align: 'right' });

      y += 18;
      doc.setTextColor(22, 163, 74);
      doc.text('Impuesto (20%):', col2x, y);
      doc.text(fmt(taxAmount), pageW - margin, y, { align: 'right' });

      y += 10;
      doc.setDrawColor(50).line(col2x, y, pageW - margin, y);
      y += 14;

      doc.setFontSize(13).setFont('helvetica', 'bold').setTextColor(17);
      doc.text('TOTAL:', col2x, y);
      doc.text(fmt(total), pageW - margin, y, { align: 'right' });

      doc.save(`cotizacion-${Date.now()}.pdf`);
      this.notification.success('Cotización descargada');
    } catch (err) {
      console.error('[PDF] Error al generar PDF:', err);
      this.notification.error('No se pudo generar el PDF.');
    }
  }

  private parsePrice(priceStr: unknown): number {
    if (priceStr === null || typeof priceStr === 'undefined') return 0;
    const s = typeof priceStr === 'string' ? priceStr : String(priceStr);
    const cleaned = s.replace(/[$,]/g, '').trim();
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  private roundPrice(price: number): number {
    return Math.round(price * 100) / 100;
  }

  protected onQuantityChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = +(target?.value || 1);
    this.selectedQuantity.set(Math.max(1, value));
  }
}
