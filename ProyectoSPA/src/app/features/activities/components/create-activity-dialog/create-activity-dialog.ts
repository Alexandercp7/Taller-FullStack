import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { DatePickerFieldComponent } from '../../../../shared';
import { Activity } from '../../models/activity.model';

export interface CreateActivityDialogContext {
  activity?: Activity;
  onCreate?: (payload: Omit<Activity, 'id' | 'comentarios'>) => void;
  onUpdate?: (id: string, payload: Omit<Activity, 'id' | 'comentarios'>) => void;
}

@Component({
  selector: 'spartan-create-activity-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmInputImports,
    HlmButtonImports,
    HlmSelectImports,
    HlmTextareaImports,
    DatePickerFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-activity-dialog.html',
  styleUrl: './create-activity-dialog.css',
})
export class CreateActivityDialogComponent {
  private readonly _dialogRef = inject(BrnDialogRef<unknown>);
  private readonly _context = injectBrnDialogContext<CreateActivityDialogContext>();

  protected readonly isEditing = signal(!!this._context.activity);

  protected readonly titulo = signal('');
  protected readonly descripcion = signal('');
  protected readonly asignadoA = signal('');
  protected readonly fechaLimite = signal('');
  protected readonly prioridad = signal<'Alta' | 'Media' | 'Baja'>('Media');
  protected readonly etiqueta = signal<
    'Administrativa' | 'Técnica' | 'Comercial' | 'Compras' | 'Mantenimiento' | string
  >('Administrativa');
  protected readonly estado = signal<'Pendiente' | 'En Progreso' | 'Completada' | 'Cancelada'>('Pendiente');

  constructor() {
    effect(() => {
      if (this._context.activity) {
        this.titulo.set(this._context.activity.titulo);
        this.descripcion.set(this._context.activity.descripcion);
        this.asignadoA.set(this._context.activity.asignadoA);
        this.fechaLimite.set(this._context.activity.fechaLimite);
        this.prioridad.set(this._context.activity.prioridad);
        this.etiqueta.set(this._context.activity.etiqueta);
        this.estado.set(this._context.activity.estado);
      }
    });
  }

  protected readonly prioridades = ['Alta', 'Media', 'Baja'] as const;
  protected readonly etiquetas = [
    'Administrativa',
    'Técnica',
    'Comercial',
    'Compras',
    'Mantenimiento'
  ] as const;
  protected readonly estados = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada'] as const;

  protected readonly canCreate = computed(
    () =>
      this.titulo().trim().length > 0 &&
      this.descripcion().trim().length > 0 &&
      this.asignadoA().trim().length > 0 &&
      this.fechaLimite().trim().length > 0
  );

  protected onPrioridadChange(value: string): void {
    if (value === 'Alta' || value === 'Media' || value === 'Baja') {
      this.prioridad.set(value);
    }
  }

  protected onEtiquetaChange(value: string): void {
    this.etiqueta.set(value);
  }

  protected onEstadoChange(value: string): void {
    if (value === 'Pendiente' || value === 'En Progreso' || value === 'Completada' || value === 'Cancelada') {
      this.estado.set(value);
    }
  }

  protected submit(): void {
    if (!this.canCreate()) {
      return;
    }

    const payload = {
      titulo: this.titulo().trim(),
      descripcion: this.descripcion().trim(),
      asignadoA: this.asignadoA().trim(),
      fechaLimite: this.fechaLimite(),
      prioridad: this.prioridad(),
      etiqueta: this.etiqueta(),
      estado: this.estado(),
    };

    if (this.isEditing() && this._context.onUpdate && this._context.activity) {
      this._context.onUpdate(this._context.activity.id, payload);
    } else if (!this.isEditing() && this._context.onCreate) {
      this._context.onCreate(payload);
    }

    this._dialogRef.close();
  }

  protected cancel(): void {
    this._dialogRef.close();
  }
}
