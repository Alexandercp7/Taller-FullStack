# Guía de desarrollo — Orden para construir el sistema desde cero

Este documento explica en qué orden construir el sistema de gestión del taller automotriz partiendo de cero, y **por qué** ese orden importa. Cada etapa depende de las anteriores. Saltarse pasos o hacerlos en el orden equivocado produce acoplamiento innecesario, regresiones y re-escrituras costosas.

La arquitectura del proyecto es **Clean Architecture + DDD**. Su regla de oro es: **el dominio no depende de nada; todo lo demás depende del dominio**. Eso dicta el orden de construcción de forma natural.

---

## Índice

1. [Fundamentos del proyecto](#etapa-1--fundamentos-del-proyecto)
2. [Dominio — Value Objects](#etapa-2--dominio--value-objects)
3. [Dominio — Entidades](#etapa-3--dominio--entidades)
4. [Dominio — Errores y Eventos](#etapa-4--dominio--errores-y-eventos)
5. [Dominio — Servicios de dominio](#etapa-5--dominio--servicios-de-dominio)
6. [Aplicación — Puertos (interfaces)](#etapa-6--aplicación--puertos-interfaces)
7. [Aplicación — DTOs](#etapa-7--aplicación--dtos)
8. [Aplicación — Casos de uso](#etapa-8--aplicación--casos-de-uso)
9. [Tests unitarios](#etapa-9--tests-unitarios)
10. [Base de datos — Schema Prisma](#etapa-10--base-de-datos--schema-prisma)
11. [Infraestructura — Repositorios Prisma](#etapa-11--infraestructura--repositorios-prisma)
12. [Infraestructura — Adaptadores externos](#etapa-12--infraestructura--adaptadores-externos)
13. [Infraestructura — Cola de trabajos](#etapa-13--infraestructura--cola-de-trabajos)
14. [Infraestructura — Contenedor de dependencias](#etapa-14--infraestructura--contenedor-de-dependencias)
15. [Presentación — tRPC routers](#etapa-15--presentación--trpc-routers)
16. [Presentación — Validadores Zod](#etapa-16--presentación--validadores-zod)
17. [Entry point y configuración final](#etapa-17--entry-point-y-configuración-final)
18. [Resumen visual](#resumen-visual)

---

## Etapa 1 — Fundamentos del proyecto

### Qué hacer

1. Inicializar el repositorio Git y crear la estructura de carpetas vacía:
   ```
   src/domain/
   src/application/
   src/infrastructure/
   src/presentation/
   src/shared/
   tests/
   prisma/
   ```

2. Configurar `package.json` con las dependencias exactas del proyecto.

3. Configurar `tsconfig.json` con `strict: true`, paths absolutos y las opciones del compilador.

4. Crear `src/infrastructure/config/env.ts` con la validación de variables de entorno usando Zod. Este archivo se importa primero en el entry point y lanza error si falta una variable requerida.

5. Configurar **Docker Compose** con PostgreSQL y Redis para tener los servicios listos.

6. Crear `prisma/schema.prisma` con la configuración mínima (solo el datasource y generator al inicio).

### Por qué primero

Sin la configuración base, ningún otro paso puede ejecutarse. La estructura de carpetas **materializa la arquitectura**: si empiezas a escribir código antes de tenerla clara, los archivos acaban en lugares incorrectos y migrarlos después es costoso. El `tsconfig.json` estricto atrapa errores desde el primer archivo que escribas, no al final.

La validación de entorno (`env.ts`) va aquí porque es infraestructura de configuración, no lógica de negocio, y todo el proyecto la necesita desde el arranque.

---

## Etapa 2 — Dominio — Value Objects

### Qué hacer

Crear los **objetos de valor** en `src/domain/value-objects/`:

- `Money.ts` — manejo de dinero con precisión de centavos (aritmética entera, nunca `float`)
- `Email.ts` — validación de formato de email
- `Phone.ts` — validación de número de teléfono
- `VIN.ts` — validación de número de identificación de vehículo (17 caracteres)
- `OrderCode.ts` — formato `WO-0001`
- `Percentage.ts` — porcentajes entre 0 y 100
- `DateRange.ts` — rango de fechas con validación de coherencia

Cada value object es **inmutable** y valida en su constructor. Si el valor es inválido, lanza un `InvalidValueObjectError` (que crearás en la etapa 4).

### Por qué antes que las entidades

Los value objects son los ladrillos que usan las entidades. `WorkOrder` tiene un `Money` para el total. `Client` tiene un `Email` y un `Phone`. Si creas las entidades primero, usarías strings planos y perderías la validación y semántica que los value objects aportan. Reemplazarlos después implicaría tocar todas las entidades.

Además, los value objects no dependen de nada (ni de repositorios, ni de servicios, ni de otras entidades). Son el código más puro y estable del proyecto — empezar por ellos es empezar por lo más sólido.

---

## Etapa 3 — Dominio — Entidades

### Qué hacer

Crear las entidades en `src/domain/entities/`. Orden recomendado dentro de esta etapa:

**3a. Entidades independientes (sin relaciones entre sí):**
- `User.ts` — usuario del sistema con `UserRole`
- `InventoryItem.ts` — ítem con stock, precio, tipo
- `Task.ts` — tarea con estado y prioridad
- `CashEntry.ts` — entrada/salida de caja

**3b. Entidades con relaciones simples:**
- `Client.ts` — tiene `Email`, `Phone`, `ClientTag[]`
- `Vehicle.ts` — tiene `VIN`, pertenece a un `Client`
- `Quote.ts` — cotización con líneas y total (`Money`)

**3c. Entidades centrales (dependen de las anteriores):**
- `WorkOrder.ts` — la más compleja: tiene estado (`OrderStatus`), fase (`OrderPhase`), relación con `Client`, `Vehicle`, `User` (técnico), `Money` para el total
- `AccountReceivable.ts` — generada al cerrar una `WorkOrder`, tiene `Money` de balance

También definir aquí los **tipos y enums** en `src/domain/types/`:
- `OrderStatus`, `OrderPhase`, `OrderType`, `Priority`
- `VehicleType`, `PaymentMethod`, `PaymentStatus`
- `MovementType`, `InventoryType`, `CashType`
- `TaskStatus`, `TaskTag`, `PhotoPhase`, `ClientTag`, `UserRole`
- `PaginatedResult<T>`, `OrderFilters`, `TimelineEventRecord`

### Por qué en este orden

Las entidades con dependencias solo pueden construirse después de que sus dependencias existen. `WorkOrder` usa `Money`, `OrderStatus`, `Client`, `Vehicle` — si intentas escribirla antes, TypeScript no puede inferir nada.

Las entidades del dominio deben ser **ricas en comportamiento**, no simples contenedores de datos. `WorkOrder` debería tener métodos como `changeStatus()`, `assignTechnician()`, `addNote()`. Esto significa que el código de transición de estado vive en la entidad, no disperso en casos de uso. Eso es DDD.

---

## Etapa 4 — Dominio — Errores y Eventos

### Qué hacer

**Errores de dominio** en `src/domain/errors/`:
- `InvalidStateTransitionError` — transición de estado inválida en una orden
- `OrderAlreadyClosedError` — intentar cerrar una orden ya cerrada
- `InsufficientStockError` — stock insuficiente para asignar piezas
- `PaymentExceedsBalanceError` — el pago supera el balance pendiente
- `InvalidValueObjectError` — valor de un objeto de valor inválido
- `ClientHasActiveOrdersError` — intentar eliminar un cliente con órdenes activas

Cada error extiende `Error` con un `code` string y un `message` descriptivo.

**Eventos de dominio** en `src/domain/events/`:
- `OrderCreated`
- `OrderStatusChanged`
- `OrderClosed`
- `PartAssignedToOrder`
- `PaymentRegistered`
- `StockBelowMinimum`
- `PaymentDueSoon`

Cada evento es un objeto simple con los datos relevantes del momento en que ocurrió. No tienen comportamiento.

### Por qué en este momento

Los errores son necesarios desde los value objects (Etapa 2 lanza `InvalidValueObjectError`) y desde los servicios de dominio (Etapa 5 lanza `InvalidStateTransitionError`). Si los creas antes de las entidades, no sabes qué datos llevarán los errores. Si los creas después de los servicios, tendrás errores genéricos de TypeScript en lugar de errores de negocio.

Los eventos de dominio no son opcionales en DDD: son la forma en que el dominio comunica que algo importante ocurrió, sin acoplarse a quien lo escucha. `StockBelowMinimum` lo emite la entidad; la cola de trabajos lo procesa. Estos dos componentes nunca se conocen directamente.

---

## Etapa 5 — Dominio — Servicios de dominio

### Qué hacer

Crear los servicios de dominio en `src/domain/services/`:

- **`OrderStateMachine.ts`** — la pieza más importante del dominio
  - Define qué transiciones son válidas desde cada estado
  - Lanza `InvalidStateTransitionError` si la transición no existe
  - No tiene dependencias externas — es lógica pura

- **`PaymentCalculator.ts`**
  - Calcula balances con `Money` (sin flotantes)
  - Valida que el pago no exceda el balance pendiente
  - Lanza `PaymentExceedsBalanceError` si corresponde

- **`ClientTagger.ts`**
  - Determina el tag de un cliente basándose en su historial
  - `NEW` (primera orden), `FREQUENT` (>3 órdenes), `WITH_DEBT` (balance pendiente)

- **`StockCalculator.ts`**
  - Valida que hay stock suficiente
  - Calcula el nuevo stock tras una asignación o movimiento
  - Lanza `InsufficientStockError`

- **`QuoteCalculator.ts`**
  - Calcula el total de una cotización aplicando impuestos y descuentos
  - Usa `Money` y `Percentage`

### Por qué como servicio y no dentro de la entidad

Un servicio de dominio encapsula lógica que involucra múltiples entidades o que no encaja naturalmente en una sola. `OrderStateMachine` necesita conocer todos los estados posibles globalmente — no es responsabilidad de la entidad `WorkOrder` saber qué otros estados existen. `ClientTagger` necesita el historial completo de órdenes del cliente — eso no vive en la entidad `Client`.

### Por qué antes de los casos de uso

Los casos de uso orquestan servicios de dominio. `ChangeOrderStatusUseCase` llama a `OrderStateMachine.validate()`. Si el servicio no existe, el caso de uso no puede completarse. Construir el servicio primero también lo hace testeable de forma aislada.

---

## Etapa 6 — Aplicación — Puertos (interfaces)

### Qué hacer

Crear las **interfaces** que definen qué necesita la aplicación del mundo exterior, en `src/application/ports/`:

**Repositorios** (`ports/repositories/`):
- `IOrderRepository` — `findById`, `findAll(filters)`, `save`, `delete`
- `IClientRepository`
- `IInventoryRepository`
- `IUserRepository`
- `IAccountReceivableRepository`
- `ICashEntryRepository`
- `ITaskRepository`
- … (uno por cada agregado principal)

**Servicios** (`ports/services/`):
- `IHasher` — `hash(plain)`, `compare(plain, hash)`
- `ITokenProvider` — `sign(payload)`, `verify(token)`
- `ICache` — `get(key)`, `set(key, value, ttl)`, `delete(key)`
- `IFileStorage` — `upload(file)`, `getUrl(key)`, `delete(key)`
- `IPDFGenerator` — `generate(template, data): Buffer`
- `IJobQueue` — `enqueue(jobName, data)`
- `INotificationSender` — `sendEmail(...)`, `sendWhatsApp(...)`, `sendPush(...)`
- `IVinDecoder` — `decode(vin)`
- `IRecallChecker` — `check(vin)`

### Por qué antes de los casos de uso y antes de la infraestructura

Los puertos son el **contrato** entre la aplicación y la infraestructura. Al definirlos primero:

1. Los **casos de uso** pueden escribirse referenciando interfaces, no implementaciones concretas. El caso de uso nunca importa `PrismaOrderRepository` — importa `IOrderRepository`. Esto es la inversión de dependencias.

2. La **infraestructura** sabe exactamente qué tiene que implementar. Si creas el repositorio Prisma sin haber definido la interfaz, probablemente implementarás métodos que la aplicación no necesita y faltarán los que sí necesita.

3. Los **tests** pueden usar repositorios en memoria que también implementan la misma interfaz, sin tocar la base de datos.

---

## Etapa 7 — Aplicación — DTOs

### Qué hacer

Crear los **Data Transfer Objects** en `src/application/dtos/`:

Un DTO por cada caso de uso o grupo relacionado:
- `CreateOrderDto` — datos de entrada para crear una orden
- `CreateOrderResult` — datos de salida (id, código, estado inicial)
- `ListOrdersDto` — filtros de búsqueda (estado, técnico, fechas, página)
- `PaginatedOrdersResult` — lista paginada de resúmenes de órdenes
- `CloseOrderDto`, `ChangeStatusDto`, `RegisterPaymentDto`, etc.

Los DTOs son interfaces TypeScript simples — sin lógica, sin validación (esa es responsabilidad de Zod en la presentación).

### Por qué antes de los casos de uso

Los casos de uso reciben un DTO como entrada y devuelven un DTO como salida. Si no existen, el caso de uso no puede tener firma. Definirlos primero obliga a pensar con precisión en qué datos necesita cada operación y qué devuelve — una disciplina que evita añadir campos innecesarios después.

---

## Etapa 8 — Aplicación — Casos de uso

### Qué hacer

Crear los casos de uso en `src/application/use-cases/`, agrupados por módulo. Orden recomendado:

**8a. Autenticación (base de todo):**
- `LoginUseCase`
- `RefreshTokenUseCase`
- `ChangePasswordUseCase`

**8b. Gestión de usuarios y clientes:**
- `CreateUserUseCase`, `ListUsersUseCase`, `AssignPermissionsUseCase`
- `CreateClientUseCase`, `UpsertClientUseCase`, `DeleteClientUseCase`

**8c. Inventario:**
- `CreateInventoryItemUseCase`
- `SearchInventoryUseCase`
- `RegisterStockMovementUseCase`

**8d. Órdenes (el módulo principal):**
- `CreateOrderUseCase`
- `ListOrdersUseCase`
- `GetOrderDetailUseCase`
- `ChangeOrderStatusUseCase`
- `AssignPartToOrderUseCase`
- `RegisterIntakeCausesUseCase`
- `UploadPhotosUseCase`
- `CloseOrderUseCase`
- `DeleteOrderUseCase`
- `RevertOrderPhaseUseCase`
- `ShareOrderPortalUseCase`

**8e. Finanzas:**
- `RegisterCashEntryUseCase`
- `RegisterARPaymentUseCase`
- `GetFinancialReportsUseCase`
- `GetKPIsUseCase`

**8f. Cotizaciones:**
- `CalculateQuoteTotalUseCase`
- `GenerateQuotePDFUseCase`

**8g. Vehículos:**
- `DecodeVinUseCase`
- `CheckRecallsUseCase`

**8h. Portal y encuestas:**
- `GetOrderByTokenUseCase`
- `SubmitSurveyUseCase`

**8i. Tareas:**
- `ManageTasksUseCase`

### Cómo se ve un caso de uso

Cada caso de uso es una clase con un único método `execute(dto)`:

```typescript
export class ChangeOrderStatusUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly stateMachine: OrderStateMachine,
  ) {}

  async execute(dto: ChangeStatusDto): Promise<void> {
    const order = await this.orderRepository.findById(dto.orderId);
    if (!order) throw new OrderNotFoundError(dto.orderId);

    this.stateMachine.validate(order.status, dto.newStatus); // lanza si inválido
    order.changeStatus(dto.newStatus, dto.changedBy);

    await this.orderRepository.save(order);
  }
}
```

No importa Prisma. No importa Fastify. Solo dominio y puertos.

### Por qué los casos de uso van aquí y no antes

Para escribir un caso de uso necesitas: las entidades (Etapa 3), los servicios de dominio (Etapa 5), los errores (Etapa 4), los puertos (Etapa 6) y los DTOs (Etapa 7). Si intentas escribir un caso de uso antes de cualquiera de esos, estarás inventando tipos sobre la marcha y reescribiéndolos después.

---

## Etapa 9 — Tests unitarios

### Qué hacer

Crear los **repositorios en memoria** en `tests/` y los tests:

```
tests/
├── unit/
│   ├── domain/
│   │   ├── OrderStateMachine.test.ts
│   │   ├── Money.test.ts
│   │   ├── PaymentCalculator.test.ts
│   │   └── ...
│   └── application/
│       ├── ChangeOrderStatusUseCase.test.ts
│       ├── CloseOrderUseCase.test.ts
│       └── ...
├── fakes/
│   ├── InMemoryOrderRepository.ts
│   ├── InMemoryClientRepository.ts
│   └── ...
└── factories/
    ├── OrderFactory.ts
    └── ClientFactory.ts
```

Los **fakes** implementan `IOrderRepository` usando un array en memoria — sin base de datos.

Las **factories** crean entidades con valores por defecto sensatos para tests.

### Por qué tests antes de la infraestructura

Porque si esperas a tener Prisma configurado para testear, nunca sabrás si tu lógica de negocio es correcta de forma aislada. Los tests unitarios validan el dominio y los casos de uso en milisegundos, sin levantar PostgreSQL.

Además, este es el momento en que tienes fresco qué hace cada caso de uso — escribir los tests ahora fuerza a descubrir edge cases antes de construir la infraestructura encima.

---

## Etapa 10 — Base de datos — Schema Prisma

### Qué hacer

Completar `prisma/schema.prisma` con todas las tablas:
- Mapear cada entidad del dominio a un modelo Prisma
- Definir relaciones, índices y restricciones
- Generar la primera migración: `npx prisma migrate dev --name init`
- Crear `prisma/seed.ts` con datos iniciales (usuario admin, tipos base, etc.)

### Por qué en este punto y no al principio

Diseñar el schema antes de tener el dominio claro es un error clásico. El schema de base de datos debe reflejar el modelo del dominio, no al revés. Si diseñas la BD primero, terminas con un modelo anémico que se parece a una hoja de cálculo, no a un modelo de negocio rico.

Al hacer el schema ahora, tienes certeza sobre qué datos necesita cada entidad, qué relaciones existen y qué índices necesitarán las consultas de los casos de uso que ya escribiste.

---

## Etapa 11 — Infraestructura — Repositorios Prisma

### Qué hacer

Crear los repositorios en `src/infrastructure/persistence/`:

Para cada repositorio:
1. La clase `PrismaXxxRepository` que implementa `IXxxRepository`
2. Un `XxxMapper` que convierte entre el modelo Prisma y la entidad del dominio

```
infrastructure/persistence/
├── PrismaOrderRepository.ts
├── PrismaClientRepository.ts
├── PrismaInventoryRepository.ts
├── ...
└── mappers/
    ├── OrderMapper.ts
    ├── ClientMapper.ts
    └── ...
```

El **mapper** es crítico: transforma el JSON plano que devuelve Prisma en entidades del dominio ricas (con sus value objects, enums tipados, métodos de comportamiento).

También crear `PrismaUnitOfWork.ts` para las transacciones que involucran múltiples repositorios (por ejemplo, cerrar una orden y crear la cuenta por cobrar en la misma transacción).

### Por qué los mappers son indispensables

Sin mapper, tu caso de uso recibiría un objeto Prisma crudo con strings donde debería haber `Money`, `Email` o `OrderStatus`. Contaminarías la lógica de negocio con detalles de persistencia. Los mappers son la frontera que mantiene el dominio limpio.

---

## Etapa 12 — Infraestructura — Adaptadores externos

### Qué hacer

Crear un adaptador por cada servicio externo en `src/infrastructure/adapters/`:

| Adaptador | Puerto que implementa | Tecnología |
|-----------|----------------------|------------|
| `Argon2HasherAdapter` | `IHasher` | argon2 |
| `JWTTokenProviderAdapter` | `ITokenProvider` | jsonwebtoken |
| `RedisCacheAdapter` | `ICache` | ioredis |
| `S3FileStorageAdapter` | `IFileStorage` | AWS SDK v3 |
| `PDFKitGeneratorAdapter` | `IPDFGenerator` | pdfkit |
| `NHTSAVinDecoderAdapter` | `IVinDecoder` | fetch + Redis cache |
| `ResendEmailAdapter` | parte de `INotificationSender` | resend |
| `TwilioWhatsAppAdapter` | parte de `INotificationSender` | twilio |
| `ExpoSendAdapter` | parte de `INotificationSender` | expo-server-sdk |

### Orden interno recomendado

Empieza por los más críticos para el flujo principal:
1. `Argon2HasherAdapter` y `JWTTokenProviderAdapter` (sin ellos no hay autenticación)
2. `RedisCacheAdapter` (lo necesita la cola de trabajos)
3. `S3FileStorageAdapter` (lo necesitan las fotos)
4. Los de notificaciones al final (son opcionales para el MVP)

### Por qué en esta etapa y no antes

Los adaptadores implementan interfaces (`IHasher`, `ICache`). Esas interfaces no existían hasta la Etapa 6. Además, crear adaptadores antes de tener casos de uso que los usen es programar a ciegas — no sabes exactamente qué métodos necesitarás.

---

## Etapa 13 — Infraestructura — Cola de trabajos

### Qué hacer

Crear `src/infrastructure/queue/` con:
- `BullMQJobQueueAdapter.ts` — implementa `IJobQueue`, encola trabajos en Redis
- `NotificationWorker.ts` — consume trabajos de notificación (email, WhatsApp, push)
- `StockAlertWorker.ts` — consume eventos `StockBelowMinimum`, notifica al encargado de inventario
- `CloseOrderWorker.ts` — trabajos de procesamiento asíncrono al cerrar órdenes

### Por qué la cola va aquí

La cola necesita Redis (Etapa 1 — Docker), los adaptadores de notificación (Etapa 12) y conocer los eventos de dominio (Etapa 4). Sin esos tres, no se puede implementar correctamente.

La cola desacopla el procesamiento asíncrono del flujo principal. `CloseOrderUseCase` no espera a que se envíe el email — encola un trabajo y termina. El worker lo procesa de forma independiente. Este patrón solo tiene sentido una vez que tienes claros todos los flujos del negocio.

---

## Etapa 14 — Infraestructura — Contenedor de dependencias

### Qué hacer

Crear `src/infrastructure/config/container.ts` — el único lugar del proyecto que conoce todas las implementaciones concretas:

```typescript
// Adaptadores
const hasher = new Argon2HasherAdapter();
const tokenProvider = new JWTTokenProviderAdapter(env.JWT_SECRET);
const cache = new RedisCacheAdapter(redis);
const fileStorage = new S3FileStorageAdapter(env.S3_BUCKET, ...);

// Repositorios
const orderRepository = new PrismaOrderRepository(prisma);
const clientRepository = new PrismaClientRepository(prisma);
...

// Servicios de dominio
const stateMachine = new OrderStateMachine();
const paymentCalculator = new PaymentCalculator();
...

// Casos de uso
export const changeOrderStatusUseCase = new ChangeOrderStatusUseCase(
  orderRepository,
  stateMachine,
);
export const loginUseCase = new LoginUseCase(
  userRepository,
  hasher,
  tokenProvider,
  cache,
);
...
```

### Por qué todo el wiring en un solo archivo

Este patrón (manual dependency injection / poor man's DI container) tiene una ventaja enorme sobre los frameworks DI con decoradores: es completamente explícito. TypeScript sabe exactamente qué se pasa a cada caso de uso. Si cambias una interfaz, el compilador te dice en `container.ts` que algo rompió.

Este archivo solo puede existir después de que todos los casos de uso, repositorios y adaptadores estén creados, porque los instancia a todos.

---

## Etapa 15 — Presentación — tRPC routers

### Qué hacer

Crear los routers en `src/presentation/routers/`:

**Configuración base primero:**
- `trpc.ts` — inicializar tRPC, definir `publicProcedure` y `protectedProcedure`
- `context.ts` — extraer el usuario del JWT del header `Authorization`
- `middleware/requirePermission.ts` — middleware de autorización por rol

**Luego los routers por módulo:**
- `auth.router.ts` — login, refresh, changePassword
- `orders.router.ts` — create, list, detail, changeStatus, close, delete, revertPhase, sharePortal
- `inventory.router.ts` — create, search, assignToOrder, registerMovement
- `clients.router.ts` — create, upsert, delete
- `finance.router.ts` — registerCashEntry, registerARPayment, reports, kpis
- `reception.router.ts` — registerIntakeCauses, uploadPhoto
- `tasks.router.ts` — create, list, changeStatus, delete
- `portal.router.ts` — getOrderByToken, submitSurvey (públicos)

Cada procedimiento:
1. Recibe el input validado por Zod (Etapa 16)
2. Construye el DTO de la aplicación
3. Llama al caso de uso del contenedor
4. Devuelve el resultado

### Por qué tRPC y no REST

tRPC genera tipos del cliente de forma automática a partir de los routers. El frontend TypeScript sabe exactamente qué parámetros acepta cada procedimiento y qué devuelve, sin generar documentación ni clientes manualmente. En un sistema donde el frontend y backend comparten el repositorio, la ganancia es enorme.

---

## Etapa 16 — Presentación — Validadores Zod

### Qué hacer

Crear `src/presentation/validators/` con un archivo por módulo:
- `order.validators.ts` — schemas para crear orden, cambiar estado, filtros de lista
- `inventory.validators.ts`
- `auth.validators.ts`
- `finance.validators.ts`
- etc.

Los schemas Zod validan y transforman el input del usuario antes de que llegue al caso de uso:

```typescript
export const createOrderSchema = z.object({
  clientId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  type: z.nativeEnum(OrderType),
  priority: z.nativeEnum(Priority),
  description: z.string().min(10).max(500),
  scheduledDate: z.coerce.date().optional(),
});
```

### Por qué la validación va en presentación y no en el dominio

El dominio valida **invariantes de negocio** (el estado A no puede ir al estado B, el pago no puede exceder el balance). La presentación valida **formato de entrada** (este campo es UUID, este string tiene max 500 chars, esta fecha es válida).

Si pones la validación de formato en el dominio, el dominio depende de la forma en que el usuario manda los datos — eso acopla dominio con presentación. Zod pertenece a la capa de presentación.

---

## Etapa 17 — Entry point y configuración final

### Qué hacer

Crear `src/index.ts`:

```typescript
import { env } from './infrastructure/config/env';
import Fastify from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { appRouter } from './presentation/routers';
import { createContext } from './presentation/context';
import { startWorkers } from './infrastructure/queue/workers';
import { logger } from './infrastructure/config/logger';

const app = Fastify({ logger });

app.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: { router: appRouter, createContext },
});

app.listen({ port: env.PORT, host: '0.0.0.0' }, (err) => {
  if (err) { logger.error(err); process.exit(1); }
  startWorkers();
  logger.info(`Server running on port ${env.PORT}`);
});
```

Luego configurar el `Dockerfile` con build multi-stage y el script de startup que ejecuta migraciones antes de iniciar el servidor.

---

## Resumen visual

```
ETAPA  CAPA              QUÉ SE CONSTRUYE                          POR QUÉ PRIMERO
─────────────────────────────────────────────────────────────────────────────────────
  1    Config            Repo, tsconfig, env, Docker               Base para todo
  2    Dominio           Value objects (Money, Email, VIN…)        Ladrillos de entidades
  3    Dominio           Entidades + enums                         Modelo de negocio
  4    Dominio           Errores + Eventos de dominio              Semántica y comunicación
  5    Dominio           Servicios de dominio (StateMachine…)      Lógica entre entidades
  6    Aplicación        Puertos / interfaces                      Contrato app-infraestructura
  7    Aplicación        DTOs                                      Contratos de entrada/salida
  8    Aplicación        Casos de uso                              Orquestación del dominio
  9    Tests             Fakes en memoria + tests unitarios        Validar antes de construir infra
 10    Infraestructura   Schema Prisma + migraciones               Reflejar el dominio ya maduro
 11    Infraestructura   Repositorios Prisma + mappers             Implementar los puertos de BD
 12    Infraestructura   Adaptadores externos (S3, JWT, Redis…)    Implementar puertos de servicios
 13    Infraestructura   Cola de trabajos BullMQ                   Necesita adaptadores + eventos
 14    Infraestructura   Contenedor de dependencias                Conectar todo
 15    Presentación      Routers tRPC                              Exponer casos de uso al exterior
 16    Presentación      Validadores Zod                           Validar input de usuario
 17    Config            Entry point + Dockerfile                  Ensamblar y desplegar
─────────────────────────────────────────────────────────────────────────────────────
```

### La regla de dependencias en una frase

> El código de una capa solo puede importar código de capas más internas. Nunca al revés.

```
  Presentación  →  Aplicación  →  Dominio
  Infraestructura  →  Aplicación  →  Dominio
```

La infraestructura y la presentación pueden conocerse mutuamente solo a través del contenedor (`container.ts`). El dominio y la aplicación no importan nada de infraestructura ni de presentación — jamás.

---

## Errores comunes a evitar

1. **Diseñar la base de datos primero.** Parece natural pero invierte las dependencias. El schema debe reflejar el dominio, no al revés.

2. **Escribir casos de uso sin interfaces.** Si el caso de uso importa `PrismaOrderRepository` directamente, no puedes testear sin base de datos y no puedes cambiar de ORM sin tocar lógica de negocio.

3. **Validar con Zod en el dominio.** Zod valida formato; el dominio valida invariantes de negocio. Mezclarlos acopla capas.

4. **Un caso de uso que hace demasiado.** `CloseOrderUseCase` cierra la orden, crea la cuenta por cobrar y encola la notificación — pero no envía el email directamente. El envío lo hace el worker. Si el caso de uso enviara el email, un fallo en el proveedor de email haría fallar toda la operación de cierre.

5. **Saltarse los tests unitarios.** Sin tests en Etapa 9, descubrirás los bugs en los casos de uso cuando ya tengas tres capas más encima — y será mucho más difícil aislar el error.

6. **Crear el contenedor de dependencias demasiado pronto.** El `container.ts` instancia todo el grafo de dependencias. Si lo creas en la Etapa 3, tendrás que actualizarlo cada vez que añadas algo nuevo. Crearlo al final, cuando el grafo está completo, solo requiere una pasada.
