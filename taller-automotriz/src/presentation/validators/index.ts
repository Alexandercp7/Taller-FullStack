import { z } from 'zod';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { OrderPhase } from '../../domain/enums/order-phase.enum';
import { Priority } from '../../domain/enums/priority.enum';
import { OrderType } from '../../domain/enums/order-type.enum';
import { InventoryType } from '../../domain/enums/inventory-type.enum';
import { MovementType } from '../../domain/enums/movement-type.enum';
import { CashType } from '../../domain/enums/cash-type.enum';
import { PaymentMethod } from '../../domain/enums/payment-method.enum';
import { TaskTag } from '../../domain/enums/task-tag.enum';
import { TaskStatus } from '../../domain/enums/task-status.enum';
import { PhotoPhase } from '../../domain/enums/photo-phase.enum';
import { VehicleType } from '../../domain/enums/vehicle-type.enum';

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8),
});

// ─── Orders ────────────────────────────────────────────────────────────────────
export const createOrderSchema = z.object({
  clientId: z.string(),
  vehicleId: z.string(),
  technicianId: z.string(),
  problem: z.string().min(3),
  priority: z.nativeEnum(Priority).optional(),
  type: z.nativeEnum(OrderType).optional(),
  scheduledAt: z.coerce.date(),
  mileageIn: z.number().int().positive().optional(),
});

export const orderFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
  technicianId: z.string().optional(),
  clientId: z.string().optional(),
  priority: z.nativeEnum(Priority).optional(),
  search: z.string().optional(),
});

export const changeOrderStatusSchema = z.object({
  orderId: z.string(),
  newStatus: z.nativeEnum(OrderStatus),
});

export const revertPhaseSchema = z.object({
  orderId: z.string(),
  targetPhase: z.nativeEnum(OrderPhase),
});

export const closeOrderSchema = z.object({
  orderId: z.string(),
  totalAmount: z.number().positive(),
  dueDate: z.coerce.date().optional(),
});

export const addNoteSchema = z.object({
  orderId: z.string(),
  content: z.string().min(1),
});

// ─── Clients ───────────────────────────────────────────────────────────────────
export const createClientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  notes: z.string().optional(),
});

export const clientSearchSchema = z.object({
  query: z.string().min(1),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const clientListSchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Vehicles ──────────────────────────────────────────────────────────────────
export const createVehicleSchema = z.object({
  clientId: z.string(),
  plates: z.string().min(5),
  brand: z.string().min(2),
  model: z.string().min(1),
  year: z.number().int().min(1950).max(new Date().getFullYear() + 1),
  color: z.string().optional(),
  vin: z.string().min(6).optional(),
  type: z.nativeEnum(VehicleType).optional(),
});

export const vehicleFiltersSchema = z.object({
  clientId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateVehicleSchema = z.object({
  vehicleId: z.string(),
  plates: z.string().min(5).optional(),
  brand: z.string().min(2).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1950).max(new Date().getFullYear() + 1).optional(),
  color: z.string().nullable().optional(),
  type: z.nativeEnum(VehicleType).optional(),
});

// ─── Inventory ────────────────────────────────────────────────────────────────
export const createInventoryItemSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  sku: z.string().optional(),
  type: z.nativeEnum(InventoryType),
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(0),
  purchasePrice: z.number().positive(),
  salePrice: z.number().positive(),
  supplierId: z.string().optional(),
  location: z.string().optional(),
});

export const assignPartSchema = z.object({
  orderId: z.string(),
  itemId: z.string(),
  quantity: z.number().int().positive(),
});

export const stockMovementSchema = z.object({
  itemId: z.string(),
  type: z.nativeEnum(MovementType),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
});

export const updateInventoryItemSchema = z.object({
  itemId: z.string(),
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  type: z.nativeEnum(InventoryType).optional(),
  minStock: z.number().int().min(0).optional(),
  purchasePrice: z.number().positive().optional(),
  salePrice: z.number().positive().optional(),
  supplierId: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
});

export const movementHistorySchema = z.object({
  itemId: z.string(),
});

// ─── Finance ──────────────────────────────────────────────────────────────────
export const cashEntrySchema = z.object({
  type: z.nativeEnum(CashType),
  amount: z.number().positive(),
  description: z.string().min(3),
  method: z.nativeEnum(PaymentMethod),
  orderId: z.string().optional(),
  date: z.coerce.date().optional(),
});

export const arPaymentSchema = z.object({
  accountId: z.string(),
  amount: z.number().positive(),
  method: z.nativeEnum(PaymentMethod),
  notes: z.string().optional(),
});

export const dateRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const createTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  tag: z.nativeEnum(TaskTag),
  priority: z.nativeEnum(Priority),
  assignedTo: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

export const taskFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(TaskStatus).optional(),
  assignedTo: z.string().optional(),
});

