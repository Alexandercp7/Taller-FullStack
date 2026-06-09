import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCalendarImports } from '@spartan-ng/helm/calendar';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';

@Component({
	selector: 'spartan-date-picker-field',
	imports: [CommonModule, HlmButtonImports, HlmPopoverImports, HlmCalendarImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './date-picker-field.html',
	styleUrl: './date-picker-field.css',
})
export class DatePickerFieldComponent {
	public readonly value = input<string>('');
	public readonly placeholder = input<string>('Seleccionar fecha');
	public readonly allowClear = input<boolean>(true);
	public readonly valueChange = output<string>();

	protected readonly popoverState = signal<'open' | 'closed' | null>(null);
	protected readonly selectedDate = signal<Date | undefined>(undefined);

	constructor() {
		effect(() => {
			this.selectedDate.set(this.parseIsoDate(this.value()));
		});
	}

	protected displayValue(): string {
		const date = this.selectedDate();
		if (!date) {
			return this.placeholder();
		}
		return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
	}

	protected onDateChange(value: unknown): void {
		const date = this.toDate(value);
		if (!date) {
			return;
		}
		this.selectedDate.set(date);
		this.valueChange.emit(this.toIsoDate(date));
		this.popoverState.set('closed');
	}

	protected clearDate(event: Event): void {
		event.stopPropagation();
		this.selectedDate.set(undefined);
		this.valueChange.emit('');
	}

	private parseIsoDate(value: string): Date | undefined {
		const trimmed = value.trim();
		if (!trimmed) {
			return undefined;
		}
		const [year, month, day] = trimmed.split('-').map(Number);
		if (!year || !month || !day) {
			return undefined;
		}
		return new Date(year, month - 1, day);
	}

	private toIsoDate(date: Date): string {
		const year = date.getFullYear();
		const month = `${date.getMonth() + 1}`.padStart(2, '0');
		const day = `${date.getDate()}`.padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	private toDate(value: unknown): Date | undefined {
		if (value instanceof Date) {
			return value;
		}
		return undefined;
	}
}
