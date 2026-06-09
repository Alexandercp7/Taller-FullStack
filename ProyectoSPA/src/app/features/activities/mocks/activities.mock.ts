import { Activity } from '../models/activity.model';

export const ACTIVITIES_MOCK: Activity[] = [
  {
    id: 'ACT-001',
    titulo: 'Revisar presupuesto Q2',
    descripcion: 'Revisar y aprobar el presupuesto trimestral para el segundo quarter',
    asignadoA: 'Juan García',
    fechaLimite: '2026-04-15',
    prioridad: 'Alta',
    etiqueta: 'Administrativa',
    estado: 'En Progreso',
    comentarios: [
      {
        id: 'COM-001',
        usuario: 'Admin',
        texto: 'Iniciado. Esperando documentación de finanzas.',
        timestamp: '2026-04-05T08:30:00Z'
      }
    ]
  },
  {
    id: 'ACT-002',
    titulo: 'Comprar consumibles de oficina',
    descripcion: 'Adquirir papelería, tóner y supplies varios para la oficina',
    asignadoA: 'María López',
    fechaLimite: '2026-04-10',
    prioridad: 'Media',
    etiqueta: 'Compras',
    estado: 'Pendiente',
    comentarios: []
  },
  {
    id: 'ACT-003',
    titulo: 'Llamar a cliente Acme Corp',
    descripcion: 'Seguimiento de propuesta enviada hace 2 semanas. Confirmar interés.',
    asignadoA: 'Carlos Mendez',
    fechaLimite: '2026-04-06',
    prioridad: 'Alta',
    etiqueta: 'Comercial',
    estado: 'Pendiente',
    comentarios: []
  },
  {
    id: 'ACT-004',
    titulo: 'Mantenimiento preventivo de servidores',
    descripcion: 'Realizar backup y actualizaciones de seguridad en servidores principales',
    asignadoA: 'Roberto Tech',
    fechaLimite: '2026-04-12',
    prioridad: 'Alta',
    etiqueta: 'Mantenimiento',
    estado: 'Pendiente',
    comentarios: []
  },
  {
    id: 'ACT-005',
    titulo: 'Documentar nuevos procesos',
    descripcion: 'Crear documentación de los procesos de onboarding actualizados',
    asignadoA: 'Juan García',
    fechaLimite: '2026-04-20',
    prioridad: 'Media',
    etiqueta: 'Administrativa',
    estado: 'Completada',
    comentarios: [
      {
        id: 'COM-002',
        usuario: 'Juan García',
        texto: 'Documento completado y revisado. Listo para distribución.',
        timestamp: '2026-04-04T15:45:00Z'
      }
    ]
  },
  {
    id: 'ACT-006',
    titulo: 'Solicitud de soporte técnico - Cliente Beta',
    descripcion: 'Investigar y resolver problema de conectividad del cliente Beta',
    asignadoA: 'Roberto Tech',
    fechaLimite: '2026-04-07',
    prioridad: 'Alta',
    etiqueta: 'Técnica',
    estado: 'En Progreso',
    comentarios: [
      {
        id: 'COM-003',
        usuario: 'Roberto Tech',
        texto: 'Diagnosticado. Problema en router de cliente. Aguardando respuesta.',
        timestamp: '2026-04-05T10:00:00Z'
      }
    ]
  },
  {
    id: 'ACT-007',
    titulo: 'Reunión de planificación Q3',
    descripcion: 'Coordinación de objetivos y asignación de recursos para Q3',
    asignadoA: 'María López',
    fechaLimite: '2026-04-30',
    prioridad: 'Media',
    etiqueta: 'Administrativa',
    estado: 'Pendiente',
    comentarios: []
  },
  {
    id: 'ACT-008',
    titulo: 'Cancelada - Proyecto antiguo',
    descripcion: 'Esta actividad fue cancelada por cambios en prioridades',
    asignadoA: 'Carlos Mendez',
    fechaLimite: '2026-04-01',
    prioridad: 'Baja',
    etiqueta: 'Comercial',
    estado: 'Cancelada',
    comentarios: []
  }
];
