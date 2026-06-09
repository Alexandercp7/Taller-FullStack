import { Payment } from '../models/payment.model';

export const PAYMENTS_MOCK: Payment[] = [
  {
    id: '1',
    concepto: 'Renta oficina',
    tipo: 'Periódico',
    categoria: 'Renta',
    fechaVencimiento: '2026-04-10',
    estado: 'Pendiente',
    montoPresupuestado: 15000,
    montoPagado: 0,
    comprobanteUrl: '',
    notas: 'Pago mensual de renta.'
  },
  {
    id: '2',
    concepto: 'Pago de luz',
    tipo: 'Periódico',
    categoria: 'Servicios',
    fechaVencimiento: '2026-04-12',
    estado: 'Pendiente',
    montoPresupuestado: 1200,
    montoPagado: 0,
    comprobanteUrl: '',
    notas: 'CFE, ciclo abril.'
  },
  {
    id: '3',
    concepto: 'Compra de insumos',
    tipo: 'No Periódico',
    categoria: 'Proveedores',
    fechaVencimiento: '2026-04-07',
    estado: 'Vencido',
    montoPresupuestado: 3500,
    montoPagado: 0,
    comprobanteUrl: '',
    notas: 'Compra extraordinaria.'
  },
  {
    id: '4',
    concepto: 'Nómina quincenal',
    tipo: 'Periódico',
    categoria: 'Nómina',
    fechaVencimiento: '2026-04-15',
    estado: 'Pendiente',
    montoPresupuestado: 25000,
    montoPagado: 0,
    comprobanteUrl: '',
    notas: 'Pago a empleados.'
  }
];
