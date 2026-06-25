import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Container } from '../../infrastructure/di/container';
import { Argon2HasherAdapter } from '../../infrastructure/external/argon2-hasher.adapter';
import { S3FileStorageAdapter } from '../../infrastructure/external/s3-file-storage.adapter';
import { createId } from '../../shared/identifier';

// ─── Enum maps ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, string> = {
  SCHEDULED: 'Agendado', ON_HOLD: 'En Espera', IN_PROGRESS: 'En Proceso',
  COMPLETED: 'Terminado', WARRANTY: 'En Garantia', DELAYED: 'Rezagado',
  DELIVERED: 'Entregado', ARCHIVED: 'Archivado',
};
const STATUS_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_MAP).map(([k, v]) => [v, k]),
);

function toDbStatus(spanishStatus: string): string {
  const direct = STATUS_REVERSE[spanishStatus];
  if (direct) return direct;
  const lower = spanishStatus.toLowerCase();
  const key = Object.keys(STATUS_MAP).find(k => STATUS_MAP[k].toLowerCase() === lower);
  return key ?? spanishStatus;
}

const PRIORITY_MAP: Record<string, string> = { HIGH: 'Alta', MEDIUM: 'Media', LOW: 'Baja' };
const PRIORITY_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(PRIORITY_MAP).map(([k, v]) => [v, k]),
);

const VEHICLE_TYPE_MAP: Record<string, string> = { CAR: 'Auto', TRUCK: 'Camioneta', HEAVY_TRUCK: 'Camion' };
const VEHICLE_TYPE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(VEHICLE_TYPE_MAP).map(([k, v]) => [v, k]),
);

const CLIENT_TAG_MAP: Record<string, string> = { NEW: 'Nuevo', FREQUENT: 'Frecuente', WITH_DEBT: 'Con deuda' };
const CLIENT_TAG_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(CLIENT_TAG_MAP).map(([k, v]) => [v, k]),
);

const PAYMENT_METHOD_MAP: Record<string, string> = { CASH: 'Efectivo', TRANSFER: 'Transferencia', CARD: 'Tarjeta' };
const PAYMENT_METHOD_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(PAYMENT_METHOD_MAP).map(([k, v]) => [v, k]),
);

const KPI_ROLE_FALLBACK: Record<string, string> = {
  ADMIN: 'Líder Admin',
  MANAGER: 'Director General',
  RECEPTIONIST: 'Asesor de Servicio',
  TECHNICIAN: 'Técnico Automotriz',
};

const PAYMENT_STATUS_MAP: Record<string, string> = {
  PENDING: 'Pendiente', PARTIAL: 'Parcial', PAID: 'Pagado', OVERDUE: 'Vencido',
};

const CASH_TYPE_MAP: Record<string, string> = { INCOME: 'Ingreso', EXPENSE: 'Egreso' };
const CASH_TYPE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(CASH_TYPE_MAP).map(([k, v]) => [v, k]),
);

const INVENTORY_TYPE_MAP: Record<string, string> = {
  TOOL: 'Herramienta', CONSUMABLE: 'Consumible', EQUIPMENT: 'Equipo', SALE_PART: 'Parte en venta',
};
const INVENTORY_TYPE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(INVENTORY_TYPE_MAP).map(([k, v]) => [v, k]),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuthUser(req: FastifyRequest, container: Container) {
  try {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) return null;
    const payload = container.tokenProvider.verify(h.slice(7));
    return { id: payload.sub as string, role: payload.role as string };
  } catch {
    return null;
  }
}

function toDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().split('T')[0];
}

function mapOrderList(o: any) {
  return {
    id: o.id,
    code: o.code,
    status: STATUS_MAP[o.status] ?? o.status,
    priority: PRIORITY_MAP[o.priority] ?? o.priority,
    tipo_vehiculo: o.vehicle ? (VEHICLE_TYPE_MAP[o.vehicle.type] ?? 'Auto') : 'Auto',
    problema: o.problem ?? '',
    diagnostico: o.diagnostico ?? '',
    fecha_ingreso: toDate(o.createdAt),
    fecha_programada: toDate(o.scheduledAt),
    cargo_generado: !!o.accountReceivable,
    cliente: o.client
      ? { id: o.client.id, nombre: o.client.name, telefono: o.client.phone, correo: o.client.email ?? '' }
      : null,
    vehiculo: o.vehicle
      ? { id: o.vehicle.id, marca: o.vehicle.brand, modelo: o.vehicle.model, anio: o.vehicle.year, placas: o.vehicle.plates, vin: o.vehicle.vin ?? '', kilometraje: o.vehicle.mileage ?? 0 }
      : null,
    tecnico: o.technician ? { id: o.technician.id, name: o.technician.name } : null,
  };
}

function mapPortalTimelineEntry(t: any) {
  if (t.event === 'status_changed') {
    const newStatus = STATUS_MAP[t.detail?.newStatus] ?? t.detail?.newStatus ?? 'Actualizado';
    return {
      id: t.id,
      descripcion: `Estatus actualizado a ${newStatus}`,
      evento: t.event,
      detalle: t.detail ?? null,
      created_at: t.createdAt?.toISOString(),
      user: t.user ? { name: t.user.name } : undefined,
    };
  }

  if (t.event === 'note_added' && t.detail?.visibility === 'CLIENT') {
    return {
      id: t.id,
      descripcion: 'Se agrego una nota para el cliente',
      evento: t.event,
      detalle: t.detail ?? null,
      created_at: t.createdAt?.toISOString(),
      user: t.user ? { name: t.user.name } : undefined,
    };
  }

  return null;
}

function mapAdminTimelineEntry(t: any) {
  return {
    id: t.id,
    descripcion: t.description ?? '',
    evento: t.event,
    detalle: t.detail ?? null,
    created_at: t.createdAt?.toISOString(),
    user: t.user ? { name: t.user.name } : undefined,
  };
}

