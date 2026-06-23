# Taller Automotriz — Sistema de Gestión

Sistema de gestión integral para talleres automotrices. Monorepo compuesto por una API backend en Node.js/Fastify y una SPA en Angular 21.

---

## Estructura del repositorio

```
taller-automotriz/          # Backend API (Fastify + tRPC)
ProyectoSPA/                # Frontend SPA (Angular 21)
```

---

## Stack tecnológico

### Backend (`taller-automotriz/`)

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js 20 |
| Lenguaje | TypeScript 5.4 |
| Framework | Fastify 4 |
| Protocolo API | tRPC 10 |
| ORM | Prisma 5 |
| Base de datos | PostgreSQL 16 |
| Caché | En memoria (InMemoryCacheAdapter) |
| Validación | Zod 3 |
| Auth | JWT + Argon2 |
| Storage | AWS S3 / Cloudflare R2 |
| Email | Resend |
| WhatsApp | Twilio |
| Push | Expo Server SDK |
| PDF | PDFKit |
| Logs | Pino |
| Tests | Vitest |

### Frontend (`ProyectoSPA/`)

| Capa | Tecnología |
|------|-----------|
| Framework | Angular 21 (standalone) |
| Estilos | Tailwind CSS 4 |
| Componentes UI | Spartan NG |
| Iconos | ng-icons / Lucide |
| Exportación | jsPDF + XLSX |
| Tests | Vitest |

---

## Arquitectura

### Backend — Clean Architecture + DDD

```
src/
├── domain/          # Entidades, value objects, eventos, errores, enums
├── application/     # Casos de uso, puertos (interfaces), DTOs
├── infrastructure/  # Repositorios Prisma, adaptadores externos, workers
├── presentation/    # Routers tRPC, plugin REST, validadores Zod
└── shared/          # Either, Identifier, Logger, DomainEvent base
```

- **Inversión de dependencias**: el dominio define interfaces; la infraestructura las implementa.
- **State machine**: `OrderStateMachine` controla todas las transiciones de estado de órdenes.
- **Eventos de dominio**: despachados en-proceso vía `InProcessDomainEventDispatcher` (sin Redis ni workers externos).
- **Either monad**: manejo de errores sin excepciones en casos de uso.

### Frontend — Feature-based (Angular 21 standalone)

```
src/app/
├── features/        # Módulos de negocio (lazy-loaded)
├── layouts/         # Shells de rutas (main, auth, portal)
├── core/            # Auth, guards, servicios globales
└── shared/          # Componentes reutilizables
```

---

## Módulos de la aplicación

| Módulo | Descripción | Roles |
|--------|-------------|-------|
| Dashboard | Resumen de KPIs y órdenes recientes | Todos |
| Órdenes de trabajo | Gestión completa del flujo de reparación | Admin, Técnico, Recepcionista |
| Clientes y vehículos | CRUD de clientes y vehículos | Admin, Recepcionista |
| Inventario | Stock, movimientos, asignación de partes | Admin, Técnico |
| Finanzas | Cuentas por cobrar/pagar, caja, reportes | Admin, Gerente |
| Agenda de pagos | Pagos programados y vencimientos | Admin, Gerente |
| Lista de precios | Tarifas por tipo de vehículo | Admin, Gerente |
| KPIs | Métricas de negocio y productividad | Admin, Gerente |
| Actividades | Log de actividades del equipo | Todos |
| Contactos / Proveedores | Gestión de proveedores | Admin, Gerente |
| Configuración | Ajustes del sistema | Todos |
| Portal del cliente | Consulta pública de órdenes (token-based) | Público |

---

## Base de datos

23 tablas principales gestionadas con Prisma Migrate:

`users` · `clients` · `vehicles` · `work_orders` · `inventory_items` · `stock_movements` · `assigned_parts` · `photos` · `timeline_entries` · `checklists` · `notes` · `quotes` · `price_lists` · `accounts_receivable` · `accounts_payable` · `payments` · `cash_entries` · `scheduled_payments` · `suppliers` · `appointments` · `tasks` · `activities` · `surveys`

