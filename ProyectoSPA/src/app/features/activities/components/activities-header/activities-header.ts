import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';

@Component({
  selector: 'spartan-activities-header',
  standalone: true,
  imports: [
    CommonModule,
    HlmButtonImports,
    HlmInputImports,
    HlmSelectImports,
    NgIcon,
  ],
  providers: [provideIcons({ lucidePlus })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activities-header.html',
  styleUrl: './activities-header.css',
})
export class ActivitiesHeaderComponent {
  readonly viewMode = input.required<'list' | 'kanban'>();
  readonly searchText = input.required<string>();
  readonly selectedTag = input.required<string>();
  readonly selectedPriority = input.required<string>();

  readonly toggleViewMode = output<'list' | 'kanban'>();
  readonly updateSearch = output<string>();
  readonly updateTag = output<string>();
  readonly updatePriority = output<string>();
  readonly createNew = output<void>();

  protected readonly tags = [
    'Administrativa',
    'Técnica',
    'Comercial',
    'Compras',
    'Mantenimiento'
  ];

  protected readonly priorities = ['Alta', 'Media', 'Baja'];

  protected onToggleView(): void {
    const newMode = this.viewMode() === 'list' ? 'kanban' : 'list';
    this.toggleViewMode.emit(newMode);
  }

  protected onCreateNew(): void {
    this.createNew.emit();
  }
}
