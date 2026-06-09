import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { DatePickerFieldComponent } from '../../../../shared';
import { Activity } from '../../models/activity.model';

export interface CreateActivityDialogContext {
  activity?: Activity;
  onCreate?: (payload: Omit<Activity, 'id' | 'comentarios'>, asignadoAId: string) => void;
  onUpdate?: (id: string, payload: Omit<Activity, 'id' | 'comentarios'>, asignadoAId: string) => void;
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
  private readonly _http = inject(HttpClient);

  protected readonly isEditing = signal(!!this._context.activity);
  protected readonly employees = signal<{ id: string; name: string }[]>([]);

  protected readonly titulo = signal('');
  protected readonly descripcion = signal('');
  protected readonly asignadoAId = signal('');
  protected readonly asignadoAName = signal('');
  protected readonly fechaLimite = signal('');
  protected readonly prioridad = signal<'Alta' | 'Media' | 'Baja'>('Media');
  protected readonly etiqueta = signal<
    'Administrativa' | 'Técnica' | 'Comercial' | 'Compras' | 'Mantenimiento' | string
  >('Administrativa');
  protected readonly estado = signal<'Pendiente' | 'En Progreso' | 'Completada' | 'Cancelada'>('Pendiente');

  constructor() {
    this._http.get<{ data: { id: string; name: string }[] }>('/api/v1/employees').subscribe({
      next: (res) => {
        this.employees.set(res.data);
        if (this._context.activity?.asignadoAId) {
          this.asignadoAId.set(this._context.activity.asignadoAId);
        } else if (this._context.activity?.asignadoA) {
          const match = res.data.find(e => e.name === this._context.activity!.asignadoA);
          if (match) this.asignadoAId.set(match.id);
        }
      },
    });

    effect(() => {
      const act = this._context.activity;
      if (act) {
        this.titulo.set(act.titulo);
        this.descripcion.set(act.descripcion);
        this.asignadoAName.set(act.asignadoA);
        if (act.asignadoAId) this.asignadoAId.set(act.asignadoAId);
        this.fechaLimite.set(act.fechaLimite);
        this.prioridad.set(act.prioridad);
        this.etiqueta.set(act.etiqueta);
        this.estado.set(act.estado);
      }
    });
  }

  protected readonly prioridades = ['Alta', 'Media', 'Baja'] as const;
  protected readonly etiquetas = [
    'Administrativa',
    'Técnica',
    'Comercial',
    'Compras',
    'Mantenimiento',
  ] as const;
  protected readonly estados = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada'] as const;

  protected readonly canCreate = computed(
    () =>
      this.titulo().trim().length > 0 &&
      this.descripcion().trim().length > 0 &&
      this.asignadoAId().trim().length > 0 &&
      this.fechaLimite().trim().length > 0
  );

  protected onAsignadoChange(value: string): void {
    const emp = this.employees().find(e => e.id === value);
    if (emp) {
      this.asignadoAId.set(emp.id);
      this.asignadoAName.set(emp.name);
    }
  }

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
    if (!this.canCreate()) return;

    const payload = {
      titulo: this.titulo().trim(),
      descripcion: this.descripcion().trim(),
      asignadoA: this.asignadoAName().trim(),
      asignadoAId: this.asignadoAId().trim(),
      fechaLimite: this.fechaLimite(),
      prioridad: this.prioridad(),
      etiqueta: this.etiqueta(),
      estado: this.estado(),
    };

    if (this.isEditing() && this._context.onUpdate && this._context.activity) {
      this._context.onUpdate(this._context.activity.id, payload, this.asignadoAId());
    } else if (!this.isEditing() && this._context.onCreate) {
      this._context.onCreate(payload, this.asignadoAId());
    }

    this._dialogRef.close();
  }

  protected cancel(): void {
    this._dialogRef.close();
  }
}
