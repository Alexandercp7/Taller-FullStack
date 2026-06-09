import { ServicioAutomotriz, ServicioTorno, Servicio } from '../models/price.model';

export const SERVICIOS_AUTOMOTRIZ: ServicioAutomotriz[] = [
  { id: 1, categoriaPrincipal: 'Mecánica General', sistema: 'Eléctrico', familia: 'Bobinas', concepto: 'Cambio de bobinas', precioAuto: '$400.00', precioCamioneta: '$600.00', precioCamion: '$800.00', observacion: 'El precio será mayor si son bobinas de difícil acceso' },
  { id: 2, categoriaPrincipal: 'Mecánica General', sistema: 'Eléctrico', familia: 'Marchas', concepto: 'Desmontaje y montaje de marcha', precioAuto: '$800.00', precioCamioneta: '$1,000.00', precioCamion: '$1,200.00', observacion: '+ costo de mano de obra en caso de reparación' },
  { id: 3, categoriaPrincipal: 'Mecánica General', sistema: 'Eléctrico', familia: 'Alternador', concepto: 'Desmontaje y montaje de alternador', precioAuto: '$800.00', precioCamioneta: '$1,000.00', precioCamion: '$1,200.00', observacion: '+ costo de mano de obra en caso de reparación' },
  { id: 4, categoriaPrincipal: 'Mecánica General', sistema: 'Eléctrico', familia: 'Bandas', concepto: 'Cambio de banda de alternador', precioAuto: '$500.00', precioCamioneta: '$600.00', precioCamion: '$700.00', observacion: 'Igual que el precio de cambio de banda de accesorios' },
  
  { id: 41, categoriaPrincipal: 'Mecánica General', sistema: 'Transmisión', familia: 'Cajas', concepto: 'Desmontaje y montaje caja transmisión', precioAuto: '$2,800.00', precioCamioneta: '$3,400.00', precioCamion: '$4,000.00', observacion: '' },
  { id: 42, categoriaPrincipal: 'Mecánica General', sistema: 'Transmisión', familia: 'Diferencial', concepto: 'Cambio de diferencial', precioAuto: '$3,500.00', precioCamioneta: '$4,000.00', precioCamion: '$4,500.00', observacion: '' },
  { id: 43, categoriaPrincipal: 'Mecánica General', sistema: 'Transmisión', familia: 'Soportes', concepto: 'Cambio de 1 soporte de caja', precioAuto: '$500.00', precioCamioneta: '$600.00', precioCamion: '$700.00', observacion: '' },

  { id: 100, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Balatas', familia: '', concepto: 'Cambio de par de balatas delanteras o traseras (frenos disco)', precioAuto: '$500.00', precioCamioneta: '$600.00', precioCamion: '$700.00', observacion: 'Los frenos de disco usan pistones de presión hidráulicos' },
  { id: 101, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Balatas', familia: '', concepto: 'Cambio de par de balatas traseras (frenos tambor)', precioAuto: '$600.00', precioCamioneta: '$700.00', precioCamion: '$800.00', observacion: 'Los frenos de tambor usan cilindros de presión hidráulicos' },
  { id: 102, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Discos', familia: '', concepto: 'Cambio de disco delantero o trasero — precio por pieza', precioAuto: '$300.00', precioCamioneta: '$400.00', precioCamion: '$500.00', observacion: '' },
  { id: 103, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Tambores', familia: '', concepto: 'Cambio de tambor trasero — precio por pieza', precioAuto: '$400.00', precioCamioneta: '$500.00', precioCamion: '$600.00', observacion: '' },
  { id: 104, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Rectificación', familia: '', concepto: 'Rectificación de 1 disco o tambor (sin desmontaje)', precioAuto: '$300.00', precioCamioneta: '$350.00', precioCamion: '$400.00', observacion: 'Precio del servicio del torno (no incluye trabajo mecánico)' },
  { id: 105, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Rectificación', familia: '', concepto: 'Rectificación de 1 disco o tambor (con desmontaje)', precioAuto: '$600.00', precioCamioneta: '$700.00', precioCamion: '$800.00', observacion: 'Precio de servicio completo' },
  { id: 106, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Cilindro', familia: '', concepto: 'Cambio de cilindro de freno — precio por pieza', precioAuto: '$600.00', precioCamioneta: '$700.00', precioCamion: '$800.00', observacion: 'Solo existe en frenos de tambor' },
  { id: 107, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Pistones', familia: '', concepto: 'Revisión, engrasado o cambio de pistones y retenes (1 lado)', precioAuto: '$600.00', precioCamioneta: '$800.00', precioCamion: '$1,000.00', observacion: 'Precio x lado' },
  { id: 108, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Bombas', familia: '', concepto: 'Cambio de bomba de frenos', precioAuto: '$800.00', precioCamioneta: '$900.00', precioCamion: '$1,000.00', observacion: '+ purgado de frenos + líquido de frenos' },
  { id: 109, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Purgado', familia: '', concepto: 'Purgado de frenos', precioAuto: '$500.00', precioCamioneta: '$600.00', precioCamion: '$700.00', observacion: '' },
  { id: 110, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Limpieza', familia: '', concepto: 'Servicio de limpieza y ajuste de par de frenos disco', precioAuto: '$500.00', precioCamioneta: '$600.00', precioCamion: '$700.00', observacion: '' },
  { id: 111, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Ajuste', familia: '', concepto: 'Servicio de limpieza y ajuste de par de frenos tambor', precioAuto: '$600.00', precioCamioneta: '$700.00', precioCamion: '$800.00', observacion: '' },
  { id: 112, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Clutch', familia: '', concepto: 'Cambio de clutch', precioAuto: '$2,800.00', precioCamioneta: '$3,400.00', precioCamion: '$4,000.00', observacion: '' },

  { id: 113, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Amortiguador', familia: '', concepto: 'Cambio de base de amortiguador (con resorte)', precioAuto: '$600.00', precioCamioneta: '$700.00', precioCamion: '$800.00', observacion: '' },
  { id: 114, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Amortiguador', familia: '', concepto: 'Cambio de amortiguador (con resorte, tipo ensamblado)', precioAuto: '$600.00', precioCamioneta: '$700.00', precioCamion: '$800.00', observacion: '' },
  { id: 115, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Amortiguador', familia: '', concepto: 'Cambio de amortiguador (sin resorte — precio x pieza)', precioAuto: '$400.00', precioCamioneta: '$500.00', precioCamion: '$600.00', observacion: '' },
  { id: 116, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Bases', familia: '', concepto: 'Cambiar base + amortiguador — precio por lado', precioAuto: '$800.00', precioCamioneta: '$900.00', precioCamion: '$1,100.00', observacion: '' },

  { id: 117, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Suspensión', familia: '', concepto: 'Revisión física y diagnóstico preliminar de suspensión', precioAuto: '$200.00', precioCamioneta: '$300.00', precioCamion: '$400.00', observacion: '' },
  { id: 118, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Suspensión', familia: '', concepto: 'Cambio de brazo Pickman o codo', precioAuto: '-', precioCamioneta: '$500.00', precioCamion: '$600.00', observacion: '' },
  { id: 119, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Suspensión', familia: '', concepto: 'Cambio de brazo auxiliar', precioAuto: '-', precioCamioneta: '$400.00', precioCamion: '$500.00', observacion: '' },
  { id: 120, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Suspensión', familia: '', concepto: 'Cambio de varilla de dirección o bieleta — precio x pieza', precioAuto: '$300.00', precioCamioneta: '$400.00', precioCamion: '$500.00', observacion: 'Se recomienda servicio de alineación del eje delantero' },
  { id: 121, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Suspensión', familia: '', concepto: 'Cambio de terminal de dirección — precio por pieza', precioAuto: '$300.00', precioCamioneta: '$400.00', precioCamion: '$500.00', observacion: 'Se recomienda servicio de alineación del eje delantero' },
  { id: 122, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Suspensión', familia: '', concepto: 'Cambio de horquilla completa inferior (solo adelante)', precioAuto: '$500.00', precioCamioneta: '$600.00', precioCamion: '$700.00', observacion: '' },
  { id: 123, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Suspensión', familia: '', concepto: 'Cambio de horquilla completa superior (solo adelante)', precioAuto: '$500.00', precioCamioneta: '$600.00', precioCamion: '$700.00', observacion: '' },
  { id: 124, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Suspensión', familia: '', concepto: 'Cambio de rótula de horquilla inferior (solo suspensión delantera)', precioAuto: '$600.00', precioCamioneta: '$700.00', precioCamion: '$800.00', observacion: '' },
  { id: 125, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Suspensión', familia: '', concepto: 'Cambio de rótula de horquilla superior (solo suspensión delantera)', precioAuto: '$600.00', precioCamioneta: '$700.00', precioCamion: '$800.00', observacion: '' },
  { id: 126, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Suspensión', familia: '', concepto: 'Cambio de buje grande, buje cilindro o rótula — x pieza', precioAuto: '$100.00', precioCamioneta: '$100.00', precioCamion: '$100.00', observacion: 'Precio adicional por pieza sumado al cambio de horquilla' },
  { id: 127, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Suspensión', familia: '', concepto: 'Cambio de articulaciones o tornillos estabilizadores', precioAuto: '$400.00', precioCamioneta: '$500.00', precioCamion: '$600.00', observacion: '' },
  { id: 128, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Suspensión', familia: '', concepto: 'Cambio del par de gomas de barra estabilizadora', precioAuto: '$600.00', precioCamioneta: '$700.00', precioCamion: '$800.00', observacion: 'Puede ser mayor dependiendo del tipo de vehículo' },
  { id: 129, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Suspensión', familia: '', concepto: 'Desmontaje y cambio de bujes de puente delantero', precioAuto: '-', precioCamioneta: '$2,500.00', precioCamion: '$3,000.00', observacion: 'Aplica a Nissan Xtrail 2017 y similares (puente grande 4 bujes)' },
  { id: 130, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Suspensión', familia: '', concepto: 'Cambio de buje de eje trasero', precioAuto: '$1,800.00', precioCamioneta: '$2,200.00', precioCamion: '$2,400.00', observacion: '' },

  { id: 131, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Dirección', familia: '', concepto: 'Cambio de caja de dirección', precioAuto: '$1,000.00', precioCamioneta: '$1,200.00', precioCamion: '$1,400.00', observacion: 'Se recomienda alineación del eje delantero' },
  { id: 132, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Dirección', familia: '', concepto: 'Cambio de gomas de caja de dirección o cremallera', precioAuto: '$800.00', precioCamioneta: '$1,000.00', precioCamion: '$1,200.00', observacion: 'Puede ser mayor dependiendo del tipo de cremallera o vehículo' },
  { id: 133, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Dirección', familia: '', concepto: 'Servicio de alineación manual del eje delantero', precioAuto: '$400.00', precioCamioneta: '$450.00', precioCamion: '$500.00', observacion: '' },

  { id: 134, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Ruedas', familia: '', concepto: 'Cambio de maza completa', precioAuto: '$500.00', precioCamioneta: '$600.00', precioCamion: '$700.00', observacion: '' },
  { id: 135, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Ruedas', familia: '', concepto: 'Cambio de balero homocinético', precioAuto: '$600.00', precioCamioneta: '$700.00', precioCamion: '$800.00', observacion: 'El costo puede ser mayor si el vehículo requiere trabajo más especializado' },
  { id: 136, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Ruedas', familia: '', concepto: 'Cambio de balero doble delantero o trasero', precioAuto: '$700.00', precioCamioneta: '$800.00', precioCamion: '$900.00', observacion: 'Este tipo de balero requiere ser retirado con prensa' },
  { id: 137, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Ruedas', familia: '', concepto: 'Cambio de balero cónico delantero o trasero', precioAuto: '$600.00', precioCamioneta: '$900.00', precioCamion: '$1,200.00', observacion: '' },
  { id: 138, categoriaPrincipal: 'Mecánica Rápida', sistema: 'Ruedas', familia: '', concepto: 'Engrasado de una flecha y sus 2 baleros homocinéticos', precioAuto: '$800.00', precioCamioneta: '$900.00', precioCamion: '$1,000.00', observacion: 'El costo puede ser mayor si el vehículo requiere trabajo más especializado' },

  { id: 200, categoriaPrincipal: 'Afinación y Otros', sistema: 'Rescates', familia: 'Rescates', concepto: 'Salida a sitio alrededor de 2 cuadras del taller', precioAuto: '$200.00', precioCamioneta: '$200.00', precioCamion: '$200.00', observacion: 'No incluye arrastre' },
  { id: 201, categoriaPrincipal: 'Afinación y Otros', sistema: 'Rescates', familia: 'Rescates', concepto: 'Salida a sitio dentro de colonia Colosio', precioAuto: '$400.00', precioCamioneta: '$400.00', precioCamion: '$400.00', observacion: 'No incluye arrastre' },
  { id: 202, categoriaPrincipal: 'Afinación y Otros', sistema: 'Rescates', familia: 'Rescates', concepto: 'Salida a sitio dentro de zona urbana', precioAuto: '$600.00', precioCamioneta: '$600.00', precioCamion: '$600.00', observacion: 'No incluye arrastre' },

  { id: 203, categoriaPrincipal: 'Afinación y Otros', sistema: 'Afinaciones', familia: 'Motor', concepto: 'Afinación menor (cambio de aceite de motor y filtro)', precioAuto: '$300.00', precioCamioneta: '$350.00', precioCamion: '$400.00', observacion: '' },
  { id: 204, categoriaPrincipal: 'Afinación y Otros', sistema: 'Afinaciones', familia: 'Motor', concepto: 'Cambio de bujías', precioAuto: '4 Cil. $400', precioCamioneta: '6 Cil. $600', precioCamion: '8 Cil. $800', observacion: 'El precio será mayor si son bujías de difícil acceso' },
  { id: 205, categoriaPrincipal: 'Afinación y Otros', sistema: 'Afinaciones', familia: 'Motor', concepto: 'Afinación mayor (cambio de aceite, filtros y bujías)', precioAuto: '4 Cil. $800', precioCamioneta: '6 Cil. $1,000', precioCamion: '8 Cil. $1,200', observacion: 'El precio será mayor si son bujías de difícil acceso' },
  { id: 206, categoriaPrincipal: 'Afinación y Otros', sistema: 'Afinaciones', familia: 'Cajas', concepto: 'Cambio de aceite de caja estándar', precioAuto: '$500.00', precioCamioneta: '$600.00', precioCamion: '$700.00', observacion: '' },
  { id: 207, categoriaPrincipal: 'Afinación y Otros', sistema: 'Afinaciones', familia: 'Cajas', concepto: 'Cambio de aceite de diferencial', precioAuto: '$500.00', precioCamioneta: '$600.00', precioCamion: '$700.00', observacion: '' },
  { id: 208, categoriaPrincipal: 'Afinación y Otros', sistema: 'Afinaciones', familia: 'Cajas', concepto: 'Cambio de aceite de caja automática', precioAuto: '$900.00', precioCamioneta: '$1,100.00', precioCamion: '$1,300.00', observacion: '' },

  { id: 209, categoriaPrincipal: 'Afinación y Otros', sistema: 'Diagnósticos', familia: 'Diagnóstico', concepto: 'Diagnóstico con escáner Nivel 1 (solo lectura o borrado)', precioAuto: '$200.00', precioCamioneta: '$200.00', precioCamion: '$200.00', observacion: '' },
  { id: 210, categoriaPrincipal: 'Afinación y Otros', sistema: 'Diagnósticos', familia: 'Diagnóstico', concepto: 'Diagnóstico con escáner Nivel 2 (diagnóstico preliminar)', precioAuto: '$500.00', precioCamioneta: '$600.00', precioCamion: '$800.00', observacion: 'Opinión técnica preliminar sobre códigos de falla' },
  { id: 211, categoriaPrincipal: 'Afinación y Otros', sistema: 'Diagnósticos', familia: 'Diagnóstico', concepto: 'Diagnóstico con escáner Nivel 3 (lectura de datos en tiempo real)', precioAuto: '$800.00', precioCamioneta: '$900.00', precioCamion: '$1,000.00', observacion: '+ costo de revisión con pruebas físicas y/o herramientas especiales' },
];

export const SERVICIOS_TORNO: ServicioTorno[] = [
  { id: 300, categoriaPrincipal: 'Servicio de Torno', tamano: 'Pequeño', diametro: 'Hasta 50mm', precio: '$180.00' },
  { id: 301, categoriaPrincipal: 'Servicio de Torno', tamano: 'Mediano', diametro: 'Hasta 100mm', precio: '$350.00' },
  { id: 302, categoriaPrincipal: 'Servicio de Torno', tamano: 'Grande', diametro: 'Hasta 200mm', precio: '$600.00' },
  { id: 303, categoriaPrincipal: 'Servicio de Torno', tamano: 'Muy Grande', diametro: 'Más de 200mm', precio: '$1,000.00' },
];

export const TODOS_SERVICIOS: Servicio[] = [...SERVICIOS_AUTOMOTRIZ, ...SERVICIOS_TORNO];

export function getServicios(categoria?: string): Servicio[] {
  if (!categoria || categoria === 'Todas') return TODOS_SERVICIOS;
  return TODOS_SERVICIOS.filter(s => s.categoriaPrincipal === categoria);
}

export function getSistemas(categoria: string): string[] {
  const servicios = getServicios(categoria).filter(s => 'sistema' in s) as ServicioAutomotriz[];
  return Array.from(new Set(servicios.map(s => s.sistema))).sort();
}

export function getFamilias(categoria: string, sistema?: string): string[] {
  let servicios = getServicios(categoria).filter(s => 'sistema' in s) as ServicioAutomotriz[];
  if (sistema) servicios = servicios.filter(s => s.sistema === sistema);
  return Array.from(new Set(servicios.map(s => s.familia).filter(f => f))).sort();
}
