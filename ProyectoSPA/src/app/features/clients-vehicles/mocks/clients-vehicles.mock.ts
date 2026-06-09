import type { ClientProfileMock } from '../models';

export const clientProfilesMock: ClientProfileMock[] = [
	{
		nombre: 'Clinica Distrito Norte',
		rfc: 'CDN040201AB1',
		telefono: '555-0101',
		correo: 'mantenimiento@clinica-norte.mx',
		paymentByOtId: {
			'WO-1042': 'Pendiente',
		},
	},
	{
		nombre: 'Almacen Central',
		rfc: 'ACE010101LM3',
		telefono: '555-0102',
		correo: 'logistica@almacen-central.mx',
		paymentByOtId: {
			'WO-1041': 'Pagado',
		},
	},
	{
		nombre: 'Anexo de Palacio Municipal',
		rfc: 'APM920515QW7',
		telefono: '555-0103',
		correo: 'servicios@palacio-municipal.mx',
		paymentByOtId: {
			'WO-1038': 'Pagado',
		},
	},
];
