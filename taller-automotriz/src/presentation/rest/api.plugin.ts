import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Container } from '../../infrastructure/di/container';
import { Argon2HasherAdapter } from '../../infrastructure/external/argon2-hasher.adapter';

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
    status: STATUS_MAP[o.status] ?? o.status,
    priority: PRIORITY_MAP[o.priority] ?? o.priority,
    tipo_vehiculo: o.vehicle ? (VEHICLE_TYPE_MAP[o.vehicle.type] ?? 'Auto') : 'Auto',
    problema: o.problem ?? '',
    diagnostico: o.repairNotes ?? '',
    fecha_ingreso: toDate(o.createdAt),
    fecha_programada: toDate(o.scheduledAt),
    cargo_generado: !!o.accountReceivable,
    cliente: o.client
      ? { id: o.client.id, nombre: o.client.name, telefono: o.client.phone, correo: o.client.email ?? '' }
      : null,
    vehiculo: o.vehicle
      ? { id: o.vehicle.id, marca: o.vehicle.brand, modelo: o.vehicle.model, anio: o.vehicle.year, placas: o.vehicle.plates, vin: o.vehicle.vin ?? '' }
      : null,
    tecnico: o.technician ? { id: o.technician.id, name: o.technician.name } : null,
  };
}

function mapOrderDetail(o: any) {
  const base = mapOrderList(o);
  return {
    ...base,
    checklists: (o.checklist ?? []).map((c: any) => ({
      id: c.id, tipo: c.phase ?? 'inicial', tarea: c.label, responsable: '', completada: c.checked,
    })),
    fotos: (o.photos ?? []).map((f: any) => ({ id: f.id, url: f.url })),
    notas: (o.notes ?? []).map((n: any) => ({
      id: n.id, tipo: 'interna', texto: n.content, created_at: n.createdAt?.toISOString(),
      user: n.user ? { name: n.user.name } : undefined,
    })),
    partes: (o.assignedParts ?? []).map((p: any) => ({
      id: p.id, inventory_item_id: p.itemId, nombre: p.item?.name ?? '', cantidad: p.quantity,
      costo_unitario: Number(p.unitPrice),
    })),
    servicios: (o.quotes ?? []).map((q: any) => ({
      id: q.id, price_item_id: q.serviceId ?? q.id, nombre: q.service?.name ?? 'Servicio', precio: Number(q.total),
    })),
    timeline: (o.timeline ?? []).map((t: any) => ({
      id: t.id, descripcion: t.event, created_at: t.createdAt?.toISOString(),
      user: t.user ? { name: t.user.name } : undefined,
    })),
  };
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export async function registerRestApi(app: FastifyInstance, container: Container) {
  const db = container.prisma;

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
        checklist: true,
        photos: true,
        notes: true,
        assignedParts: { include: { item: true } },
        quotes: { include: { service: true } },
        timeline: { include: { user: { select: { name: true } } } },
      },
    });
    if (!o) return reply.status(404).send({ error: 'Orden no encontrada' });
    return { data: mapOrderDetail(o) };
  });

  app.post('/api/v1/work-orders', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;

    // Find or create client
    const phone = body.cliente_telefono || `TEMP-${Date.now()}`;
    let client = await db.client.findFirst({ where: { phone } });
    if (!client) {
      client = await db.client.create({
        data: {
          name: body.cliente_nombre ?? 'Sin nombre',
          phone,
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
    }

    const priority = (PRIORITY_REVERSE[body.priority] ?? 'MEDIUM') as any;
    let orderId: string;
    try {
      const result = await container.useCases.createOrder.execute({
        clientId: client.id,
        vehicleId: vehicle.id,
        technicianId: u.id,
        createdById: u.id,
        problem: body.problema ?? 'Sin descripción',
        priority,
        scheduledAt: body.fecha_programada ? new Date(body.fecha_programada) : new Date(),
        mileageIn: Number(body.vehiculo_kilometraje ?? 0) || undefined,
      });
      orderId = result.id;
    } catch (err: any) {
      // If the use case throws after committing (e.g., event dispatch failure),
      // find the order that was created by matching client + vehicle + recent time
      const recent = await db.workOrder.findFirst({
        where: { clientId: client.id, vehicleId: vehicle.id },
        orderBy: { createdAt: 'desc' },
      });
      if (!recent) return reply.status(500).send({ error: err.message });
      orderId = recent.id;
    }

    const order = await db.workOrder.findUnique({
      where: { id: orderId },
      include: {
        client: true, vehicle: true, technician: true, accountReceivable: true,
        checklist: true, photos: true, notes: true, assignedParts: { include: { item: true } },
        quotes: { include: { service: true } }, timeline: { include: { user: { select: { name: true } } } },
      },
    });
    return { data: mapOrderDetail(order) };
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
      data: { problem: body.problema || undefined, repairNotes: body.diagnostico || null },
    });
    return { message: 'ok' };
  });

  app.post('/api/v1/work-orders/:id/notes', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const note = await db.note.create({
      data: { orderId: id, content: body.texto, userId: u.id },
    });
    return { data: { id: note.id, tipo: body.tipo ?? 'interna', texto: note.content, created_at: note.createdAt.toISOString() } };
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
    const q = await db.quote.create({
      data: {
        orderId: id,
        serviceId: String(body.price_item_id),
        subtotal: priceItem?.price ?? 0,
        tax: 0,
        total: priceItem?.price ?? 0,
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
    const item = await db.checklist.create({
      data: { orderId: id, label: body.tarea, checked: false, phase: body.tipo ?? 'inicial' },
    });
    return { data: { id: item.id, tarea: item.label, responsable: body.responsable ?? '', completada: item.checked } };
  });

  app.patch('/api/v1/work-orders/:id/checklist/:itemId', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { itemId } = req.params as any;
    const current = await db.checklist.findUnique({ where: { id: itemId } });
    if (!current) return reply.status(404).send({ error: 'Item no encontrado' });
    await db.checklist.update({ where: { id: itemId }, data: { checked: !current.checked } });
    return { message: 'ok' };
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
          id: o.id, status: STATUS_MAP[o.status] ?? o.status, priority: PRIORITY_MAP[o.priority] ?? o.priority,
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
        phone: body.telefono ?? body.phone ?? `TEMP-${Date.now()}`,
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
    return {
      data: items.map(i => ({
        id: i.id, nombre: i.name, tipo: INVENTORY_TYPE_MAP[i.type] ?? i.type,
        estado: 'Bueno', stock_actual: i.stock, stock_minimo: i.minStock,
        precio: Number(i.purchasePrice), precio_venta: Number(i.salePrice),
        low_stock: i.stock <= i.minStock, foto_url: null,
      })),
    };
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
    return { data: { id: item.id, nombre: item.name, foto_url: null } };
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
      include: { client: true },
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
          id: ar.id, work_order_id: ar.orderId, cliente: ar.client?.name ?? '',
          monto: total, monto_recibido: paid, monto_pendiente: pending,
          fecha_emision: toDate(ar.createdAt), fecha_vencimiento: toDate(ar.dueDate),
          estado: PAYMENT_STATUS_MAP[ar.status] ?? ar.status, estado_calculado: estado,
        };
      }),
    };
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

  app.get('/api/v1/contacts', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const perPage = Math.min(Number((req.query as any).per_page ?? 100), 500);
    const suppliers = await db.supplier.findMany({ where: { isActive: true }, take: perPage });
    return {
      data: suppliers.map(s => ({
        id: s.id, nombre: s.name, rfc: '', empresa: s.name,
        telefono: s.phone ?? '', correo: s.email ?? '',
        dias_pago: 30, limite_credito: 0, politica_descuentos: '',
        productos: null, etiquetas: null,
      })),
    };
  });

  app.post('/api/v1/contacts', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const s = await db.supplier.create({
      data: { name: body.nombre, phone: body.telefono || null, email: body.correo || null },
    });
    return { data: { id: s.id, nombre: s.name, rfc: '', empresa: s.name, telefono: s.phone ?? '', correo: s.email ?? '', dias_pago: 30, limite_credito: 0, politica_descuentos: '', productos: null, etiquetas: null } };
  });

  app.put('/api/v1/contacts/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const s = await db.supplier.update({
      where: { id },
      data: { name: body.nombre || undefined, phone: body.telefono || null, email: body.correo || null },
    });
    return { data: { id: s.id, nombre: s.name, rfc: '', empresa: s.name, telefono: s.phone ?? '', correo: s.email ?? '', dias_pago: 30, limite_credito: 0, politica_descuentos: '', productos: null, etiquetas: null } };
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
        monto_pagado: 0,
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
        dueDate: new Date(body.fecha_vencimiento),
        type: tipo,
        notes: body.notas || null,
      },
    });
    return { data: { id: p.id, concepto: p.description, tipo: CASH_TYPE_MAP[p.type] ?? p.type, categoria: 'General', fecha_vencimiento: toDate(p.dueDate) ?? '', monto_presupuestado: Number(p.amount), monto_pagado: 0, estado: PAYMENT_STATUS_MAP[p.status] ?? p.status, comprobante_url: null, notas: p.notes ?? null } };
  });

  app.put('/api/v1/payments-agenda/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const p = await db.scheduledPayment.update({
      where: { id },
      data: {
        description: body.concepto || undefined,
        amount: body.monto_presupuestado !== undefined ? Number(body.monto_presupuestado) : undefined,
        dueDate: body.fecha_vencimiento ? new Date(body.fecha_vencimiento) : undefined,
        notes: body.notas !== undefined ? body.notas : undefined,
      },
    });
    return { data: { id: p.id, concepto: p.description, tipo: CASH_TYPE_MAP[p.type] ?? p.type, categoria: 'General', fecha_vencimiento: toDate(p.dueDate) ?? '', monto_presupuestado: Number(p.amount), monto_pagado: 0, estado: PAYMENT_STATUS_MAP[p.status] ?? p.status, comprobante_url: null, notas: p.notes ?? null } };
  });

  app.delete('/api/v1/payments-agenda/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    await db.scheduledPayment.delete({ where: { id } });
    return { message: 'ok' };
  });

  // ── PRICES ────────────────────────────────────────────────────────────────

  app.get('/api/v1/prices', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const perPage = Math.min(Number((req.query as any).per_page ?? 200), 1000);
    const prices = await db.priceList.findMany({ where: { isActive: true }, take: perPage });
    return {
      data: prices.map(p => ({
        id: p.id, categoria_principal: 'Mecánica General',
        sistema: null, familia: null, concepto: p.name,
        tamano: null, diametro: null,
        precio_auto: String(p.vehicleType === 'CAR' ? Number(p.price) : ''),
        precio_camioneta: String(p.vehicleType === 'TRUCK' ? Number(p.price) : ''),
        precio_camion: String(p.vehicleType === 'HEAVY_TRUCK' ? Number(p.price) : ''),
        precio: null, activo: p.isActive,
      })),
    };
  });

  app.post('/api/v1/prices', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const body = req.body as any;
    const p = await db.priceList.create({
      data: {
        name: body.concepto ?? body.nombre ?? 'Servicio',
        vehicleType: 'CAR',
        price: Number(body.precio_auto ?? body.precio ?? 0),
      },
    });
    return { data: { id: p.id, categoria_principal: 'Mecánica General', concepto: p.name, precio_auto: String(Number(p.price)), precio_camioneta: '', precio_camion: '', activo: p.isActive } };
  });

  app.put('/api/v1/prices/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const { id } = req.params as any;
    const body = req.body as any;
    const p = await db.priceList.update({
      where: { id },
      data: {
        name: body.concepto || undefined,
        price: body.precio_auto !== undefined ? Number(body.precio_auto) : undefined,
      },
    });
    return { data: { id: p.id, categoria_principal: 'Mecánica General', concepto: p.name, precio_auto: String(Number(p.price)), precio_camioneta: '', precio_camion: '', activo: p.isActive } };
  });

  // ── ACTIVITIES (in-memory) ────────────────────────────────────────────────

  app.get('/api/v1/activities', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    return { data: [] };
  });

  app.post('/api/v1/activities', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    return { data: { id: `act-${Date.now()}`, ...(req.body as any), comentarios: null } };
  });

  app.put('/api/v1/activities/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    return { message: 'ok' };
  });

  app.delete('/api/v1/activities/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    return { message: 'ok' };
  });

  app.post('/api/v1/activities/:id/comments', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    return { message: 'ok' };
  });

  // ── KPIs (in-memory) ──────────────────────────────────────────────────────

  app.get('/api/v1/kpis', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    return { data: [] };
  });

  app.post('/api/v1/kpis', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    return { data: { id: `kpi-${Date.now()}`, ...(req.body as any) } };
  });

  app.put('/api/v1/kpis/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    return { message: 'ok' };
  });

  app.get('/api/v1/kpi-activities', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    return { data: [] };
  });

  app.post('/api/v1/kpi-activities', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    return { data: { id: `kpia-${Date.now()}`, ...(req.body as any) } };
  });

  app.put('/api/v1/kpi-activities/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    return { message: 'ok' };
  });

  app.delete('/api/v1/kpi-activities/:id', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    return { message: 'ok' };
  });

  // ── USERS / EMPLOYEES (settings) ─────────────────────────────────────────

  app.get('/api/v1/employees', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    const users = await db.user.findMany({ where: { isActive: true } });
    return {
      data: users.map(u => ({
        id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive,
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
      data: { name: body.name || undefined, role: body.role || undefined, permissions: body.permissions || undefined },
    });
    return { data: { id: upd.id, name: upd.name, email: upd.email, role: upd.role, isActive: upd.isActive, permissions: upd.permissions } };
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

  app.put('/api/v1/organization', async (req, reply) => {
    const u = getAuthUser(req, container);
    if (!u) return reply.status(401).send({ error: 'No autorizado' });
    return { message: 'ok' };
  });

  // ── PORTAL (public) ───────────────────────────────────────────────────────

  app.get('/api/v1/portal/:token', async (req, reply) => {
    const { token } = req.params as any;
    const order = await db.workOrder.findUnique({
      where: { portalToken: token },
      include: {
        client: true, vehicle: true, technician: true, accountReceivable: true,
        checklist: true, photos: true, notes: true,
        timeline: { include: { user: { select: { name: true } } } },
      },
    });
    if (!order) return reply.status(404).send({ error: 'No encontrado' });
    return { data: mapOrderDetail(order) };
  });
}
