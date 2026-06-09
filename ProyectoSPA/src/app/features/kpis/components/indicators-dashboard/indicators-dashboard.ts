import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IndicatorsService } from '../../services/indicators.service';
import { NgIconsModule } from '@ng-icons/core';

@Component({
	selector: 'app-indicators-dashboard',
	standalone: true,
	imports: [CommonModule, NgIconsModule],
	templateUrl: './indicators-dashboard.html',
	styleUrl: './indicators-dashboard.css',
})
export class IndicatorsDashboardComponent {
	private readonly _indicatorsService = inject(IndicatorsService);

	readonly indicadores = this._indicatorsService.indicadores;

	getIconName(icon: string): string {
		if (!icon) return 'lucideActivity';
		const camelCase = icon.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
		const capitalized = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
		return `lucide${capitalized}`;
	}

	getTrendIcon(tendencia: 'up' | 'down' | 'stable'): string {
		switch (tendencia) {
			case 'up':
				return 'lucideArrowUp';
			case 'down':
				return 'lucideArrowDown';
			case 'stable':
				return 'lucideMinus';
		}
	}

	getTrendClass(tendencia: 'up' | 'down' | 'stable'): string {
		switch (tendencia) {
			case 'up':
				return 'trend-up';
			case 'down':
				return 'trend-down';
			case 'stable':
				return 'trend-stable';
		}
	}

	getMetaComparison(valor: number, meta?: number): string {
		if (!meta) return '';
		const diff = valor - meta;
		const percent = Math.round((diff / meta) * 100);
		if (percent > 0) return `+${percent}%`;
		if (percent < 0) return `${percent}%`;
		return '0%';
	}
}