---

## API (tRPC)

15 routers con 60+ procedimientos:

`auth` · `orders` · `inventory` · `clients` · `finance` · `reception` · `portal` · `tasks` · `vehicles` · `users` · `kpis` · `prices` · `contacts` · `activities` · `paymentsAgenda`

---

## Requisitos previos

- Node.js 20+
- PostgreSQL 16
- npm

---

## Instalación y desarrollo

### 1. Clonar e instalar dependencias

```bash
# Backend
cd taller-automotriz
npm install

# Frontend
cd ../ProyectoSPA
npm install
```

### 2. Configurar variables de entorno

```bash
cd taller-automotriz
cp .env.example .env
# Editar .env con los valores de tu entorno
```

Variables requeridas:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/taller_automotriz
DIRECT_URL=postgresql://user:password@localhost:5432/taller_automotriz
JWT_SECRET=...
S3_ENDPOINT=...
S3_BUCKET=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

Variables opcionales:

```env
RESEND_API_KEY=...        # Email
TWILIO_ACCOUNT_SID=...    # WhatsApp
TWILIO_AUTH_TOKEN=...
EXPO_ACCESS_TOKEN=...     # Push notifications
```

### 3. Levantar servicios con Docker (opcional)

```bash
cd taller-automotriz
docker compose up -d   # Levanta PostgreSQL
```

### 4. Inicializar base de datos

```bash
cd taller-automotriz
npm run db:migrate     # Crear y aplicar migraciones
npm run db:seed        # Cargar datos de prueba
```

### 5. Iniciar en desarrollo

```bash
# Backend (puerto 3000)
cd taller-automotriz
npm run dev

# Frontend (puerto 4200)
cd ProyectoSPA
npm start
```

El frontend proxea las llamadas `/api` y `/trpc` al backend en `localhost:3000` via `proxy.conf.json`.

---

## Scripts disponibles

### Backend

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Compilar TypeScript a JS |
| `npm start` | Iniciar servidor en producción |
| `npm test` | Ejecutar tests |
| `npm run test:coverage` | Tests con reporte de cobertura |
| `npm run db:generate` | Regenerar Prisma Client |
| `npm run db:migrate` | Crear/aplicar migraciones |
| `npm run db:migrate:prod` | Aplicar migraciones en producción |
| `npm run db:seed` | Cargar datos de prueba |
| `npm run db:studio` | Abrir Prisma Studio (GUI DB) |

### Frontend

| Script | Descripción |
|--------|-------------|
| `npm start` | Servidor de desarrollo (puerto 4200) |
| `npm run build` | Build de producción |
| `npm run watch` | Build en modo watch |
| `npm test` | Ejecutar tests |

---

## Roles de usuario

| Rol | Acceso |
|-----|--------|
| `ADMIN` | Acceso completo a todos los módulos |
| `MANAGER` | Finanzas, KPIs, precios, agenda de pagos, contactos |
| `TECHNICIAN` | Órdenes de trabajo, inventario |
| `RECEPTIONIST` | Órdenes de trabajo, clientes y vehículos |

---

## Integraciones externas

| Servicio | Uso |
|----------|-----|
| AWS S3 / Cloudflare R2 | Almacenamiento de fotos y documentos |
| Resend | Envío de emails |
| Twilio | Mensajes de WhatsApp |
| Expo | Push notifications a app móvil |
| NHTSA API | Decodificación de VIN |
| CarQuery API | Catálogo de marcas/modelos/años |

---

## Despliegue en producción

```bash
# Backend
cd taller-automotriz
npm run build
npm run db:migrate:prod
npm start

# Frontend
cd ProyectoSPA
npm run build
# Servir dist/ con Nginx o similar
```

El backend incluye un `Dockerfile` multi-stage basado en Node.js 20 Alpine.