async function mapOrderDetail(o: any, checklistUserMap: Record<string, string> = {}) {
  const base = mapOrderList(o);
  const storage = new S3FileStorageAdapter();
  const fotos = await Promise.all((o.photos ?? []).map(async (f: any) => ({
    id: f.id,
    url: f.key ? await storage.getDownloadUrl(f.key) : f.url,
  })));
  const servicios = (o.quotes ?? []).map((q: any) => ({
    id: q.id, price_item_id: q.serviceId ?? q.id, nombre: q.service?.name ?? 'Servicio', precio: Number(q.total),
  }));
  const partes = (o.assignedParts ?? []).map((p: any) => ({
    id: p.id, inventory_item_id: p.itemId, nombre: p.item?.name ?? '', cantidad: p.quantity,
    costo_unitario: Number(p.unitPrice),
  }));
  const checklistItems = (o.checklist ?? []).map((c: any) => ({
    id: c.id,
    tipo: c.phase ?? 'inicial',
    tarea: c.label,
    responsable: [c.responsable?.name, ...((c.responsableIds ?? []).map((id: string) => checklistUserMap[id]).filter(Boolean))]
      .filter((value: string, index: number, array: string[]) => !!value && array.indexOf(value) === index)
      .join(', '),
    responsables: [c.responsable?.name, ...((c.responsableIds ?? []).map((id: string) => checklistUserMap[id]).filter(Boolean))]
      .filter((value: string, index: number, array: string[]) => !!value && array.indexOf(value) === index),
    responsableId: c.responsableId ?? null,
    responsableIds: (c.responsableIds ?? []).length > 0
      ? c.responsableIds
      : (c.responsableId ? [c.responsableId] : []),
    completada: c.checked,
  }));
  const totalServicios = servicios.reduce((sum: number, s: any) => sum + Number(s.precio || 0), 0);
  const totalPartes = partes.reduce((sum: number, p: any) => sum + Number(p.costo_unitario || 0) * Number(p.cantidad || 0), 0);

  return {
    ...base,
    checklist: {
      total: checklistItems.length,
      completadas: checklistItems.filter((item: any) => item.completada).length,
    },
    checklists: checklistItems,
    fotos,
    notas: (o.notes ?? []).map((n: any) => ({
      id: n.id, tipo: n.visibility === 'CLIENT' ? 'cliente' : 'interna', texto: n.content, created_at: n.createdAt?.toISOString(),
      user: n.user ? { name: n.user.name } : undefined,
    })),
    partes,
    refacciones: partes.map((p: any) => ({
      nombre: p.nombre,
      cantidad: p.cantidad,
      subtotal: Number(p.costo_unitario || 0) * Number(p.cantidad || 0),
    })),
    servicios,
    total_estimado: totalServicios + totalPartes,
    timeline: (o.timeline ?? []).map((t: any) => mapAdminTimelineEntry(t)),
  };
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export async function registerRestApi(app: FastifyInstance, container: Container) {
  const db = container.prisma;

  const buildChecklistUserMap = async (checklist: any[] = []) => {
    const ids = [...new Set(
      checklist.flatMap((item: any) => [
        item.responsableId,
        ...((item.responsableIds ?? []) as string[]),
      ]).filter(Boolean),
    )] as string[];

    if (ids.length === 0) {
      return {} as Record<string, string>;
    }

    const users = await db.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });

    return Object.fromEntries(users.map((user: any) => [user.id, user.name])) as Record<string, string>;
  };

  // ── AUTH ──────────────────────────────────────────────────────────────────

  app.post('/api/v1/auth/login', async (req, reply) => {
    try {
      const { email, password } = req.body as any;
      const result = await container.useCases.login.execute({ email, password });
      return {
        data: {
          token: result.accessToken,
          user: {
            id: result.user.id, name: result.user.name, email: result.user.email,
            roles: [result.user.role], permissions: result.user.permissions,
          },
        },
      };
    } catch (err: any) {
      return reply.status(401).send({ error: err.message });
    }
  });

  app.get('/api/v1/auth/me', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const dbUser = await db.user.findUnique({ where: { id: u.id } });
    if (!dbUser) return reply.status(401).send({ error: 'Usuario no encontrado' });
    return { data: { id: dbUser.id, name: dbUser.name, email: dbUser.email, roles: [dbUser.role], permissions: dbUser.permissions } };
  });

  app.put('/api/v1/auth/me', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const dbUser = await db.user.update({
      where: { id: u.id },
      data: { name: body.name, email: body.email },
    });
    return { data: { id: dbUser.id, name: dbUser.name, email: dbUser.email, roles: [dbUser.role], permissions: dbUser.permissions } };
  });

  app.post('/api/v1/auth/logout', async () => ({ message: 'ok' }));

  app.get('/api/v1/dashboard/shortcuts', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const shortcuts = await (db as any).dashboardShortcut.findMany({
      where: { userId: u.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return {
      data: shortcuts.map((shortcut: any) => ({
        id: shortcut.id,
        shortcutId: shortcut.shortcutId,
        sortOrder: shortcut.sortOrder,
      })),
    };
  });

  app.put('/api/v1/dashboard/shortcuts', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const shortcutIds = Array.isArray(body.shortcuts)
      ? body.shortcuts.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
      : [];
    const normalized = [...new Set(shortcutIds)].map((shortcutId, sortOrder) => ({
      userId: u.id,
      shortcutId,
      sortOrder,
    }));

    await (db as any).$transaction([
      (db as any).dashboardShortcut.deleteMany({ where: { userId: u.id } }),
      ...(normalized.length > 0 ? [(db as any).dashboardShortcut.createMany({ data: normalized })] : []),
    ]);

    const saved = await (db as any).dashboardShortcut.findMany({
      where: { userId: u.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return {
      data: saved.map((shortcut: any) => ({
        id: shortcut.id,
        shortcutId: shortcut.shortcutId,
        sortOrder: shortcut.sortOrder,
      })),
    };
  });

  // ── WORK ORDERS ───────────────────────────────────────────────────────────

  app.get('/api/v1/work-orders', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const perPage = Math.min(Number((req.query as any).per_page ?? 50), 200);
    const orders = await db.workOrder.findMany({
      include: { client: true, vehicle: true, technician: true, accountReceivable: true },
      orderBy: { scheduledAt: 'desc' },
      take: perPage,
    });
    return { data: orders.map(mapOrderList) };
  });

  app.get('/api/v1/work-orders/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const o = await db.workOrder.findUnique({
      where: { id },
      include: {
        client: true, vehicle: true, technician: true, accountReceivable: true,
        checklist: { include: { responsable: { select: { name: true } } } },
        photos: true,
        notes: { include: { user: { select: { name: true } } } },
        assignedParts: { include: { item: true } },
        quotes: { include: { service: true } },
        timeline: { include: { user: { select: { name: true } } } },
      },
    });
    if (!o) return reply.status(404).send({ error: 'Orden no encontrada' });
    return { data: await mapOrderDetail(o, await buildChecklistUserMap(o.checklist)) };
  });

  app.post('/api/v1/work-orders', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;

    // Find or create client
    const clientName = body.cliente_nombre ?? 'Sin nombre';
    let client = body.cliente_telefono
      ? await db.client.findFirst({ where: { phone: body.cliente_telefono } })
      : await db.client.findFirst({ where: { name: clientName } });
    if (!client) {
      client = await db.client.create({
        data: {
          name: clientName,
          phone: body.cliente_telefono || `TEMP-${Date.now()}`,
          email: body.cliente_correo || null,
          tag: 'NEW',
        },
      });
    }

    // Find or create vehicle
    const plates = body.vehiculo_placas || `TEMP-${Date.now()}`;
    let vehicle = await db.vehicle.findFirst({ where: { plates } });
    if (!vehicle) {
      vehicle = await db.vehicle.create({
        data: {
          clientId: client.id,
          brand: body.vehiculo_marca ?? 'Pendiente',
          model: body.vehiculo_modelo ?? 'Pendiente',
          year: Number(body.vehiculo_anio ?? 2024),
          plates,
          vin: body.vehiculo_vin || null,
          mileage: Number(body.vehiculo_kilometraje ?? 0),
          type: VEHICLE_TYPE_REVERSE[body.tipo_vehiculo] as any ?? 'CAR',
        },
      });
    } else if (vehicle.clientId !== client.id) {
      // Plates already exist under a different client (e.g. ownership transfer).
      // Reassign the vehicle to the current client so the use case validation passes.
      vehicle = await db.vehicle.update({
        where: { id: vehicle.id },
        data: { clientId: client.id },
      });
    }

    const priority = (PRIORITY_REVERSE[body.priority] ?? 'MEDIUM') as any;
    const technicianId = body.tecnico_id && body.tecnico_id !== u.id
      ? body.tecnico_id
      : u.id;
    let orderId: string;
    try {
      const result = await container.useCases.createOrder.execute({
        clientId: client.id,
        vehicleId: vehicle.id,
        technicianId,
        createdById: u.id,
        problem: body.problema ?? 'Sin descripción',
        priority,
        scheduledAt: body.fecha_programada ? new Date(body.fecha_programada) : new Date(),
        mileageIn: Number(body.vehiculo_kilometraje ?? 0) || undefined,
      });
      orderId = result.id;
      if (body.diagnostico) {
        await db.workOrder.update({ where: { id: orderId }, data: { diagnostico: body.diagnostico } });
      }
    } catch (err: any) {
      // If the transaction committed but the post-commit event dispatch failed,
      // recover the order that was just created (within the last 10 seconds).
      const tenSecondsAgo = new Date(Date.now() - 10_000);
      const recent = await db.workOrder.findFirst({
        where: { clientId: client.id, vehicleId: vehicle.id, createdAt: { gte: tenSecondsAgo } },
        orderBy: { createdAt: 'desc' },
      });
      if (!recent) return reply.status(500).send({ error: err.message ?? 'Error al crear la orden de trabajo' });
      orderId = recent.id;
    }

    const order = await db.workOrder.findUnique({
      where: { id: orderId },
      include: {
        client: true, vehicle: true, technician: true, accountReceivable: true,
        checklist: { include: { responsable: { select: { name: true } } } }, photos: true, notes: { include: { user: { select: { name: true } } } }, assignedParts: { include: { item: true } },
        quotes: { include: { service: true } }, timeline: { include: { user: { select: { name: true } } } },
      },
    });
    return { data: await mapOrderDetail(order, await buildChecklistUserMap(order?.checklist ?? [])) };
  });

  app.delete('/api/v1/work-orders/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    await container.useCases.deleteOrder.execute(id);
    return { message: 'Eliminado' };
  });

  app.patch('/api/v1/work-orders/:id/status', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const dbStatus = toDbStatus(body.status) as any;
    try {
      await container.useCases.changeOrderStatus.execute({ orderId: id, newStatus: dbStatus, userId: u.id });
    } catch {
      await db.workOrder.update({ where: { id }, data: { status: dbStatus } });
      await db.timelineEntry.create({
        data: { orderId: id, userId: u.id, event: 'status_changed', detail: { newStatus: dbStatus } },
      });
    }

    if (dbStatus === 'COMPLETED' || dbStatus === 'DELIVERED') {
      const order = await db.workOrder.findUnique({
        where: { id },
        include: { quotes: true, assignedParts: true, accountReceivable: true },
      });
      if (order) {
        const subtotalDB = order.quotes.reduce((sum, q) => sum + Number(q.total), 0)
          + order.assignedParts.reduce((sum, p) => sum + Number(p.unitPrice) * p.quantity, 0);

        // Si el frontend envía el total calculado (con descuento + IVA), se usa ese valor
        const cotizacionTotal = body.cotizacion_total !== undefined && Number(body.cotizacion_total) > 0
          ? Number(body.cotizacion_total)
          : subtotalDB;

        let ar = order.accountReceivable;
        if (!ar) {
          ar = await db.accountReceivable.create({
            data: { orderId: id, clientId: order.clientId, total: cotizacionTotal, paid: 0, balance: cotizacionTotal, status: 'PENDING' },
          });

          // Guardar desglose en timeline para trazabilidad de ganancias
          const tieneDesglose = body.cotizacion_total !== undefined;
          if (tieneDesglose) {
            await db.timelineEntry.create({
              data: {
                orderId: id, userId: u.id, event: 'quote_summary',
                detail: {
                  subtotal: Number(body.cotizacion_subtotal ?? subtotalDB),
                  descuento: Number(body.cotizacion_descuento ?? 0),
                  iva: Number(body.cotizacion_iva ?? 0),
                  total: cotizacionTotal,
                },
              },
            });
          }
        }

        if (dbStatus === 'DELIVERED' && Number(ar.balance) > 0) {
          const newPaid = Number(ar.total);
          await db.accountReceivable.update({
            where: { id: ar.id },
            data: { paid: newPaid, balance: 0, status: 'PAID' },
          });
          await db.payment.create({
            data: { accountReceivableId: ar.id, amount: Number(ar.balance), method: 'CASH', userId: u.id, notes: 'Pago automatico al entregar la orden' },
          });
          await db.timelineEntry.create({
            data: { orderId: id, userId: u.id, event: 'payment_registered', detail: { amount: Number(ar.balance), automatic: true } },
          });
        }
      }
    }

    return { message: 'ok' };
  });

  app.patch('/api/v1/work-orders/:id/client', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const order = await db.workOrder.findUnique({ where: { id } });
    if (!order) return reply.status(404).send({ error: 'Orden no encontrada' });
    await db.client.update({
      where: { id: order.clientId },
      data: { name: body.nombre, phone: body.telefono || undefined, email: body.correo || null },
    });
    return { message: 'ok' };
  });

  app.patch('/api/v1/work-orders/:id/vehicle', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const order = await db.workOrder.findUnique({ where: { id } });
    if (!order) return reply.status(404).send({ error: 'Orden no encontrada' });
    await db.vehicle.update({
      where: { id: order.vehicleId },
      data: {
        plates: body.placas || undefined,
        vin: body.vin || null,
        brand: body.marca || undefined,
        model: body.modelo || undefined,
        year: body.anio ? Number(body.anio) : undefined,
        mileage: body.kilometraje_actual ? Number(body.kilometraje_actual) : undefined,
      },
    });
    return { message: 'ok' };
  });

  app.patch('/api/v1/work-orders/:id/diagnosis', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    await db.workOrder.update({
      where: { id },
      data: { problem: body.problema || undefined, diagnostico: body.diagnostico ?? null },
    });
    return { message: 'ok' };
  });

  app.patch('/api/v1/work-orders/:id/scheduled-date', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    if (!body.fecha_programada) return reply.status(400).send({ error: 'fecha_programada requerida' });
    await db.workOrder.update({ where: { id }, data: { scheduledAt: new Date(body.fecha_programada) } });
    return { message: 'ok' };
  });

  app.patch('/api/v1/work-orders/:id/priority', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const dbPriority = (PRIORITY_REVERSE[body.priority] ?? body.priority) as any;
    await db.workOrder.update({ where: { id }, data: { priority: dbPriority } });
    return { message: 'ok' };
  });

  app.patch('/api/v1/work-orders/:id/technician', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const tech = await db.user.findUnique({ where: { id: body.technicianId } });
    if (!tech) return reply.status(404).send({ error: 'Tecnico no encontrado' });
    await db.workOrder.update({ where: { id }, data: { technicianId: body.technicianId } });
    return { data: { tecnico: tech.name } };
  });

  app.post('/api/v1/work-orders/:id/notes', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const visibility = body.tipo === 'cliente' ? 'CLIENT' : 'INTERNAL';
    const note = await db.note.create({
      data: { orderId: id, content: body.texto, userId: u.id, visibility },
    });
    await db.timelineEntry.create({
      data: { orderId: id, userId: u.id, event: 'note_added', detail: { visibility, preview: String(body.texto ?? '').slice(0, 140) } },
    });
    return { data: { id: note.id, tipo: body.tipo ?? 'interna', texto: note.content, created_at: note.createdAt.toISOString() } };
  });

  app.post('/api/v1/work-orders/:id/photos', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const order = await db.workOrder.findUnique({ where: { id } });
    if (!order) return reply.status(404).send({ error: 'Orden no encontrada' });

    const data = await req.file();
    if (!data) return reply.status(400).send({ error: 'No se recibió archivo' });

    const buffer = await data.toBuffer();
    const ext = data.filename.split('.').pop() ?? 'jpg';
    const key = `photos/${id}/${createId()}.${ext}`;

    const storage = new S3FileStorageAdapter();
    const uploadUrl = await storage.getUploadUrl(key, data.mimetype);

    await fetch(uploadUrl, {
      method: 'PUT',
      body: buffer,
      headers: { 'Content-Type': data.mimetype },
    });

    const photo = await db.photo.create({
      data: {
        orderId: id,
        phase: 'INTAKE',
        url: key,
        key,
        uploadedBy: u.id,
      },
    });

    await db.timelineEntry.create({
      data: { orderId: id, userId: u.id, event: 'photo_added', detail: { photoId: photo.id } },
    });

    const url = await storage.getDownloadUrl(key);
    return { data: { id: photo.id, url } };
  });

  app.post('/api/v1/work-orders/:id/portal-token', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const order = await db.workOrder.findUnique({ where: { id } });
    if (!order) return reply.status(404).send({ error: 'Orden no encontrada' });
    return { data: { portal_token: order.portalToken } };
  });

  app.post('/api/v1/work-orders/:id/portal-share', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    return { message: 'Compartido' };
  });

  app.post('/api/v1/work-orders/:id/whatsapp', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    return { message: 'WhatsApp enviado' };
  });

  app.post('/api/v1/work-orders/:id/services', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const priceItem = await db.priceList.findUnique({ where: { id: String(body.price_item_id) } });
    const precio = body.precio !== undefined && body.precio !== null
      ? Number(body.precio)
      : Number(priceItem?.price ?? 0);
    const q = await db.quote.create({
      data: {
        orderId: id,
        serviceId: String(body.price_item_id),
        subtotal: precio,
        tax: 0,
        total: precio,
      },
    });
    return { data: { id: q.id, price_item_id: q.serviceId, nombre: priceItem?.name ?? 'Servicio', precio: Number(q.total) } };
  });

  app.post('/api/v1/work-orders/:id/parts', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const item = await db.inventoryItem.findUnique({ where: { id: String(body.inventory_item_id) } });
    const part = await db.assignedPart.create({
      data: {
        orderId: id,
        itemId: String(body.inventory_item_id),
        quantity: Number(body.cantidad ?? 1),
        unitPrice: item?.salePrice ?? 0,
      },
    });
    return { data: { id: part.id, inventory_item_id: part.itemId, nombre: item?.name ?? '', cantidad: part.quantity, costo_unitario: Number(part.unitPrice) } };
  });

  app.post('/api/v1/work-orders/:id/checklist', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const responsableIds = [...new Set(Array.isArray(body.responsableIds) ? body.responsableIds.filter(Boolean) : (body.responsableId ? [body.responsableId] : []))] as string[];
    const item = await db.checklist.create({
      data: {
        orderId: id,
        label: body.tarea,
        checked: false,
        phase: body.tipo ?? 'inicial',
        responsableId: (responsableIds[0] as string | undefined) ?? null,
        responsableIds: responsableIds as any,
      },
      include: { responsable: { select: { name: true } } },
    }) as any;
    const checklistUserMap = await buildChecklistUserMap([item as any]);
    const responsables = [item.responsable?.name, ...responsableIds.map((responsableId) => checklistUserMap[responsableId]).filter(Boolean)]
      .filter((value: string, index: number, array: string[]) => !!value && array.indexOf(value) === index);
    await db.timelineEntry.create({
      data: { orderId: id, userId: u.id, event: 'checklist_item_added', detail: { label: item.label } },
    });
    return {
      data: {
        id: item.id,
        tarea: item.label,
        responsable: responsables.join(', '),
        responsables,
        responsableId: item.responsableId,
        responsableIds: item.responsableIds,
        completada: item.checked,
      },
    };
  });

  app.patch('/api/v1/work-orders/:id/checklist/:itemId', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id, itemId } = req.params as any;
    const body = req.body as any;
    const current = await db.checklist.findUnique({ where: { id: itemId } });
    if (!current) return reply.status(404).send({ error: 'Item no encontrado' });
    const shouldEdit = body.tarea !== undefined || body.responsableIds !== undefined || body.responsableId !== undefined;
    const responsableIds: string[] = shouldEdit
      ? [...new Set(Array.isArray(body.responsableIds) ? body.responsableIds.filter(Boolean) : (body.responsableId ? [body.responsableId] : []))]
      : (current.responsableIds?.length ? current.responsableIds : (current.responsableId ? [current.responsableId] : []));
    const updated = await db.checklist.update({
      where: { id: itemId },
      data: shouldEdit
        ? {
            label: body.tarea ?? current.label,
            responsableId: (responsableIds[0] as string | undefined) ?? null,
            responsableIds: responsableIds as any,
          }
        : { checked: !current.checked },
      include: { responsable: { select: { name: true } } },
    }) as any;
    const checklistUserMap = await buildChecklistUserMap([updated as any]);
    const responsables = [updated.responsable?.name, ...responsableIds.map((responsableId) => checklistUserMap[responsableId]).filter(Boolean)]
      .filter((value: string, index: number, array: string[]) => !!value && array.indexOf(value) === index);
    await db.timelineEntry.create({
      data: {
        orderId: id,
        userId: u.id,
        event: 'checklist_item_updated',
        detail: shouldEdit
          ? { label: updated.label, responsables }
          : { label: updated.label, checked: updated.checked },
      },
    });
    return {
      data: {
        id: updated.id,
        tarea: updated.label,
        responsable: responsables.join(', '),
        responsables,
        responsableId: updated.responsableId,
        responsableIds: updated.responsableIds,
        completada: updated.checked,
      },
    };
  });

  // ── CLIENTS ───────────────────────────────────────────────────────────────

  app.get('/api/v1/clients', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const perPage = Math.min(Number((req.query as any).per_page ?? 50), 500);
    const clients = await db.client.findMany({
      include: { _count: { select: { orders: true, vehicles: true } } },
      orderBy: { createdAt: 'desc' },
      take: perPage,
    });
    return {
      data: clients.map(c => ({
        id: c.id, nombre: c.name, telefono: c.phone, correo: c.email ?? '',
        rfc: '', tag: CLIENT_TAG_MAP[c.tag] ?? c.tag,
        total_ots: c._count.orders, total_vehiculos: c._count.vehicles,
      })),
      meta: { last_page: 1 },
    };
  });

  app.get('/api/v1/clients/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const c = await db.client.findUnique({
      where: { id },
      include: {
        vehicles: true,
        orders: { include: { vehicle: true, technician: true, accountReceivable: true }, orderBy: { createdAt: 'desc' } },
        _count: { select: { orders: true, vehicles: true } },
      },
    });
    if (!c) return reply.status(404).send({ error: 'Cliente no encontrado' });
    return {
      data: {
        id: c.id, nombre: c.name, telefono: c.phone, correo: c.email ?? '', rfc: '',
        tag: CLIENT_TAG_MAP[c.tag] ?? c.tag,
        total_ots: c._count.orders, total_vehiculos: c._count.vehicles,
        vehicles: c.vehicles.map(v => ({
          id: v.id, marca: v.brand, modelo: v.model, anio: v.year, placas: v.plates, vin: v.vin ?? '',
        })),
        workOrders: c.orders.map(o => ({
          id: o.id, code: o.code, status: STATUS_MAP[o.status] ?? o.status, priority: PRIORITY_MAP[o.priority] ?? o.priority,
          fecha_programada: toDate(o.scheduledAt),
          tecnico: o.technician ? { name: o.technician.name } : null,
          vehiculo: o.vehicle ? { marca: o.vehicle.brand, modelo: o.vehicle.model, anio: o.vehicle.year, placas: o.vehicle.plates } : null,
          paymentState: o.accountReceivable ? (PAYMENT_STATUS_MAP[o.accountReceivable.status] ?? 'Pendiente') : 'Pendiente',
        })),
      },
    };
  });

  app.post('/api/v1/clients', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const c = await db.client.create({
      data: {
        name: body.nombre ?? body.name,
        phone: body.telefono ?? body.phone ?? null,
        email: body.correo ?? body.email ?? null,
        tag: (CLIENT_TAG_REVERSE[body.tag] ?? 'NEW') as any,
      },
    });
    return { data: { id: c.id, nombre: c.name, telefono: c.phone, correo: c.email ?? '', rfc: '', tag: CLIENT_TAG_MAP[c.tag] ?? c.tag, total_ots: 0, total_vehiculos: 0 } };
  });

  app.put('/api/v1/clients/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const c = await db.client.update({
      where: { id },
      data: {
        name: body.nombre ?? body.name,
        phone: (body.telefono ?? body.phone) || undefined,
        email: body.correo ?? body.email ?? null,
      },
    });
    return { data: { id: c.id, nombre: c.name, telefono: c.phone, correo: c.email ?? '', rfc: '', tag: CLIENT_TAG_MAP[c.tag] ?? c.tag, total_ots: 0, total_vehiculos: 0 } };
  });

  app.delete('/api/v1/clients/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const activeOrders = await db.workOrder.count({
      where: { clientId: id, status: { notIn: ['DELIVERED', 'ARCHIVED'] as any } },
    });
    if (activeOrders > 0) return reply.status(422).send({ message: 'El cliente tiene órdenes activas y no puede eliminarse.' });
    // Cascade: delete orders (delivered/archived), then vehicles, then client
    const clientOrders = await db.workOrder.findMany({ where: { clientId: id }, select: { id: true } });
    for (const order of clientOrders) {
      await db.assignedPart.deleteMany({ where: { orderId: order.id } });
      await db.quote.deleteMany({ where: { orderId: order.id } });
      await db.note.deleteMany({ where: { orderId: order.id } });
      await db.checklist.deleteMany({ where: { orderId: order.id } });
      await db.timelineEntry.deleteMany({ where: { orderId: order.id } });
      await db.photo.deleteMany({ where: { orderId: order.id } });
      await db.accountReceivable.deleteMany({ where: { orderId: order.id } });
      await db.custodyPiece.deleteMany({ where: { orderId: order.id } });
      await db.workOrder.delete({ where: { id: order.id } });
    }
    await db.vehicle.deleteMany({ where: { clientId: id } });
    await db.client.delete({ where: { id } });
    return { message: 'Cliente eliminado' };
  });

  // ── INVENTORY ─────────────────────────────────────────────────────────────

  app.get('/api/v1/inventory', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const perPage = Math.min(Number((req.query as any).per_page ?? 100), 500);
    const items = await db.inventoryItem.findMany({ where: { isActive: true }, take: perPage, orderBy: { createdAt: 'desc' } });
    const storage = new S3FileStorageAdapter();
    const data = await Promise.all(items.map(async (i) => ({
      id: i.id, nombre: i.name, tipo: INVENTORY_TYPE_MAP[i.type] ?? i.type,
      estado: 'Bueno', stock_actual: i.stock, stock_minimo: i.minStock,
      precio: Number(i.purchasePrice), precio_venta: Number(i.salePrice),
      low_stock: i.stock <= i.minStock,
      foto_url: i.photoUrl ? await storage.getDownloadUrl(i.photoUrl) : null,
    })));
    return { data };
  });

  app.post('/api/v1/inventory', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const tipo = (INVENTORY_TYPE_REVERSE[body.tipo] ?? 'SALE_PART') as any;
    const item = await db.inventoryItem.create({
      data: {
        name: body.nombre,
        type: tipo,
        stock: Number(body.stock_actual ?? 0),
        minStock: Number(body.stock_minimo ?? 0),
        purchasePrice: Number(body.precio ?? 0),
        salePrice: Number(body.precio_venta ?? body.precio ?? 0),
        isActive: true,
      },
    });
    return {
      data: {
        id: item.id, nombre: item.name, tipo: INVENTORY_TYPE_MAP[item.type] ?? item.type,
        estado: 'Bueno', stock_actual: item.stock, stock_minimo: item.minStock,
        precio: Number(item.purchasePrice), precio_venta: Number(item.salePrice),
        low_stock: item.stock <= item.minStock, foto_url: null,
      },
    };
  });

  app.put('/api/v1/inventory/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const item = await db.inventoryItem.update({
      where: { id },
      data: {
        name: body.nombre || undefined,
        stock: body.stock_actual !== undefined ? Number(body.stock_actual) : undefined,
        minStock: body.stock_minimo !== undefined ? Number(body.stock_minimo) : undefined,
        purchasePrice: body.precio !== undefined ? Number(body.precio) : undefined,
        salePrice: body.precio_venta !== undefined ? Number(body.precio_venta) : undefined,
      },
    });
    return {
      data: {
        id: item.id, nombre: item.name, tipo: INVENTORY_TYPE_MAP[item.type] ?? item.type,
        estado: 'Bueno', stock_actual: item.stock, stock_minimo: item.minStock,
        precio: Number(item.purchasePrice), precio_venta: Number(item.salePrice),
        low_stock: item.stock <= item.minStock, foto_url: null,
      },
    };
  });

  app.post('/api/v1/inventory/:id/photo', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const item = await db.inventoryItem.findUnique({ where: { id } });
    if (!item) return reply.status(404).send({ error: 'Item no encontrado' });

    const data = await req.file();
    if (!data) return reply.status(400).send({ error: 'No se recibió archivo' });

    const buffer = await data.toBuffer();
    const ext = data.filename.split('.').pop() ?? 'jpg';
    const key = `inventory/${id}/${createId()}.${ext}`;

    const storage = new S3FileStorageAdapter();
    const uploadUrl = await storage.getUploadUrl(key, data.mimetype);

    await fetch(uploadUrl, {
      method: 'PUT',
      body: buffer,
      headers: { 'Content-Type': data.mimetype },
    });

    const photoUrl = await storage.getDownloadUrl(key);
    const updated = await db.inventoryItem.update({
      where: { id },
      data: { photoUrl: key },
    });

    return {
      data: {
        id: updated.id, nombre: updated.name, tipo: INVENTORY_TYPE_MAP[updated.type] ?? updated.type,
        estado: 'Bueno', stock_actual: updated.stock, stock_minimo: updated.minStock,
        precio: Number(updated.purchasePrice), precio_venta: Number(updated.salePrice),
        low_stock: updated.stock <= updated.minStock, foto_url: photoUrl,
      },
    };
  });

  app.post('/api/v1/inventory/:id/movements', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const typeMap: Record<string, string> = { entrada: 'ENTRY', salida: 'EXIT', ajuste: 'ADJUSTMENT' };
    const movType = (typeMap[body.tipo] ?? 'ADJUSTMENT') as any;
    const qty = Number(body.cantidad ?? 1);
    const delta = movType === 'EXIT' ? -qty : qty;
    await db.inventoryItem.update({ where: { id }, data: { stock: { increment: delta } } });
    await db.stockMovement.create({
      data: { itemId: id, type: movType, quantity: qty, reason: body.motivo, userId: u.id },
    });
    return { message: 'Movimiento registrado' };
  });

  app.get('/api/v1/inventory/custody', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const pieces = await db.custodyPiece.findMany({ orderBy: { createdAt: 'desc' } });
    return {
      data: pieces.map(p => ({
        id: p.id, work_order_id: p.orderId, client_id: null,
        item: p.description, responsable: 'Recepción', estado: 'Resguardado',
        fecha_ingreso: toDate(p.createdAt),
      })),
    };
  });

  app.post('/api/v1/inventory/custody', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const p = await db.custodyPiece.create({
      data: {
        orderId: body.work_order_id,
        description: body.item,
        notes: body.responsable,
      },
    });
    return { data: { id: p.id, work_order_id: p.orderId, item: p.description, responsable: p.notes ?? 'Recepción', estado: 'Resguardado', fecha_ingreso: toDate(p.createdAt) } };
  });

  app.patch('/api/v1/inventory/custody/:id/deliver', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    await db.custodyPiece.update({ where: { id }, data: { notes: 'Entregado' } });
    return { message: 'ok' };
  });

  // ── FINANCE ───────────────────────────────────────────────────────────────

  app.get('/api/v1/finance/cash', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const perPage = Math.min(Number((req.query as any).per_page ?? 100), 500);
    const entries = await db.cashEntry.findMany({ orderBy: { date: 'desc' }, take: perPage });
    return {
      data: entries.map(e => ({
        id: e.id, fecha: toDate(e.date), concepto: e.description,
        tipo: CASH_TYPE_MAP[e.type] ?? e.type,
        monto: Number(e.amount),
        metodo_pago: PAYMENT_METHOD_MAP[e.method] ?? e.method,
        referencia: null,
      })),
    };
  });

  app.post('/api/v1/finance/cash', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const type = (CASH_TYPE_REVERSE[body.tipo] ?? 'INCOME') as any;
    const method = (PAYMENT_METHOD_REVERSE[body.metodo_pago] ?? 'CASH') as any;
    const e = await db.cashEntry.create({
      data: {
        type, amount: Number(body.monto), description: body.concepto,
        method, userId: u.id,
        date: body.fecha ? new Date(body.fecha) : new Date(),
      },
    });
    return {
      data: {
        id: e.id, fecha: toDate(e.date), concepto: e.description,
        tipo: CASH_TYPE_MAP[e.type] ?? e.type, monto: Number(e.amount),
        metodo_pago: PAYMENT_METHOD_MAP[e.method] ?? e.method, referencia: null,
      },
    };
  });

  app.delete('/api/v1/finance/cash/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    await db.cashEntry.delete({ where: { id } });
    return { message: 'ok' };
  });

  app.get('/api/v1/finance/receivable', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const perPage = Math.min(Number((req.query as any).per_page ?? 100), 500);
    const ars = await db.accountReceivable.findMany({
      include: { client: true, order: { select: { code: true } } },
      orderBy: { createdAt: 'desc' },
      take: perPage,
    });
    return {
      data: ars.map(ar => {
        const paid = Number(ar.paid);
        const total = Number(ar.total);
        const pending = Math.max(0, total - paid);
        const now = new Date();
        const overdue = ar.dueDate && ar.dueDate < now && ar.status !== 'PAID';
        const estado = overdue ? 'Vencido' : PAYMENT_STATUS_MAP[ar.status] ?? ar.status;
        return {
          id: ar.id, work_order_id: ar.orderId, code: (ar as any).order?.code ?? ar.orderId,
          cliente: ar.client?.name ?? '',
          monto: total, monto_recibido: paid, monto_pendiente: pending,
          fecha_emision: toDate(ar.createdAt), fecha_vencimiento: toDate(ar.dueDate),
          estado: PAYMENT_STATUS_MAP[ar.status] ?? ar.status, estado_calculado: estado,
        };
      }),
    };
  });

  app.patch('/api/v1/work-orders/:id/ar-total', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const total = Number(body.total ?? 0);
    if (total < 0) return reply.status(400).send({ error: 'Total inválido' });

    const ar = await db.accountReceivable.findUnique({ where: { orderId: id } });
    if (!ar) return reply.status(404).send({ error: 'No existe cuenta por cobrar para esta orden' });

    const newBalance = Math.max(0, total - Number(ar.paid));
    const newStatus = newBalance === 0 ? 'PAID' : Number(ar.paid) > 0 ? 'PARTIAL' : 'PENDING';

    await db.accountReceivable.update({
      where: { id: ar.id },
      data: { total, balance: newBalance, status: newStatus as any },
    });

    await db.timelineEntry.create({
      data: {
        orderId: id, userId: u.id, event: 'quote_summary',
        detail: {
          subtotal: Number(body.subtotal ?? total),
          descuento: Number(body.descuento ?? 0),
          iva: Number(body.iva ?? 0),
          total,
          actualizado: true,
        },
      },
    });

    return { message: 'ok' };
  });

  app.patch('/api/v1/finance/receivable/:id/payment', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const ar = await db.accountReceivable.findUnique({ where: { id } });
    if (!ar) return reply.status(404).send({ error: 'No encontrado' });
    const amount = Number(body.monto ?? 0);
    const newPaid = Math.min(Number(ar.paid) + amount, Number(ar.total));
    const newBalance = Math.max(0, Number(ar.total) - newPaid);
    const newStatus = newBalance === 0 ? 'PAID' : newPaid > 0 ? 'PARTIAL' : ar.status;
    await db.accountReceivable.update({
      where: { id },
      data: { paid: newPaid, balance: newBalance, status: newStatus as any },
    });
    await db.payment.create({
      data: {
        accountReceivableId: id,
        amount,
        method: (PAYMENT_METHOD_REVERSE[body.metodo_pago] ?? 'CASH') as any,
        userId: u.id,
      },
    });
    return { message: 'ok' };
  });

  app.get('/api/v1/finance/payable', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const perPage = Math.min(Number((req.query as any).per_page ?? 100), 500);
    const aps = await db.accountPayable.findMany({
      include: { supplier: true },
      orderBy: { createdAt: 'desc' },
      take: perPage,
    });
    return {
      data: aps.map(ap => {
        const paid = Number(ap.paid);
        const total = Number(ap.total);
        const pending = Math.max(0, total - paid);
        const now = new Date();
        const overdue = ap.dueDate && ap.dueDate < now && ap.status !== 'PAID';
        const estado = overdue ? 'Vencido' : PAYMENT_STATUS_MAP[ap.status] ?? ap.status;
        return {
          id: ap.id, concepto: ap.description, proveedor: ap.supplier?.name ?? null,
          monto: total, monto_pagado: paid, monto_pendiente: pending,
          fecha_vencimiento: toDate(ap.dueDate) ?? '', estado: PAYMENT_STATUS_MAP[ap.status] ?? ap.status,
          estado_calculado: estado, created_at: ap.createdAt.toISOString(),
        };
      }),
    };
  });

  app.patch('/api/v1/finance/payable/:id/payment', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const ap = await db.accountPayable.findUnique({ where: { id } });
    if (!ap) return reply.status(404).send({ error: 'No encontrado' });
    const amount = Number(body.monto ?? 0);
    const newPaid = Math.min(Number(ap.paid) + amount, Number(ap.total));
    const newBalance = Math.max(0, Number(ap.total) - newPaid);
    const newStatus = newBalance === 0 ? 'PAID' : newPaid > 0 ? 'PARTIAL' : ap.status;
    await db.accountPayable.update({
      where: { id },
      data: { paid: newPaid, balance: newBalance, status: newStatus as any },
    });
    await db.payment.create({
      data: {
        accountPayableId: id,
        amount,
        method: (PAYMENT_METHOD_REVERSE[body.metodo_pago] ?? 'CASH') as any,
        userId: u.id,
      },
    });
    return { message: 'ok' };
  });

  app.get('/api/v1/finance/comparative', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const months: any[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const [inc, exp, ots] = await Promise.all([
        db.cashEntry.aggregate({ _sum: { amount: true }, where: { type: 'INCOME', date: { gte: start, lte: end } } }),
        db.cashEntry.aggregate({ _sum: { amount: true }, where: { type: 'EXPENSE', date: { gte: start, lte: end } } }),
        db.workOrder.count({ where: { createdAt: { gte: start, lte: end } } }),
      ]);
      months.push({
        mes: d.toISOString().slice(0, 7),
        label: d.toLocaleString('es-MX', { month: 'short', year: '2-digit' }),
        ingresos: Number(inc._sum.amount ?? 0),
        egresos: Number(exp._sum.amount ?? 0),
        ots,
      });
    }
    return { data: months };
  });

  // ── CONTACTS (Suppliers) ──────────────────────────────────────────────────

  function mapSupplier(s: any) {
    return {
      id: s.id, nombre: s.name, rfc: '', empresa: s.name,
      telefono: s.phone ?? '', correo: s.email ?? '',
      dias_pago: s.diasPago ?? 30,
      limite_credito: Number(s.limiteCredito ?? 0),
      politica_descuentos: s.politicaDescuentos ?? '',
      productos: null, etiquetas: null,
    };
  }

  app.get('/api/v1/contacts', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const perPage = Math.min(Number((req.query as any).per_page ?? 100), 500);
    const suppliers = await db.supplier.findMany({ where: { isActive: true }, take: perPage });
    return { data: suppliers.map(mapSupplier) };
  });

  app.post('/api/v1/contacts', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const s = await db.supplier.create({
      data: {
        name: body.nombre,
        phone: body.telefono || null,
        email: body.correo || null,
        diasPago: body.dias_pago !== undefined ? Number(body.dias_pago) : 30,
        limiteCredito: body.limite_credito !== undefined ? Number(body.limite_credito) : 0,
        politicaDescuentos: body.politica_descuentos ?? '',
      },
    });
    return { data: mapSupplier(s) };
  });

  app.put('/api/v1/contacts/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const s = await db.supplier.update({
      where: { id },
      data: {
        name: body.nombre || undefined,
        phone: body.telefono !== undefined ? (body.telefono || null) : undefined,
        email: body.correo !== undefined ? (body.correo || null) : undefined,
        diasPago: body.dias_pago !== undefined ? Number(body.dias_pago) : undefined,
        limiteCredito: body.limite_credito !== undefined ? Number(body.limite_credito) : undefined,
        politicaDescuentos: body.politica_descuentos !== undefined ? body.politica_descuentos : undefined,
      },
    });
    return { data: mapSupplier(s) };
  });

  app.delete('/api/v1/contacts/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    await db.supplier.update({ where: { id }, data: { isActive: false } });
    return { message: 'ok' };
  });

  // ── PAYMENTS AGENDA ───────────────────────────────────────────────────────

  app.get('/api/v1/payments-agenda', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const perPage = Math.min(Number((req.query as any).per_page ?? 100), 500);
    const payments = await db.scheduledPayment.findMany({ orderBy: { dueDate: 'asc' }, take: perPage });
    return {
      data: payments.map(p => ({
        id: p.id, concepto: p.description,
        tipo: CASH_TYPE_MAP[p.type] ?? p.type,
        categoria: 'General',
        fecha_vencimiento: toDate(p.dueDate) ?? '',
        monto_presupuestado: Number(p.amount),
        monto_pagado: Number(p.paidAmount),
        estado: PAYMENT_STATUS_MAP[p.status] ?? p.status,
        comprobante_url: null, notas: p.notes ?? null,
      })),
    };
  });

  app.post('/api/v1/payments-agenda', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const tipo = (CASH_TYPE_REVERSE[body.tipo] ?? 'EXPENSE') as any;
    const p = await db.scheduledPayment.create({
      data: {
        description: body.concepto,
        amount: Number(body.monto_presupuestado ?? 0),
        paidAmount: Number(body.monto_pagado ?? 0),
        dueDate: new Date(body.fecha_vencimiento),
        type: tipo,
        notes: body.notas || null,
      },
    });
    return { data: { id: p.id, concepto: p.description, tipo: CASH_TYPE_MAP[p.type] ?? p.type, categoria: 'General', fecha_vencimiento: toDate(p.dueDate) ?? '', monto_presupuestado: Number(p.amount), monto_pagado: Number(p.paidAmount), estado: PAYMENT_STATUS_MAP[p.status] ?? p.status, comprobante_url: null, notas: p.notes ?? null } };
  });

  app.put('/api/v1/payments-agenda/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const PAYMENT_STATUS_REVERSE: Record<string, string> = Object.fromEntries(
      Object.entries(PAYMENT_STATUS_MAP).map(([k, v]) => [v, k]),
    );
    const p = await db.scheduledPayment.update({
      where: { id },
      data: {
        description: body.concepto || undefined,
        amount: body.monto_presupuestado !== undefined ? Number(body.monto_presupuestado) : undefined,
        paidAmount: body.monto_pagado !== undefined ? Number(body.monto_pagado) : undefined,
        dueDate: body.fecha_vencimiento ? new Date(body.fecha_vencimiento) : undefined,
        notes: body.notas !== undefined ? body.notas : undefined,
        status: body.estado !== undefined ? ((PAYMENT_STATUS_REVERSE[body.estado] ?? body.estado) as any) : undefined,
      },
    });
    return { data: { id: p.id, concepto: p.description, tipo: CASH_TYPE_MAP[p.type] ?? p.type, categoria: 'General', fecha_vencimiento: toDate(p.dueDate) ?? '', monto_presupuestado: Number(p.amount), monto_pagado: Number(p.paidAmount), estado: PAYMENT_STATUS_MAP[p.status] ?? p.status, comprobante_url: null, notas: p.notes ?? null } };
  });

  app.delete('/api/v1/payments-agenda/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    await db.scheduledPayment.delete({ where: { id } });
    return { message: 'ok' };
  });

  // ── PRICES ────────────────────────────────────────────────────────────────

  function mapPriceItem(p: any) {
    const isTorno = p.categoriaPrincipal === 'Servicio de Torno';
    return {
      id: p.id,
      categoria_principal: p.categoriaPrincipal,
      sistema: p.sistema ?? null,
      familia: p.familia ?? null,
      concepto: p.concepto ?? p.name,
      tamano: p.tamano ?? null,
      diametro: p.diametro ?? null,
      precio_auto: p.precioAuto !== null && p.precioAuto !== undefined ? String(Number(p.precioAuto)) : null,
      precio_camioneta: p.precioCamioneta !== null && p.precioCamioneta !== undefined ? String(Number(p.precioCamioneta)) : null,
      precio_camion: p.precioCamion !== null && p.precioCamion !== undefined ? String(Number(p.precioCamion)) : null,
      precio: isTorno && p.precioAuto !== null && p.precioAuto !== undefined ? String(Number(p.precioAuto)) : null,
      observacion: p.observacion ?? null,
      activo: p.isActive,
    };
  }

  app.get('/api/v1/prices', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const perPage = Math.min(Number((req.query as any).per_page ?? 200), 1000);
    const prices = await db.priceList.findMany({ where: { isActive: true }, take: perPage, orderBy: { createdAt: 'desc' } });
    return { data: prices.map(mapPriceItem) };
  });

  app.post('/api/v1/prices', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const isTorno = body.categoria_principal === 'Servicio de Torno';
    const p = await db.priceList.create({
      data: {
        name: body.concepto ?? body.tamano ?? 'Servicio',
        categoriaPrincipal: body.categoria_principal ?? 'Mecánica General',
        sistema: body.sistema ?? null,
        familia: body.familia ?? null,
        concepto: body.concepto ?? null,
        tamano: body.tamano ?? null,
        diametro: body.diametro ?? null,
        precioAuto: body.precio_auto !== undefined && body.precio_auto !== '' ? Number(body.precio_auto) :
                    isTorno && body.precio !== undefined && body.precio !== '' ? Number(body.precio) : null,
        precioCamioneta: body.precio_camioneta !== undefined && body.precio_camioneta !== '' ? Number(body.precio_camioneta) : null,
        precioCamion: body.precio_camion !== undefined && body.precio_camion !== '' ? Number(body.precio_camion) : null,
        observacion: body.observacion ?? null,
      },
    });
    return { data: mapPriceItem(p) };
  });

  app.put('/api/v1/prices/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const isTorno = body.categoria_principal === 'Servicio de Torno';
    const p = await db.priceList.update({
      where: { id },
      data: {
        name: body.concepto ?? body.tamano ?? undefined,
        categoriaPrincipal: body.categoria_principal ?? undefined,
        sistema: body.sistema !== undefined ? (body.sistema || null) : undefined,
        familia: body.familia !== undefined ? (body.familia || null) : undefined,
        concepto: body.concepto !== undefined ? (body.concepto || null) : undefined,
        tamano: body.tamano !== undefined ? (body.tamano || null) : undefined,
        diametro: body.diametro !== undefined ? (body.diametro || null) : undefined,
        precioAuto: body.precio_auto !== undefined && body.precio_auto !== '' ? Number(body.precio_auto) :
                    isTorno && body.precio !== undefined && body.precio !== '' ? Number(body.precio) :
                    body.precio_auto === '' ? null : undefined,
        precioCamioneta: body.precio_camioneta !== undefined ? (body.precio_camioneta !== '' ? Number(body.precio_camioneta) : null) : undefined,
        precioCamion: body.precio_camion !== undefined ? (body.precio_camion !== '' ? Number(body.precio_camion) : null) : undefined,
        observacion: body.observacion !== undefined ? (body.observacion || null) : undefined,
      },
    });
    return { data: mapPriceItem(p) };
  });

  // ── ACTIVITIES ────────────────────────────────────────────────────────────

  function mapActivity(a: any) {
    const assignedUsers = Array.isArray(a.assignedUsers) ? a.assignedUsers : [];
    const fallbackAssignee = a.asignee ? [{ id: a.asignee.id, name: a.asignee.name }] : [];
    const assignees = assignedUsers.length > 0 ? assignedUsers : fallbackAssignee;

    return {
      id: a.id, titulo: a.titulo, descripcion: a.descripcion ?? '',
      prioridad: a.prioridad, etiqueta: a.etiqueta, estado: a.estado,
      fecha_limite: a.fechaLimite ? toDate(a.fechaLimite) : null,
      asignado_a: assignees,
      creado_por_id: a.creadoPorId ?? null,
      creado_por_role: a.creator?.role ?? null,
      comentarios: (a.comments ?? []).map((c: any) => ({
        id: c.id, texto: c.texto,
        user: c.user ? { name: c.user.name } : null,
        created_at: c.createdAt.toISOString(),
      })),
      created_at: a.createdAt.toISOString(),
    };
  }

  app.get('/api/v1/activities', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const perPage = Math.min(Number((req.query as any).per_page ?? 100), 500);
    const where = u.role === 'ADMIN' || u.role === 'MANAGER'
      ? {}
      : { OR: [{ asignadoAId: u.id }, { asignadoAIds: { has: u.id } }] };
    const activities = await db.activity.findMany({
      where,
      include: { asignee: true, creator: true, comments: { include: { user: true }, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: perPage,
    });
    const assignedUserIds = Array.from(new Set(activities.flatMap((activity) => activity.asignadoAIds ?? [])));
    const assignedUsers = assignedUserIds.length > 0
      ? await db.user.findMany({ where: { id: { in: assignedUserIds } }, select: { id: true, name: true } })
      : [];
    const assignedUsersMap = new Map(assignedUsers.map((user) => [user.id, user]));

    return {
      data: activities
        .map((activity) => ({
          ...activity,
          assignedUsers: (activity.asignadoAIds ?? [])
            .map((userId) => assignedUsersMap.get(userId))
            .filter(Boolean),
        }))
        .map(mapActivity),
    };
  });

  app.post('/api/v1/activities', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const asignadoAIds = Array.isArray(body.asignado_a_ids)
      ? body.asignado_a_ids.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
      : body.asignado_a_id
        ? [body.asignado_a_id]
        : [];
    const a = await db.activity.create({
      data: {
        titulo: body.titulo,
        descripcion: body.descripcion || null,
        prioridad: body.prioridad ?? 'Media',
        etiqueta: body.etiqueta ?? '',
        estado: body.estado ?? 'Pendiente',
        asignadoAId: asignadoAIds[0] || null,
        asignadoAIds,
        fechaLimite: body.fecha_limite ? new Date(body.fecha_limite) : null,
        creadoPorId: u.id,
      },
      include: { asignee: true, creator: true, comments: { include: { user: true } } },
    });
    const assignedUsers = asignadoAIds.length > 0
      ? await db.user.findMany({ where: { id: { in: asignadoAIds } }, select: { id: true, name: true } })
      : [];
    return { data: mapActivity({ ...a, assignedUsers }) };
  });

  app.put('/api/v1/activities/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const hasAssignedIds = body.asignado_a_ids !== undefined || body.asignado_a_id !== undefined;
    const asignadoAIds = Array.isArray(body.asignado_a_ids)
      ? body.asignado_a_ids.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
      : body.asignado_a_id !== undefined
        ? (body.asignado_a_id ? [body.asignado_a_id] : [])
        : undefined;
    const a = await db.activity.update({
      where: { id },
      data: {
        titulo: body.titulo || undefined,
        descripcion: body.descripcion !== undefined ? body.descripcion : undefined,
        prioridad: body.prioridad || undefined,
        etiqueta: body.etiqueta !== undefined ? body.etiqueta : undefined,
        estado: body.estado || undefined,
        asignadoAId: hasAssignedIds ? (asignadoAIds?.[0] || null) : undefined,
        asignadoAIds: hasAssignedIds ? (asignadoAIds ?? []) : undefined,
        fechaLimite: body.fecha_limite !== undefined ? (body.fecha_limite ? new Date(body.fecha_limite) : null) : undefined,
      },
      include: { asignee: true, creator: true, comments: { include: { user: true } } },
    });
    const assignedUsers = (a.asignadoAIds ?? []).length > 0
      ? await db.user.findMany({ where: { id: { in: a.asignadoAIds } }, select: { id: true, name: true } })
      : [];
    return { data: mapActivity({ ...a, assignedUsers }) };
  });

  app.delete('/api/v1/activities/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    await db.activity.delete({ where: { id } });
    return { message: 'ok' };
  });

  app.post('/api/v1/activities/:id/comments', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const c = await db.activityComment.create({
      data: { activityId: id, userId: u.id, texto: body.texto },
      include: { user: true },
    });
    return { data: { id: c.id, texto: c.texto, user: { name: c.user.name }, created_at: c.createdAt.toISOString() } };
  });

  app.delete('/api/v1/activities/:id/comments/:commentId', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { commentId } = req.params as any;
    await db.activityComment.delete({ where: { id: commentId } });
    return { message: 'ok' };
  });

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const mapKpi = (k: Awaited<ReturnType<typeof db.kpi.findFirst>>) => k && {
    id: k.id, nombre: k.nombre, descripcion: k.descripcion,
    role_responsable: k.roleResponsable, meta: Number(k.meta), progreso: Number(k.progreso),
    periodo: k.periodo, fecha_inicio: toDate(k.fechaInicio), fecha_fin: toDate(k.fechaFin),
  };

  app.get('/api/v1/kpis', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const kpis = await db.kpi.findMany({ where: { activo: true }, orderBy: { createdAt: 'desc' } });
    return { data: kpis.map(mapKpi) };
  });

  app.post('/api/v1/kpis', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const kpi = await db.kpi.create({
      data: {
        nombre: body.nombre ?? 'Sin nombre',
        descripcion: body.descripcion ?? '',
        roleResponsable: body.role_responsable,
        meta: Number(body.meta ?? 0),
        progreso: Number(body.progreso ?? 0),
        periodo: body.periodo ?? '',
        fechaInicio: new Date(body.fecha_inicio),
        fechaFin: new Date(body.fecha_fin),
      },
    });
    return { data: mapKpi(kpi) };
  });

  app.put('/api/v1/kpis/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const kpi = await db.kpi.update({
      where: { id },
      data: {
        nombre: body.nombre ?? undefined,
        descripcion: body.descripcion ?? undefined,
        roleResponsable: body.roleResponsable ?? undefined,
        meta: body.meta !== undefined ? Number(body.meta) : undefined,
        progreso: body.progreso !== undefined ? Number(body.progreso) : undefined,
        periodo: body.periodo ?? undefined,
        fechaInicio: body.fechaInicio ? new Date(body.fechaInicio) : undefined,
        fechaFin: body.fechaFin ? new Date(body.fechaFin) : undefined,
        activo: body.activo ?? undefined,
      },
    });
    return { data: mapKpi(kpi) };
  });

  app.delete('/api/v1/kpis/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    await db.kpi.update({ where: { id }, data: { activo: false } });
    return { message: 'ok' };
  });

  // ── KPI Activity Tags ───────────────────────────────────────────────────────

  app.get('/api/v1/activity-tags', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const tags = await db.activityTag.findMany();
    return { data: tags.map(t => ({ id: t.id, nombre: t.nombre, color: t.color })) };
  });

  app.post('/api/v1/activity-tags', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const tag = await db.activityTag.create({ data: { nombre: body.nombre ?? 'Sin nombre', color: body.color ?? '#999999' } });
    return { data: { id: tag.id, nombre: tag.nombre, color: tag.color } };
  });

  app.put('/api/v1/activity-tags/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const tag = await db.activityTag.update({
      where: { id },
      data: { nombre: body.nombre ?? undefined, color: body.color ?? undefined },
    });
    return { data: { id: tag.id, nombre: tag.nombre, color: tag.color } };
  });

  app.delete('/api/v1/activity-tags/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    await db.activityTag.delete({ where: { id } });
    return { message: 'ok' };
  });

  // ── KPI Activities ────────────────────────────────────────────────────────

  const mapKpiActivity = (a: any) => ({
    id: a.id, titulo: a.titulo, descripcion: a.descripcion,
    role_asignado: a.roleAsignado, status: a.status, prioridad: a.prioridad,
    fecha_vencimiento: toDate(a.fechaVencimiento),
    tags: (a.tags ?? []).map((t: any) => t.id),
    empleado_id: a.empleadoId ?? undefined,
  });

  app.get('/api/v1/kpi-activities', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const activities = await db.kpiActivity.findMany({ include: { tags: true }, orderBy: { createdAt: 'desc' } });
    return { data: activities.map(mapKpiActivity) };
  });

  app.post('/api/v1/kpi-activities', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const activity = await db.kpiActivity.create({
      data: {
        titulo: body.titulo ?? 'Sin título',
        descripcion: body.descripcion ?? '',
        roleAsignado: body.role_asignado,
        prioridad: body.prioridad ?? 'Normal',
        fechaVencimiento: body.fecha_vencimiento ? new Date(body.fecha_vencimiento) : null,
        empleadoId: body.empleado_id ?? null,
        tags: body.tags ? { connect: (body.tags as string[]).map((id) => ({ id })) } : undefined,
      },
      include: { tags: true },
    });
    return { data: mapKpiActivity(activity) };
  });

  app.put('/api/v1/kpi-activities/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const activity = await db.kpiActivity.update({
      where: { id },
      data: {
        titulo: body.titulo ?? undefined,
        descripcion: body.descripcion ?? undefined,
        roleAsignado: body.roleAsignado ?? undefined,
        status: body.status ?? undefined,
        prioridad: body.prioridad ?? undefined,
        fechaVencimiento: body.fechaVencimiento !== undefined
          ? (body.fechaVencimiento ? new Date(body.fechaVencimiento) : null)
          : undefined,
        empleadoId: body.empleadoAsignado !== undefined ? (body.empleadoAsignado || null) : undefined,
        tags: body.tags ? { set: (body.tags as string[]).map((tagId) => ({ id: tagId })) } : undefined,
      },
      include: { tags: true },
    });
    return { data: mapKpiActivity(activity) };
  });

  app.delete('/api/v1/kpi-activities/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    await db.kpiActivity.delete({ where: { id } });
    return { message: 'ok' };
  });

  // ── USERS / EMPLOYEES (settings) ─────────────────────────────────────────

  app.get('/api/v1/employees', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const users = await db.user.findMany({ where: { isActive: true } });
    return {
      data: users.map(u => ({
        id: u.id, name: u.name, email: u.email,
        role: u.kpiRole ?? KPI_ROLE_FALLBACK[u.role] ?? u.role,
        isActive: u.isActive,
        permissions: u.permissions,
      })),
    };
  });

  app.post('/api/v1/employees', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const hasher = new Argon2HasherAdapter();
    const hash = await hasher.hash(body.password ?? 'changeme123');
    const newUser = await db.user.create({
      data: {
        name: body.name, email: body.email,
        passwordHash: hash,
        role: body.role ?? 'TECHNICIAN',
        permissions: body.permissions ?? [],
      },
    });
    return { data: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, isActive: newUser.isActive, permissions: newUser.permissions } };
  });

  app.put('/api/v1/employees/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const upd = await db.user.update({
      where: { id },
      data: {
        name: body.nombre || body.name || undefined,
        kpiRole: body.role || undefined,
        permissions: body.permissions || undefined,
      },
    });
    return { data: { id: upd.id, name: upd.name, email: upd.email, role: upd.kpiRole ?? KPI_ROLE_FALLBACK[upd.role] ?? upd.role, isActive: upd.isActive, permissions: upd.permissions } };
  });

  app.delete('/api/v1/employees/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    await db.user.update({ where: { id }, data: { isActive: false } });
    return { message: 'ok' };
  });

  app.post('/api/v1/users', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const hasher = new Argon2HasherAdapter();
    const hash = await hasher.hash(body.password ?? 'changeme123');
    const newUser = await db.user.create({
      data: {
        name: body.name, email: body.email,
        passwordHash: hash,
        role: body.role ?? 'TECHNICIAN',
        permissions: body.permissions ?? [],
      },
    });
    return { data: { id: newUser.id, name: newUser.name, email: newUser.email, roles: [newUser.role], permissions: newUser.permissions } };
  });

  app.delete('/api/v1/users/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    await db.user.update({ where: { id }, data: { isActive: false } });
    return { message: 'Usuario desactivado' };
  });

  // ── ORGANIZATION ──────────────────────────────────────────────────────────

  app.get('/api/v1/organization', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    let org = await db.organizationInfo.findFirst();
    if (!org) {
      org = await db.organizationInfo.create({ data: {} });
    }
    return { data: { id: org.id, mision: org.mision, vision: org.vision, valores: org.valores } };
  });

  app.put('/api/v1/organization', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    let org = await db.organizationInfo.findFirst();
    if (!org) {
      org = await db.organizationInfo.create({ data: {} });
    }
    org = await db.organizationInfo.update({
      where: { id: org.id },
      data: {
        mision: body.mision ?? undefined,
        vision: body.vision ?? undefined,
        valores: body.valores ?? undefined,
      },
    });
    return { data: { id: org.id, mision: org.mision, vision: org.vision, valores: org.valores } };
  });

  // ── PORTAL (public) ───────────────────────────────────────────────────────

  app.get('/api/v1/portal/search', async (req, reply) => {
    const { q } = req.query as any;
    const term = String(q ?? '').trim();
    if (!term) return { data: [] };

    const normalizeAlphaNumeric = (value: string | null | undefined) =>
      String(value ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
    const normalizeDigits = (value: string | null | undefined) => String(value ?? '').replace(/\D/g, '');

    const normalizedTerm = normalizeAlphaNumeric(term);
    const numericTerm = normalizeDigits(term);

    const orders = await db.workOrder.findMany({
      include: { client: true, vehicle: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const filteredOrders = orders.filter((o) => {
      const normalizedCode = normalizeAlphaNumeric(o.code);
      const normalizedPlates = normalizeAlphaNumeric(o.vehicle?.plates);
      const normalizedPhone = normalizeDigits(o.client?.phone);

      const matchesCode = /^(ot|wo)[a-z0-9]+$/i.test(normalizedTerm) && normalizedCode === normalizedTerm;
      const matchesPlates = normalizedTerm.length >= 5 && normalizedPlates === normalizedTerm;
      const matchesPhone = numericTerm.length >= 10 && normalizedPhone === numericTerm;

      return matchesCode || matchesPlates || matchesPhone;
    });

    return {
      data: filteredOrders.slice(0, 20).map((o) => ({
        portalToken: o.portalToken,
        code: o.code,
        status: STATUS_MAP[o.status] ?? o.status,
        fecha_programada: toDate(o.scheduledAt),
        vehiculo: o.vehicle
          ? { marca: o.vehicle.brand, modelo: o.vehicle.model, anio: o.vehicle.year, placas: o.vehicle.plates }
          : null,
      })),
    };
  });

  app.get('/api/v1/portal/:token', async (req, reply) => {
    const { token } = req.params as any;
    const order = await db.workOrder.findUnique({
      where: { portalToken: token },
      include: {
        client: true, vehicle: true, technician: true, accountReceivable: true,
        checklist: { include: { responsable: { select: { name: true } } } },
        photos: true,
        notes: { include: { user: { select: { name: true } } } },
        assignedParts: { include: { item: true } },
        quotes: { include: { service: true } },
        timeline: { include: { user: { select: { name: true } } } },
      },
    });
    if (!order) return reply.status(404).send({ error: 'No encontrado' });
    order.notes = (order.notes ?? []).filter((n: any) => n.visibility === 'CLIENT');
    return { data: await mapOrderDetail(order, await buildChecklistUserMap(order.checklist)) };
  });
}
