import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { Servicio, ServicioAutomotriz, ServicioTorno } from '../../models/price.model';
import { PricesService } from '../../services/prices.service';

export interface CreatePriceDialogContext {
  servicio?: Servicio;
  categoria?: string;
  onCreate?: (servicio: Servicio) => void;
  onUpdate?: (id: number, servicio: Servicio) => void;
}

@Component({
  selector: 'spartan-create-price-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmButtonImports,
    HlmInputImports,
    HlmSelectImports,
    HlmLabelImports,
  ],
  templateUrl: './create-price-dialog.html',
  styleUrl: './create-price-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatePriceDialogComponent {
  private readonly dialogRef = inject(BrnDialogRef<Servicio | void>);
  private readonly pricesService = inject(PricesService);
  protected readonly context = injectBrnDialogContext<CreatePriceDialogContext>();
  protected readonly isEditMode = !!this.context.servicio;

  protected readonly selectedCategoria = signal(
    this.context.categoria || this.context.servicio?.categoriaPrincipal || 'Afinación y Otros'
  );

  protected readonly isTorno = computed(() => this.selectedCategoria() === 'Servicio de Torno');

  protected readonly concepto = signal(
    this.context.servicio && 'concepto' in this.context.servicio ? 
    (this.context.servicio as ServicioAutomotriz).concepto : ''
  );
  protected readonly sistema = signal(
    this.context.servicio && 'sistema' in this.context.servicio ? 
    (this.context.servicio as ServicioAutomotriz).sistema : ''
  );
  protected readonly familia = signal(
    this.context.servicio && 'familia' in this.context.servicio ? 
    (this.context.servicio as ServicioAutomotriz).familia : ''
  );
  protected readonly precioAuto = signal(
    this.context.servicio && 'precioAuto' in this.context.servicio ? 
    (this.context.servicio as ServicioAutomotriz).precioAuto : ''
  );
  protected readonly precioCamioneta = signal(
    this.context.servicio && 'precioCamioneta' in this.context.servicio ? 
    (this.context.servicio as ServicioAutomotriz).precioCamioneta : ''
  );
  protected readonly precioCamion = signal(
    this.context.servicio && 'precioCamion' in this.context.servicio ? 
    (this.context.servicio as ServicioAutomotriz).precioCamion : ''
  );
  protected readonly observacion = signal(
    this.context.servicio && 'observacion' in this.context.servicio ? 
    (this.context.servicio as ServicioAutomotriz).observacion : ''
  );

  protected readonly tamano = signal(
    this.context.servicio && 'tamano' in this.context.servicio ? 
    (this.context.servicio as ServicioTorno).tamano : ''
  );
  protected readonly diametro = signal(
    this.context.servicio && 'diametro' in this.context.servicio ? 
    (this.context.servicio as ServicioTorno).diametro : ''
  );
  protected readonly precio = signal(
    this.context.servicio && 'precio' in this.context.servicio ? 
    (this.context.servicio as ServicioTorno).precio : ''
  );

  protected readonly sistemaOptions = computed(() => {
    const cat = this.selectedCategoria();
    return this.pricesService.getSistemasPorCategoria(cat);
  });

  protected readonly familiaOptions = computed(() => {
    const cat = this.selectedCategoria();
    const sist = this.sistema();
    return sist ? this.pricesService.getFamiliasPorSistema(cat, sist) : [];
  });

  protected save(): void {
    if (this.isTorno()) {
      this.saveTorno();
    } else {
      this.saveAutomotriz();
    }
  }

  private saveTorno(): void {
    if (!this.tamano() || !this.diametro() || !this.precio()) {
      alert('Por favor, completa todos los campos requeridos');
      return;
    }

    const servicio: ServicioTorno = {
      id: this.context.servicio ? (this.context.servicio as ServicioTorno).id : Date.now(),
      categoriaPrincipal: 'Servicio de Torno',
      tamano: this.tamano(),
      diametro: this.diametro(),
      precio: this.precio(),
    };

    if (this.isEditMode && this.context.onUpdate) {
      this.context.onUpdate((this.context.servicio as Servicio).id, servicio);
    } else if (this.context.onCreate) {
      this.context.onCreate(servicio);
    }
    this.dialogRef.close();
  }

  private saveAutomotriz(): void {
    if (!this.concepto() || !this.sistema() || !this.precioAuto() || !this.precioCamioneta() || !this.precioCamion()) {
      alert('Por favor, completa los campos requeridos (concepto, sistema, precios)');
      return;
    }

    const servicio: ServicioAutomotriz = {
      id: this.context.servicio ? (this.context.servicio as ServicioAutomotriz).id : Date.now(),
      categoriaPrincipal: this.selectedCategoria() as 'Afinación y Otros' | 'Mecánica Rápida' | 'Mecánica General',
      concepto: this.concepto(),
      sistema: this.sistema(),
      familia: this.familia(),
      precioAuto: this.precioAuto(),
      precioCamioneta: this.precioCamioneta(),
      precioCamion: this.precioCamion(),
      observacion: this.observacion(),
    };

    if (this.isEditMode && this.context.onUpdate) {
      this.context.onUpdate((this.context.servicio as Servicio).id, servicio);
    } else if (this.context.onCreate) {
      this.context.onCreate(servicio);
    }
    this.dialogRef.close();
  }

  protected close(): void {
    this.dialogRef.close();
  }

  protected setCategoria(cat: string): void {
    this.selectedCategoria.set(cat);
    this.sistema.set('');
    this.familia.set('');
  }

  protected setSistema(sist: string): void {
    this.sistema.set(sist);
    this.familia.set('');
  }

  protected setNumeric(sig: { set: (v: string) => void }, event: Event): void {
    sig.set((event.target as HTMLInputElement).value);
  }
}
