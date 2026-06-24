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
  onCreate?: (payload: Omit<Activity, 'id' | 'comentarios'>, asignadoAIds: string[]) => void;
  onUpdate?: (id: string, payload: Omit<Activity, 'id' | 'comentarios'>, asignadoAIds: string[]) => void;
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
  protected readonly asignadoAIds = signal<string[]>([]);
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
        if (this._context.activity?.asignadoAIds?.length) {
          this.asignadoAIds.set([...this._context.activity.asignadoAIds]);
        } else if (this._context.activity?.asignadoAId) {
          this.asignadoAIds.set([this._context.activity.asignadoAId]);
        } else if (this._context.activity?.asignadosA?.length) {
          const ids = res.data
            .filter((employee) => this._context.activity!.asignadosA.includes(employee.name))
            .map((employee) => employee.id);
          this.asignadoAIds.set(ids);
        }
      },
    });

    effect(() => {
      const act = this._context.activity;
      if (act) {
        this.titulo.set(act.titulo);
        this.descripcion.set(act.descripcion);
        if (act.asignadoAIds?.length) {
          this.asignadoAIds.set([...act.asignadoAIds]);
        } else if (act.asignadoAId) {
          this.asignadoAIds.set([act.asignadoAId]);
        }
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
      this.fechaLimite().trim().length > 0
  );

  protected asignadosSummary(): string {
    const selectedIds = this.asignadoAIds();
    if (selectedIds.length === 0) {
      return 'Seleccionar responsables';
    }

    const names = selectedIds
      .map((id) => this.employees().find((employee) => employee.id === id)?.name)
      .filter((name): name is string => !!name);

    if (names.length === 0) {
      return 'Seleccionar responsables';
    }

    return names.length === 1 ? names[0] : `${names[0]} (+${names.length - 1})`;
  }

  protected toggleAsignado(id: string): void {
    this.asignadoAIds.update((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
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

    const selectedIds = this.asignadoAIds().filter((id) => id.trim().length > 0);
    const selectedNames = selectedIds
      .map((id) => this.employees().find((employee) => employee.id === id)?.name)
      .filter((name): name is string => !!name);

    const payload = {
      titulo: this.titulo().trim(),
      descripcion: this.descripcion().trim(),
      asignadoA: selectedNames.join(', '),
      asignadoAId: selectedIds[0],
      asignadosA: selectedNames,
      asignadoAIds: selectedIds,
      fechaLimite: this.fechaLimite(),
      prioridad: this.prioridad(),
      etiqueta: this.etiqueta(),
      estado: this.estado(),
    };

    if (this.isEditing() && this._context.onUpdate && this._context.activity) {
      this._context.onUpdate(this._context.activity.id, payload, selectedIds);
    } else if (!this.isEditing() && this._context.onCreate) {
      this._context.onCreate(payload, selectedIds);
    }

    this._dialogRef.close();
  }

  protected cancel(): void {
    this._dialogRef.close();
  }
}
