# Taller Automotriz — Sistema de Gestión

Backend API para la gestión integral de un taller automotriz. Construido con **Node.js + TypeScript** siguiendo **Clean Architecture** y principios **DDD (Domain-Driven Design)**. Expone una API **tRPC** tipo-segura.

---

## Tabla de contenidos

- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Módulos del negocio](#módulos-del-negocio)
- [Base de datos](#base-de-datos)
- [Requisitos previos](#requisitos-previos)
- [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Roles y permisos](#roles-y-permisos)
- [Flujos principales](#flujos-principales)
- [Testing](#testing)
- [Docker](#docker)
- [Despliegue](#despliegue)

---

## Stack tecnológico

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| Runtime | Node.js | 20 (Alpine) |
| Lenguaje | TypeScript | 5.4.5 |
| Framework HTTP | Fastify | 4.27.0 |
| API layer | tRPC | 10.45.2 |
| ORM | Prisma | 5.14.0 |
| Base de datos | PostgreSQL | 16 |
| Cache / Cola | Redis | 7 |
| Cola de trabajos | BullMQ | latest |
| Validación | Zod | 3.23.8 |
| Hash contraseñas | Argon2 | latest |
| Tokens | jsonwebtoken (JWT) | latest |
| Almacenamiento | AWS S3 / Cloudflare R2 | — |
| Emails | Resend | latest |
| WhatsApp | Twilio | latest |
| Push notifications | Expo | latest |
| Generación PDFs | PDFKit | latest |
| Logging | Pino | latest |
| Tests | Vitest | 1.6.0 |

---

## Arquitectura

El proyecto sigue **Clean Architecture** con separación estricta en cuatro capas. Las dependencias solo apuntan hacia adentro: presentación → aplicación → dominio. La infraestructura implementa los puertos que el dominio define.

```
src/
├── domain/              # Lógica de negocio pura — sin dependencias externas
│   ├── entities/        # Entidades del dominio
│   ├── value-objects/   # Objetos de valor (Money, Email, VIN, etc.)
│   ├── services/        # Servicios de dominio (state machine, calculadoras)
│   ├── events/          # Eventos de dominio
│   ├── errors/          # Errores de dominio con semántica de negocio
│   └── types/           # Tipos compartidos (enums, filtros, paginación)
│
├── application/         # Casos de uso — orquesta el dominio
│   ├── use-cases/       # 34 casos de uso agrupados por módulo
│   ├── ports/           # Interfaces (repositorios, servicios externos)
│   └── dtos/            # Objetos de entrada/salida por caso de uso
│
├── infrastructure/      # Implementaciones concretas de los puertos
│   ├── persistence/     # Repositorios Prisma + mappers
│   ├── adapters/        # S3, JWT, Argon2, Redis, PDFKit, Resend, Twilio, NHTSA
│   ├── queue/           # BullMQ workers (notificaciones, alertas de stock)
│   └── config/          # env.ts, logger.ts, redis.ts, container.ts
│
├── presentation/        # Capa de entrada — routers y validadores tRPC
│   ├── routers/         # 8 routers (auth, orders, inventory, clients, etc.)
│   └── validators/      # Esquemas Zod por módulo
│
└── shared/              # Utilidades transversales
```

### Principios aplicados

- **Domain-Driven Design**: Entidades ricas, value objects, eventos de dominio, bounded context único.
- **Ports & Adapters**: El dominio define interfaces (`IOrderRepository`, `IHasher`). La infraestructura las implementa. Los tests usan repositorios en memoria.
- **State Machine**: `OrderStateMachine` valida cada transición de estado de una orden, haciendo imposibles transiciones inválidas.
- **Inversión de dependencias**: `container.ts` conecta interfaces con implementaciones concretas en un solo lugar.
- **Errores semánticos**: `InvalidStateTransitionError`, `InsufficientStockError`, etc. — nunca errores genéricos.

---

## Módulos del negocio

### Órdenes de trabajo (`WorkOrders`)
Núcleo del sistema. Una orden representa el ciclo completo de un vehículo en el taller.

**Estados posibles:**
```
SCHEDULED → IN_PROGRESS → COMPLETED → DELIVERED → ARCHIVED
                ↕               ↕
             ON_HOLD         WARRANTY
             DELAYED
```

**Fases de reparación:** `DIAGNOSIS → PARTS → APPROVAL → REPAIR → QUALITY_CONTROL`

**Funcionalidades:**
- Creación con código autogenerado (`WO-0001`, `WO-0002`, …)
- Cambio de estado con validación por máquina de estados
- Cierre de orden que genera automáticamente cuenta por cobrar
- Registro de timeline completo (cada evento queda registrado)
- Portal cliente: token de acceso público para que el cliente vea el estado
- Subida de fotos por fase (recepción, diagnóstico, reparación, calidad)
- Reversión de fase con justificación
- Cotizaciones con generación de PDF

### Inventario (`Inventory`)
- Catálogo de ítems con tipos: `TOOL`, `CONSUMABLE`, `EQUIPMENT`, `SALE_PART`
- Control de stock con stock mínimo configurable
- Asignación de piezas a órdenes (deduce stock automáticamente)
- Registro manual de movimientos (entrada, salida, ajuste)
- Alertas automáticas cuando el stock cae bajo el mínimo (BullMQ)
- Búsqueda con filtros y paginación

### Clientes (`Clients`)
- Etiquetado automático: `NEW`, `FREQUENT`, `WITH_DEBT`
- Historial de vehículos por cliente
- Validación de eliminación (no se puede eliminar con órdenes activas)
- Decodificación de VIN con NHTSA API (con caché Redis)
- Verificación de recalls de vehículos

### Finanzas (`Finance`)
- **Cuentas por cobrar** (`AccountsReceivable`): se crean al cerrar una orden
- **Pagos**: aplica pagos parciales o totales; calcula balances con precisión de centavos (`Money` value object)
- **Caja**: registro de entradas y salidas con método de pago (efectivo, transferencia, tarjeta)
- **Reportes financieros**: montos pendientes, cobrados, gastos
- **KPIs**: indicadores clave de desempeño del taller

### Usuarios (`Users`)
- Roles: `ADMIN`, `MANAGER`, `TECHNICIAN`, `RECEPTIONIST`
- Asignación de permisos granulares por usuario
- Autenticación con JWT (access token + refresh token)
- Hash de contraseñas con Argon2

### Tareas (`Tasks`)
- Tareas administrativas, técnicas, comerciales y financieras
- Estados: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- Etiquetas: `ADMINISTRATIVE`, `TECHNICAL`, `COMMERCIAL`, `FINANCIAL`, `OTHER`
- Prioridades: `HIGH`, `MEDIUM`, `LOW`

### Portal cliente
- Acceso público por token (sin autenticación)
- Muestra estado actual de la orden, fotos y timeline
- Encuesta de satisfacción al finalizar

---

## Base de datos

**23 tablas** en PostgreSQL gestionadas con Prisma:

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios del sistema con roles |
| `clients` | Clientes del taller |
| `vehicles` | Vehículos de clientes |
| `work_orders` | Órdenes de trabajo (tabla principal) |
| `inventory_items` | Catálogo de piezas y herramientas |
| `stock_movements` | Historial de movimientos de stock |
| `assigned_parts` | Piezas asignadas a una orden |
| `photos` | Fotos por fase de la orden |
| `timeline_entries` | Log inmutable de eventos por orden |
| `notes` | Notas en órdenes |
| `checklists` | Listas de verificación |
| `quotes` | Cotizaciones |
| `price_lists` | Listas de precios por tipo de vehículo |
| `accounts_receivable` | Cuentas por cobrar generadas al cierre |
| `accounts_payable` | Cuentas por pagar a proveedores |
| `cash_entries` | Movimientos de caja |
| `payments` | Pagos aplicados a cuentas |
| `scheduled_payments` | Pagos programados futuros |
| `suppliers` | Proveedores |
| `tasks` | Tareas del equipo |
| `appointments` | Citas agendadas |
| `surveys` | Encuestas de satisfacción |
| `custody_pieces` | Piezas del cliente que quedan en custodia |

---

## Requisitos previos

- **Node.js** >= 20
- **Docker** y **Docker Compose** (para PostgreSQL y Redis)
- **npm** >= 10

---

## Instalación y puesta en marcha

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd taller-automotriz
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores (ver sección Variables de entorno)
```

### 4. Levantar servicios con Docker

```bash
docker-compose up -d
```

Esto levanta:
- PostgreSQL en `localhost:5432` (producción/desarrollo)
- PostgreSQL en `localhost:5433` (tests)
- Redis en `localhost:6379`

### 5. Ejecutar migraciones y generar el cliente Prisma

```bash
npm run db:generate
npm run db:migrate
```

### 6. Cargar datos iniciales (seed)

```bash
npm run db:seed
```

### 7. Iniciar en modo desarrollo

```bash
npm run dev
```

El servidor arranca en `http://localhost:3000` con hot reload.

---

## Variables de entorno

Crear un archivo `.env` en la raíz con las siguientes variables:

```env
# Servidor
NODE_ENV=development
PORT=3000

# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/taller_automotriz"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="tu-secreto-muy-largo-y-aleatorio"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Almacenamiento S3 / Cloudflare R2
S3_ENDPOINT="https://tu-account.r2.cloudflarestorage.com"
S3_BUCKET="taller-automotriz"
S3_ACCESS_KEY_ID="tu-access-key"
S3_SECRET_ACCESS_KEY="tu-secret-key"
S3_REGION="auto"

# Emails (Resend)
RESEND_API_KEY="re_xxxxxxxxx"
RESEND_FROM="noreply@tudominio.com"

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxx"
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"

# Push notifications (Expo) — opcional
EXPO_ACCESS_TOKEN="tu-expo-token"

# Google OAuth — opcional
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"
```

---

## Scripts disponibles

```bash
npm run dev              # Servidor con hot reload (tsx watch)
npm run build            # Compilar TypeScript a JavaScript
npm run start            # Ejecutar build de producción

npm run test             # Ejecutar tests (Vitest)
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Tests con reporte de cobertura

npm run db:generate      # Regenerar cliente Prisma
npm run db:migrate       # Aplicar migraciones en desarrollo
npm run db:migrate:prod  # Aplicar migraciones en producción
npm run db:seed          # Cargar datos de prueba
npm run db:studio        # Abrir Prisma Studio (GUI de la BD)
```

---

## Roles y permisos

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `ADMIN` | Administrador completo | Todo el sistema |
| `MANAGER` | Gerente del taller | Finanzas, reportes, usuarios |
| `TECHNICIAN` | Técnico mecánico | Órdenes asignadas, inventario |
| `RECEPTIONIST` | Recepcionista | Clientes, órdenes, citas |

Los permisos son granulares y se asignan por usuario mediante `AssignPermissionsUseCase`. Cada procedimiento tRPC protegido llama a `requirePermission()` en su middleware.

---

## Flujos principales

### Ciclo de vida de una orden

```
1. Recepción llama a CreateOrder
   → Estado: SCHEDULED, código WO-XXXX generado
   → Token portal generado para el cliente

2. Técnico abre la orden
   → Estado: IN_PROGRESS
   → Fase: DIAGNOSIS

3. Se registran causas de ingreso y fotos (fase INTAKE/DIAGNOSIS)

4. Se buscan y asignan piezas del inventario
   → Stock se deduce automáticamente
   → Si stock < mínimo → alerta BullMQ

5. Orden avanza por fases (PARTS → APPROVAL → REPAIR → QUALITY_CONTROL)

6. Orden completa → CloseOrder
   → Estado: COMPLETED
   → Se crea AccountReceivable con el total
   → Cliente recibe notificación

7. Cliente paga → RegisterARPayment
   → Balance actualizado con precisión de centavos
   → Entrada de caja registrada

8. Vehículo entregado
   → Estado: DELIVERED → ARCHIVED
```

### Asignación de piezas

```
AssignPartToOrderUseCase
  → Busca InventoryItem en repositorio
  → StockCalculator valida stock suficiente
  → Deduce stock, registra StockMovement
  → Si stock < minStock → emite StockBelowMinimum (event)
  → BullMQ encola alerta para notificar
```

### Autenticación

```
POST /trpc/auth.login
  → LoginUseCase verifica email/password con Argon2
  → Genera access token (JWT, 7d) + refresh token (JWT, 30d)
  → Almacena refresh token en Redis

POST /trpc/auth.refresh
  → RefreshTokenUseCase valida refresh token en Redis
  → Genera nuevo par de tokens
```

---

## Testing

La suite usa **Vitest** con repositorios en memoria para tests unitarios — no requiere base de datos real.

```bash
# Correr todos los tests
npm run test

# Ver cobertura
npm run test:coverage
```

**Estructura de tests:**
```
tests/
├── unit/
│   ├── domain/          # Tests de entidades, value objects, servicios de dominio
│   └── application/     # Tests de casos de uso con fakes en memoria
└── factories/           # Builders de datos de prueba
```

Los repositorios en memoria (`InMemoryOrderRepository`, etc.) implementan las mismas interfaces que los repositorios Prisma, garantizando que los tests validan la lógica de negocio sin acoplarse a la base de datos.

---

## Docker

El archivo `docker-compose.yml` levanta los servicios de infraestructura:

```yaml
services:
  postgres:      # Puerto 5432 — desarrollo
  postgres-test: # Puerto 5433 — tests
  redis:         # Puerto 6379
```

```bash
# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

---

## Despliegue

### Build de producción

```bash
npm run build
npm run db:migrate:prod
npm run start
```

### Con Docker (imagen propia)

El `Dockerfile` usa build multi-stage:
1. **deps**: Instala dependencias
2. **builder**: Compila TypeScript
3. **runner**: Imagen final mínima (Node 20 Alpine)

Al iniciar el contenedor ejecuta automáticamente las migraciones pendientes.

```bash
docker build -t taller-automotriz .
docker run -p 3000:3000 --env-file .env taller-automotriz
```

### Consideraciones de producción

- Configurar `NODE_ENV=production` para activar logging JSON con Pino
- Usar un secreto JWT largo y aleatorio (mínimo 64 caracteres)
- Configurar CORS en Fastify según el dominio del frontend
- Habilitar SSL/TLS (recomendado via proxy reverso: Nginx / Caddy)
- Monitorear la cola BullMQ (workers: `NotificationWorker`, `StockAlertWorker`, `CloseOrderWorker`)

---

## Estructura de archivos relevantes

```
taller-automotriz/
├── src/
│   ├── index.ts                         # Entry point
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── WorkOrder.ts
│   │   │   ├── Client.ts
│   │   │   ├── InventoryItem.ts
│   │   │   └── ...
│   │   ├── value-objects/
│   │   │   ├── Money.ts
│   │   │   ├── Email.ts
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── OrderStateMachine.ts
│   │   │   ├── PaymentCalculator.ts
│   │   │   └── ...
│   │   └── events/
│   │       ├── OrderCreated.ts
│   │       └── ...
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── orders/
│   │   │   ├── inventory/
│   │   │   ├── clients/
│   │   │   └── ...
│   │   └── ports/
│   │       ├── repositories/
│   │       └── services/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── PrismaOrderRepository.ts
│   │   │   └── ...
│   │   ├── adapters/
│   │   │   ├── JWTTokenProviderAdapter.ts
│   │   │   ├── Argon2HasherAdapter.ts
│   │   │   └── ...
│   │   └── config/
│   │       ├── container.ts             # Composición de dependencias
│   │       └── env.ts                   # Validación de variables de entorno
│   └── presentation/
│       ├── routers/
│       │   ├── orders.router.ts
│       │   └── ...
│       └── validators/
├── prisma/
│   ├── schema.prisma                    # Esquema de la BD
│   ├── migrations/                      # Migraciones versionadas
│   └── seed.ts                          # Datos iniciales
├── tests/
├── docker-compose.yml
├── Dockerfile
├── tsconfig.json
└── package.json
```
