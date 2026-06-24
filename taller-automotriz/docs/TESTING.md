# Estrategia y cobertura de tests — Taller Automotriz

Este documento describe la estrategia de testing del proyecto, el inventario de
lo cubierto en esta entrega, los hallazgos detectados durante su elaboración y
el roadmap de trabajo pendiente.

> **Nota importante:** los tests creados en esta entrega **no han sido
> ejecutados todavía**. Antes de confiar en ellos, corre los comandos de la
> sección "Cómo ejecutar los tests" y revisa/corrige cualquier error de
> compilación o aserción que pueda surgir.

## 1. Estrategia y convenciones

### 1.1 Backend (`taller-automotriz/`)

- **Framework**: Vitest (`globals: true`, no es necesario importar `describe`/`it`/`expect`,
  aunque la convención existente los importa explícitamente desde `vitest`).
- **Ubicación**: `tests/unit/...`, replicando la estructura de `src/`
  (`domain/value-objects`, `domain/entities`, `domain/services`,
  `application/use-cases/<módulo>`).
- **Idioma**: descripciones de `describe`/`it` en español, enfocadas en el
  comportamiento ("calcula el total con impuesto", "lanza error si el usuario
  no existe").
- **Arquitectura bajo prueba**: Clean Architecture / DDD.
  - **Domain**: entidades, value objects, servicios de dominio, enums,
    errores y eventos de dominio. Se prueban de forma aislada, sin
    dependencias externas.
  - **Application (use-cases)**: se prueban con **fakes / repositorios en
    memoria** que implementan los puertos (`ports/repositories`,
    `ports/services`). No se usa una base de datos real ni mocks de
    librerías de terceros.
- **Helpers compartidos** (`tests/helpers/`):
  - `factories.ts`: funciones `createTestX(overrides)` para construir
    entidades de dominio con valores por defecto razonables.
  - `fakes.ts`: implementaciones `Fake*` de puertos de servicios
    (`FakeUnitOfWork`, `FakeJobQueue`, `FakeHasher`, `FakeTokenProvider`,
    `FakeDomainEventDispatcher`, `FakeNotificationSender`,
    `FakeTimelineRepository`, `FakeStockMovementRepository`).
  - `in-memory-*.repository.ts`: implementaciones `InMemory*Repository` de los
    puertos de repositorio (`order`, `client`, `vehicle`, `inventory`,
    `account-receivable`, `cash-entry`, `user`, `note`, `quote`,
    `price-list`, `scheduled-payment`, `task`, `survey`).
- **Patrones de dominio relevantes**:
  - Constructores privados + factorías estáticas (`WorkOrder.create` /
    `WorkOrder.reconstitute`, `Quote`, etc.).
  - Eventos de dominio acumulados en `_domainEvents`, expuestos vía
    `domainEvents` y limpiados con `clearEvents()`.
  - Value Objects con `.from()` que lanzan `InvalidValueObjectError` ante
    datos inválidos.
  - Máquinas de estado: `OrderStateMachine` (órdenes), transiciones de
    `Task` vía `VALID_TASK_TRANSITIONS`, ambas lanzan
    `InvalidStateTransitionError` ante transiciones no permitidas.
  - `Money` opera internamente en centavos (`Money.fromAmount`,
    `Money.fromCents`, `.cents`, `.amount`, `.equals`).
  - Lógica dependiente de fecha (`Task.isOverdue`,
    `ScheduledPayment.detectOverdue`) probada con `vi.useFakeTimers()` /
    `vi.setSystemTime()`.

### 1.2 Frontend (`ProyectoSPA/`)

- **Framework**: Vitest a través de `@angular/build:unit-test` (`ng test`).
- **Ubicación**: specs `*.spec.ts` junto al archivo bajo prueba (convención
  estándar de Angular CLI).
- **Idioma**: `describe`/`it` en español.
- **HTTP**: `provideHttpClient()` + `provideHttpClientTesting()` y
  `HttpTestingController` para interceptar y responder las llamadas que los
  servicios disparan en su constructor o en sus métodos públicos.
- **Servicios con signals**: se inspeccionan señales públicas
  (`service.items()`, `service.workOrders()`, etc.) y, cuando es necesario
  preparar un estado inicial sin pasar por HTTP, se escribe directamente al
  signal privado vía `(service as any)._signal.set(...)` (técnica usada en
  `work-orders.service.spec.ts`).
- **Guards**: se prueban con `TestBed.runInInjectionContext()`, mockeando
  `AuthService` y espiando `Router.createUrlTree`.

## 2. Cómo ejecutar los tests

```bash
# Backend
cd taller-automotriz
npm test            # o: npx vitest run

# Frontend
cd ProyectoSPA
ng test              # o: npx ng test --watch=false
```

> Recordatorio: estos comandos **no se han ejecutado** como parte de esta
> entrega, por instrucción explícita. Es posible que aparezcan errores de
> tipos o aserciones que requieran ajustes menores al correrlos por primera
> vez.

## 3. Inventario de cobertura agregada en esta entrega

### 3.1 Backend — Value Objects (`tests/unit/domain/value-objects/`)

| Archivo | Cubre |
|---|---|
| `email.test.ts` | `Email.from()` — formatos válidos/ inválidos, normalización |
| `phone.test.ts` | `Phone.from()` — formatos válidos/inválidos |
| `percentage.test.ts` | `Percentage.from()` — rangos válidos, límites, errores |
| `order-code.test.ts` | `OrderCode.from()` — formato de código de orden |
| `date-range.test.ts` | `DateRange` — validación de rango, contiene/solapa |
| `vin.test.ts` | `VIN.from()` — longitudes válidas e inválidas (ver hallazgo §5.1) |
| `money.test.ts` *(preexistente)* | aritmética en centavos, formateo |

### 3.2 Backend — Domain Entities (`tests/unit/domain/entities/`)

| Archivo | Cubre |
|---|---|
| `client.test.ts` | creación, actualización, etiquetas (`ClientTag`) |
| `vehicle.test.ts` | creación, actualización de datos del vehículo |
| `quote.test.ts` | totales, aprobación, asignación de servicio/PDF |
| `task.test.ts` | transiciones de estado (`VALID_TASK_TRANSITIONS`), `isOverdue` |
| `checklist.test.ts` | ítems de checklist y su completado |
| `user.test.ts` | permisos, activación/desactivación, `hasPermission` |
| `supplier.test.ts` | creación y actualización de proveedor |
| `account-payable.test.ts` | cuentas por pagar — saldo, pagos |
| `account-receivable.test.ts` | cuentas por cobrar — pagos, evento `PaymentRegistered.isPaid` |
| `cash-entry.test.ts` | registro de movimientos de caja |
| `scheduled-payment.test.ts` | `markPaid`, `detectOverdue` (con fake timers), `update` |
| `work-order.test.ts`, `inventory-item.test.ts` *(preexistentes)* | — |

### 3.3 Backend — Domain Services (`tests/unit/domain/services/`)

| Archivo | Cubre |
|---|---|
| `payment-calculator.test.ts` | cálculo de saldos/pagos |
| `quote-calculator.test.ts` | `calculateFromLines`, `calculateTotal` (subtotal/impuesto/total) |
| `stock-calculator.test.ts` | cálculo de stock resultante y umbral mínimo |
| `client-tagger.test.ts` | asignación de `ClientTag` según historial |
| `order-state-machine.test.ts` *(preexistente)* | — |

### 3.4 Backend — Use-cases (`tests/unit/application/use-cases/`)

| Módulo | Archivos |
|---|---|
| Orders | `create-order`, `change-order-status`, `close-order`, `revert-order-phase`, `delete-order`, `add-note-to-order`, `assign-part-to-order` *(preexistente)* |
| Inventory | `register-stock-movement`, `create-inventory-item`, `update-inventory-item`, `search-inventory` |
| Finance | `register-cash-entry`, `register-ar-payment`, `list-accounts-receivable` |
| Clients/Vehicles | `create-client`, `upsert-client`, `delete-client`, `create-vehicle`, `update-vehicle` |
| Auth | `login`, `change-password`, `refresh-token` |
| Quotation | `calculate-quote-total` |
| Payments agenda | `create-scheduled-payment`, `update-scheduled-payment` |
| Users | `create-user`, `assign-permissions` |
| Tasks | `manage-tasks` (create/changeStatus/list/delete) |
| Quality | `submit-survey` |

Cada caso de uso cubre, como mínimo: el flujo principal (happy path), validación
de errores de negocio explícitos (`throw new Error('...')` / errores de
dominio), y casos límite relevantes (entidades inexistentes, datos opcionales
ausentes, duplicados).

### 3.5 Frontend (`ProyectoSPA/src/app/...`)

| Archivo | Cubre |
|---|---|
| `features/work-orders/services/work-orders.service.spec.ts` | carga inicial y mapeo `mapList`/`mapDetail`, signals computados (`technicians`, `clients`, `allClients`), `toggleChecklist`, `updateStatus` (incluye flag `cargoCuentasPorCobrarGenerado`), `assignPart`/`assignService`, `createWorkOrder` (incluyendo rollback del optimistic update ante error de API y callback `onError`), `deleteWorkOrder` |
| `features/clients-vehicles/services/clients-vehicles.service.spec.ts` | carga inicial, `createClient`, `updateClient` (optimista + confirmación), `canDeleteClient`/`deleteClient` (incluye rollback ante error), `getClientById`, `loadClientDetail` (mapeo de vehículos y órdenes) |
| `features/inventory/services/inventory.service.spec.ts` | carga inicial (items + custodia), signals computados (`operationalItems`, `saleItems`, `lowStockItems`), `createInventoryItem` (éxito y rollback ante error), `updateInventoryItem`, `deleteInventoryItem`, `recordEntry`/`recordManualAdjustment` (incluye rechazo por stock insuficiente), `consumeForWorkOrder`, custodia (crear/entregar/eliminar) |
| `core/auth/auth.guards.spec.ts` | `authGuard`, `loggedOutGuard`, `roleGuard` (acceso permitido/denegado y redirecciones) |

## 4. Helpers y fixtures nuevos creados

- `tests/helpers/factories.ts`: se agregó `createTestVehicle`.
- `tests/helpers/fakes.ts`: se agregaron `FakeDomainEventDispatcher`,
  `FakeHasher`, `FakeTokenProvider`.
- Nuevos repositorios en memoria: `in-memory-client.repository.ts`,
  `in-memory-vehicle.repository.ts`,
  `in-memory-account-receivable.repository.ts`,
  `in-memory-note.repository.ts`, `in-memory-cash-entry.repository.ts`,
  `in-memory-user.repository.ts`, `in-memory-quote.repository.ts`,
  `in-memory-price-list.repository.ts`,
  `in-memory-scheduled-payment.repository.ts`,
  `in-memory-task.repository.ts`, `in-memory-survey.repository.ts`.

## 5. Hallazgos y observaciones

### 5.1 `VIN.from()` acepta longitudes "raras" (bug de validación)

Archivo: `src/domain/value-objects/vin.vo.ts`.

La validación actual sólo exige `length >= 6`. La segunda condición prevista
para restringir VINs a 6, 11 o 17 caracteres
(`longitud !== 17 && !== 11 && < 6`) **nunca se cumple**, porque ya se filtra
`length < 6` antes. En la práctica, esto significa que VINs de longitudes
"raras" (por ejemplo 7, 12 o 20 caracteres) son aceptados, aunque la intención
del dominio parece ser limitarlos a 6, 11 o 17 caracteres.

Documentado y cubierto explícitamente en
`tests/unit/domain/value-objects/vin.test.ts`. Se recomienda revisar la
condición y decidir si se debe corregir la validación o si la longitud libre
(>= 6) es el comportamiento deseado, ajustando entonces la documentación del
VO.

### 5.2 `CalculateQuoteTotalUseCase` ignora ítems/servicios inexistentes silenciosamente

Si `assignedPartIds` referencia un `itemId` que no existe en
`InventoryRepository`, o `serviceId` no existe en `PriceListRepository`, el
caso de uso simplemente los omite del cálculo (no lanza error). Esto está
cubierto por tests, pero conviene confirmar que es el comportamiento deseado
desde negocio (vs. lanzar un error de validación).

### 5.3 `WorkOrdersService.updateStatus` siempre llama al backend, incluso sin cambios

`updateStatus` hace `PATCH /work-orders/:id/status` aunque el `status`
recibido sea igual al actual (la guarda `o.status === status` sólo evita la
actualización del signal local, no la llamada HTTP). No es necesariamente un
bug, pero genera una llamada de red redundante; el test correspondiente lo
deja documentado.

### 5.4 `InventoryService.consumeForWorkOrder` depende de `linkedPartId`

Si el ítem de inventario no tiene `linkedPartId` configurado (o no coincide
con el id de la parte del catálogo de la orden), `consumeForWorkOrder` no
hace nada (no descuenta stock ni registra movimiento) y tampoco notifica error.
Cubierto en el test, pero es un punto a vigilar si se reportan descuadres de
inventario.

## 6. Roadmap — pendiente para futuras entregas

### Backend

- **Presentation / routers tRPC**: ningún router de `src/presentation` está
  cubierto (autenticación de requests, mapeo de inputs/outputs, manejo de
  errores HTTP).
- **Infraestructura (Prisma)**: repositorios reales (`Prisma*Repository`) no
  están cubiertos; requieren tests de integración contra una base de datos de
  prueba (o un adaptador in-memory de Prisma).
- **Resto de use-cases** no incluidos en esta entrega (revisar
  `src/application/use-cases/**` para módulos no listados en §3.4: por
  ejemplo reportes, notificaciones, portal de cliente más allá de
  `submit-survey`, jobs/colas).
- **Tests end-to-end (e2e)**: flujo completo orden → inventario → finanzas →
  cuentas por cobrar, vía API real.
- **Eventos de dominio**: validar que `InProcessDomainEventDispatcher` despacha
  correctamente los eventos emitidos por las entidades y que el dispatch
  fire-and-forget no interrumpe el flujo principal ante un fallo.

### Frontend

- **Componentes**: ningún componente de `features/**/components` tiene specs
  (formularios de creación/edición, tablas, modales).
- **Otros servicios**: `dashboard`, `reports`/finanzas (más allá de lo que ya
  tocan los use-cases de backend), `tasks`, `quality`/encuestas,
  `payments-agenda` del lado frontend.
- **Interceptores**: `auth.interceptor.ts` no está cubierto (adjunción de
  token, manejo de 401/refresh).
- **Routing**: pruebas de integración de rutas protegidas con los guards ya
  cubiertos.
- **Pruebas de UI / interacción**: actualmente sólo se prueba la capa de
  servicios; falta cobertura de plantillas (`*.html`) y eventos de usuario.