// ─── Photos ───────────────────────────────────────────────────────────────────
export const uploadPhotoSchema = z.object({
  orderId: z.string(),
  phase: z.nativeEnum(PhotoPhase),
  fileName: z.string(),
  contentType: z.string(),
  caption: z.string().optional(),
});

// ─── Survey ───────────────────────────────────────────────────────────────────
export const surveySchema = z.object({
  orderId: z.string(),
  rating: z.number().int().min(1).max(5),
  wouldRecommend: z.boolean(),
  comment: z.string().optional(),
});

// ─── Users ────────────────────────────────────────────────────────────────────
import { UserRole } from '../../domain/enums/user-role.enum';

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole),
  permissions: z.array(z.string()).optional(),
});

export const assignPermissionsSchema = z.object({
  userId: z.string(),
  permissions: z.array(z.string()),
});

// ─── Contacts (Suppliers) ─────────────────────────────────────────────────────
export const createContactSchema = z.object({
  nombre: z.string().min(2),
  empresa: z.string().optional(),
  telefono: z.string().optional(),
  correo: z.string().email().optional(),
  rfc: z.string().optional(),
  notes: z.string().optional(),
  diasPago: z.number().int().min(0).optional(),
  limiteCredito: z.number().min(0).optional(),
  politicaDescuentos: z.string().optional(),
});

export const updateContactSchema = createContactSchema.partial().extend({
  id: z.string(),
});

// ─── Scheduled Payments ───────────────────────────────────────────────────────
export const createScheduledPaymentSchema = z.object({
  description: z.string().min(3),
  amount: z.number().positive(),
  dueDate: z.coerce.date(),
  type: z.nativeEnum(CashType),
  supplierId: z.string().optional(),
  clientId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateScheduledPaymentSchema = z.object({
  id: z.string(),
  description: z.string().min(3).optional(),
  amount: z.number().positive().optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

// ─── Price Catalog ────────────────────────────────────────────────────────────
export const createPriceItemSchema = z.object({
  categoriaPrincipal: z.string().min(1),
  sistema: z.string().optional(),
  familia: z.string().optional(),
  concepto: z.string().optional(),
  tamano: z.string().optional(),
  diametro: z.string().optional(),
  precioAuto: z.string().optional(),
  precioCamioneta: z.string().optional(),
  precioCamion: z.string().optional(),
  precio: z.string().optional(),
});

export const updatePriceItemSchema = createPriceItemSchema.partial().extend({
  id: z.string(),
});

// ─── Activities ───────────────────────────────────────────────────────────────
export const createActivitySchema = z.object({
  titulo: z.string().min(2),
  descripcion: z.string().optional(),
  prioridad: z.enum(['Baja', 'Normal', 'Alta']),
  etiqueta: z.string().optional(),
  fechaLimite: z.string().optional(),
  estado: z.enum(['Pendiente', 'En Proceso', 'Completada', 'Cancelada']).default('Pendiente'),
  asignadoA: z.string().optional(),
});

export const updateActivitySchema = createActivitySchema.partial().extend({
  id: z.string(),
});

export const addCommentSchema = z.object({
  activityId: z.string(),
  texto: z.string().min(1),
});

// ─── KPI Employees ────────────────────────────────────────────────────────────
const ROLE_TYPES = [
  'Líder Admin', 'Director General', 'Asesor de Servicio',
  'Líder Técnico', 'Técnico Automotriz', 'Personal de Apoyo',
] as const;

export const createEmployeeSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  email: z.string().email(),
  telefono: z.string().optional(),
  role: z.enum(ROLE_TYPES),
  fotoUrl: z.string().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  id: z.string(),
});

// ─── KPI Objectives ───────────────────────────────────────────────────────────
export const createKpiSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  roleResponsable: z.enum(ROLE_TYPES),
  meta: z.number().positive(),
  progreso: z.number().min(0).max(100).default(0),
  periodo: z.string().min(1),
  fechaInicio: z.string(),
  fechaFin: z.string(),
});

export const updateKpiSchema = createKpiSchema.partial().extend({
  id: z.string(),
});

// ─── KPI Activities (per-role Kanban) ─────────────────────────────────────────
export const createKpiActivitySchema = z.object({
  titulo: z.string().min(2),
  descripcion: z.string().optional(),
  roleAsignado: z.enum(ROLE_TYPES),
  prioridad: z.enum(['Baja', 'Normal', 'Alta']).default('Normal'),
  tags: z.array(z.string()).default([]),
  empleadoAsignado: z.string().optional(),
  fechaVencimiento: z.string().optional(),
});

export const updateKpiActivitySchema = createKpiActivitySchema.partial().extend({
  id: z.string(),
  status: z.enum(['Pendiente', 'En Proceso', 'Completada', 'Cancelada']).optional(),
});

// ─── Organization ─────────────────────────────────────────────────────────────
export const updateOrganizationSchema = z.object({
  mision: z.string().optional(),
  vision: z.string().optional(),
  valores: z.array(z.string()).optional(),
});
