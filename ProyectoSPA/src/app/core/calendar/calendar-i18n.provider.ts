import { provideBrnCalendarI18n } from '@spartan-ng/brain/calendar';

const WEEKDAYS_SHORT = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
const WEEKDAYS_LONG = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

export function provideSpanishCalendarI18n() {
	const monthNames: [string, string, string, string, string, string, string, string, string, string, string, string] = [
		'enero',
		'febrero',
		'marzo',
		'abril',
		'mayo',
		'junio',
		'julio',
		'agosto',
		'septiembre',
		'octubre',
		'noviembre',
		'diciembre',
	];

	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i);

	return provideBrnCalendarI18n({
		formatWeekdayName: (i) => WEEKDAYS_SHORT[i],
		formatMonth: (m) => monthNames[m],
		formatYear: (y) => `${y}`,
		formatHeader: (m, y) =>
			new Date(y, m, 1).toLocaleDateString('es-MX', {
				month: 'long',
				year: 'numeric',
			}),
		months: () => monthNames,
		years: () => years,
		labelPrevious: () => 'Mes anterior',
		labelNext: () => 'Mes siguiente',
		labelWeekday: (i) => WEEKDAYS_LONG[i],
		firstDayOfWeek: () => 1,
	});
}
