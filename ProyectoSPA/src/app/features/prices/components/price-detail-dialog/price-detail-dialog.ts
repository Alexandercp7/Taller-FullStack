import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { Servicio, ServicioAutomotriz, ServicioTorno } from '../../models/price.model';

export interface PriceDetailDialogContext {
  servicio: Servicio;
}

@Component({
  selector: 'spartan-price-detail-dialog',
  standalone: true,
  imports: [CommonModule, HlmButtonImports, HlmBadgeImports],
  templateUrl: './price-detail-dialog.html',
  styleUrl: './price-detail-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceDetailDialogComponent {
  private readonly dialogRef = inject(BrnDialogRef<unknown>);
  protected readonly context = injectBrnDialogContext<PriceDetailDialogContext>();
  protected readonly servicio = this.context.servicio;

  protected close(): void {
    this.dialogRef.close(false);
  }

  protected isTorno(servicio: Servicio): servicio is ServicioTorno {
    return 'tamano' in servicio;
  }

  protected isAutomotriz(servicio: Servicio): servicio is ServicioAutomotriz {
    return 'concepto' in servicio;
  }

  protected getCategoryColor(categoria: string): string {
    switch (categoria) {
      case 'Afinación y Otros':
        return 'bg-blue-500';
      case 'Mecánica Rápida':
        return 'bg-green-500';
      case 'Mecánica General':
        return 'bg-orange-500';
      case 'Servicio de Torno':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  }
}
