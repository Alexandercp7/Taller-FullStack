import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { DatePickerFieldComponent } from '../../../../shared';
import { type Payment } from '../../models/payment.model';

export interface CreatePaymentDialogContext {
  payment?: Payment;
  onCreate?: (payload: Omit<Payment, 'id' | 'comprobanteUrl'>) => void;
  onUpdate?: (id: string, payload: Omit<Payment, 'id' | 'comprobanteUrl'>) => void;
}

@Component({
  selector: 'spartan-create-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmInputImports,
    HlmButtonImports,
    HlmSelectImports,
    DatePickerFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-payment-dialog.html',
  styleUrl: './create-payment-dialog.css',
})
export class CreatePaymentDialogComponent {
  private readonly _dialogRef = inject(BrnDialogRef<unknown>);
  private readonly _context = injectBrnDialogContext<CreatePaymentDialogContext>();

  protected readonly isEditing = signal(!!this._context.payment);

  protected readonly concepto = signal('');
  protected readonly tipo = signal<'Periódico' | 'No Periódico'>('Periódico');
  protected readonly categoria = signal<
    'Renta' | 'Nómina' | 'Servicios' | 'Suscripciones' | 'Créditos' | 'Proveedores' | 'Mantenimiento' | 'Extraordinario'
  >('Renta');
  protected readonly fechaVencimiento = signal('');
  protected readonly estado = signal<'Pendiente' | 'Pagado' | 'Vencido'>('Pendiente');
  protected readonly montoPresupuestado = signal(0);
  protected readonly montoPagado = signal(0);
  protected readonly notas = signal('');

  constructor() {
    effect(() => {
      if (this._context.payment) {
        this.concepto.set(this._context.payment.concepto);
        this.tipo.set(this._context.payment.tipo);
        this.categoria.set(this._context.payment.categoria);
        this.fechaVencimiento.set(this._context.payment.fechaVencimiento);
        this.estado.set(this._context.payment.estado);
        this.montoPresupuestado.set(this._context.payment.montoPresupuestado);
        this.montoPagado.set(this._context.payment.montoPagado);
        this.notas.set(this._context.payment.notas || '');
      }
    });
  }

  protected readonly tipos = ['Periódico', 'No Periódico'] as const;
  protected readonly categorias = [
    'Renta',
    'Nómina',
    'Servicios',
    'Suscripciones',
    'Créditos',
    'Proveedores',
    'Mantenimiento',
    'Extraordinario',
  ] as const;
  protected readonly estados = ['Pendiente', 'Pagado', 'Vencido'] as const;

  protected readonly canCreate = computed(
    () =>
      this.concepto().trim().length > 0 &&
      this.fechaVencimiento().trim().length > 0 &&
      this.montoPresupuestado() > 0,
  );

  protected onTipoChange(value: string): void {
    if (value === 'Periódico' || value === 'No Periódico') {
      this.tipo.set(value);
    }
  }

  protected onCategoriaChange(value: string): void {
    if (
      value === 'Renta' ||
      value === 'Nómina' ||
      value === 'Servicios' ||
      value === 'Suscripciones' ||
      value === 'Créditos' ||
      value === 'Proveedores' ||
      value === 'Mantenimiento' ||
      value === 'Extraordinario'
    ) {
      this.categoria.set(value);
    }
  }

  protected onEstadoChange(value: string): void {
    if (value === 'Pendiente' || value === 'Pagado' || value === 'Vencido') {
      this.estado.set(value);
    }
  }

  protected submit(): void {
    if (!this.canCreate()) {
      return;
    }

    const payload = {
      concepto: this.concepto().trim(),
      tipo: this.tipo(),
      categoria: this.categoria(),
      fechaVencimiento: this.fechaVencimiento(),
      estado: this.estado(),
      montoPresupuestado: this.montoPresupuestado(),
      montoPagado: this.montoPagado(),
      notas: this.notas().trim(),
    };

    if (this.isEditing() && this._context.onUpdate && this._context.payment) {
      this._context.onUpdate(this._context.payment.id, payload);
    } else if (!this.isEditing() && this._context.onCreate) {
      this._context.onCreate(payload);
    }

    this._dialogRef.close();
  }

  protected cancel(): void {
    this._dialogRef.close();
  }
}
