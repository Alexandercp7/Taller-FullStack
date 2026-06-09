import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KpisService } from '../../services';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucideX } from '@ng-icons/lucide';

@Component({
	selector: 'app-kpis-objectives',
	standalone: true,
	imports: [CommonModule, FormsModule, HlmCardImports, HlmBadgeImports, HlmButtonImports, HlmInputImports, HlmTextareaImports, NgIcon],
	providers: [provideIcons({ lucidePencil, lucideX })],
	templateUrl: './kpis-objectives.html',
	styleUrl: './kpis-objectives.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpisObjectivesComponent {
	protected readonly kpisService = inject(KpisService);
	
	protected isAddingKPI = signal(false);
	protected editingKpiId = signal<string | null>(null);
	protected editingKpi: any = {};
	
	protected newKPI = {
		nombre: '',
		descripcion: '',
		roleResponsable: '',
		meta: 80,
		periodo: '',
	};

	protected roles: Array<'Líder Admin' | 'Director General' | 'Asesor de Servicio' | 'Líder Técnico' | 'Técnico Automotriz' | 'Personal de Apoyo'> = [
		'Líder Admin',
		'Director General',
		'Asesor de Servicio',
		'Líder Técnico',
		'Técnico Automotriz',
		'Personal de Apoyo',
	];

	protected toggleAddMode(): void {
		this.isAddingKPI.update(v => !v);
		if (!this.isAddingKPI()) {
			this.resetNewKPI();
		}
	}

	protected saveNewKPI(): void {
		if (!this.newKPI.nombre.trim() || !this.newKPI.roleResponsable) {
			alert('Por favor completa los campos requeridos');
			return;
		}

		const today = new Date().toISOString().split('T')[0];
		this.kpisService.createKPI({
			nombre: this.newKPI.nombre,
			descripcion: this.newKPI.descripcion,
			roleResponsable: this.newKPI.roleResponsable as any,
			meta: this.newKPI.meta,
			progreso: 0,
			periodo: this.newKPI.periodo,
			fechaInicio: today,
			fechaFin: today,
		});

		this.resetNewKPI();
		this.isAddingKPI.set(false);
	}

	protected editKPI(kpi: any): void {
		this.editingKpiId.set(kpi.id);
		this.editingKpi = { ...kpi };
	}

	protected saveEditarKPI(id: string): void {
		this.kpisService.updateKPI(id, {
			nombre: this.editingKpi.nombre,
			descripcion: this.editingKpi.descripcion,
			roleResponsable: this.editingKpi.roleResponsable,
			meta: this.editingKpi.meta,
			periodo: this.editingKpi.periodo,
		});
		this.editingKpiId.set(null);
	}

	protected cancelEdit(): void {
		this.editingKpiId.set(null);
	}

	protected deleteKPI(id: string): void {
		if (confirm('¿Estás seguro de que deseas eliminar este KPI?')) {
			this.kpisService.deleteKPI(id);
		}
	}

	protected resetNewKPI(): void {
		this.newKPI = {
			nombre: '',
			descripcion: '',
			roleResponsable: '',
			meta: 80,
			periodo: '',
		};
	}

	protected getRoleShort(role: string): string {
		const shorts: Record<string, string> = {
			'Líder Admin': 'Admin',
			'Director General': 'Director',
			'Asesor de Servicio': 'Asesor',
			'Líder Técnico': 'Técnico',
			'Técnico Automotriz': 'Mecánico',
			'Personal de Apoyo': 'Apoyo',
		};
		return shorts[role] || role;
	}
}
