# Flujo de OT, Cotización, Cobro, IVA y Finanzas

## Objetivo

Este documento define cómo se conecta la operación de una Orden de Trabajo (OT) con cotización, cobro, cuentas por cobrar, facturación e indicadores financieros.

La idea es resolver una confusión que hoy existe en muchos talleres y que también aparece en este proyecto:

- una cosa es **cotizar**
- otra es **autorizar**
- otra es **ejecutar**
- otra es **cobrar**
- y otra distinta es **facturar**

Si esas capas se mezclan, los números dejan de ser confiables.

---

## Resumen ejecutivo

La recomendación principal es esta:

- La **OT** debe ser el centro operativo.
- La **cotización** debe ser solo una propuesta comercial.
- Lo que se manda a **finanzas** no debe salir de la cotización "bonita", sino del **cierre comercial de la OT**, es decir, de lo que realmente se hizo y se decidió cobrar.
- El **IVA no debe contarse como ganancia**.
- Los **anticipos/pagos parciales** deben poder registrarse antes de cerrar la OT.
- Los pagos por **terminal** deben guardar comisión para poder medir ingreso real neto.
- Debe existir una bandeja o checklist de **OTs pendientes de facturación**.

---

## Estado actual del sistema

## Lo que hoy ya existe en código

- La **OT** es el núcleo operativo del sistema.
- Existe módulo de **cotizaciones** ligado a la OT.
- Existe **cuenta por cobrar** (`accounts_receivable`) ligada a una OT.
- Existe **registro de pagos** (`payments`) para cobrar parcial o totalmente.
- Existe **caja** (`cash_entries`) con método de pago.
- Existe cálculo de **IVA** y **descuento** dentro de cotizaciones de OT en frontend.
- Al cerrar/completar una OT, el sistema está planteado para **generar una cuenta por cobrar**.

## Lo que hoy todavía no está completamente resuelto

- No está completamente separado el concepto de:
  - cotización propuesta
  - servicios realmente ejecutados
  - monto final cobrable
- No hay una capa clara para **anticipos** antes del cierre final de la OT.
- No hay control explícito de **comisión por terminal**.
- No hay un módulo claro de **facturación pendiente**.
- No hay una distinción clara entre:
  - ingreso bruto
  - IVA cobrado
  - comisión bancaria/terminal
  - ingreso neto real
- No hay una pista de auditoría funcional para cambios manuales de precio con motivo y autorización.

---

## Principio rector

## Fuente de verdad por etapa

### 1. Cotización

La fuente de verdad es la **propuesta comercial**.

Sirve para:

- mostrar precio estimado
- negociar con el cliente
- pedir autorización
- imprimir o compartir PDF

No debe servir por sí sola para:

- reconocer ingreso
- crear utilidad
- considerar IVA como realizado
- cerrar financieramente una OT

### 2. Ejecución de la OT

La fuente de verdad es lo que **sí se hizo**.

Debe responder:

- qué refacciones se usaron realmente
- qué servicios se realizaron realmente
- cuáles se cancelaron
- cuáles cambiaron de precio

### 3. Cierre comercial

La fuente de verdad es el **resumen final cobrable de la OT**.

Debe ser el punto donde se congela:

- subtotal ejecutado
- descuento final
- si lleva IVA o no
- IVA final
- total final
- observaciones comerciales

### 4. Cobro

La fuente de verdad es el **pago registrado**, no el total de la OT.

Cada pago debe guardar:

- monto
- fecha
- método
- si fue anticipo o liquidación
- referencia
- usuario
- comisión terminal si aplica

### 5. Facturación

La fuente de verdad es el **documento fiscal / estado de facturación**, no la OT sola.

Debe responder:

- si el cliente pidió factura
- si ya se emitió
- si está pendiente
- cuánto IVA está comprometido en esa factura

---

## Decisiones de negocio recomendadas

## 1. ¿Se pueden adelantar pagos de una OT?

Sí. Debería ser un caso nativo del sistema.

### Recomendación

Permitir **anticipos** antes del cierre final de la OT.

### Cómo debería comportarse

- La OT puede recibir uno o varios pagos antes de terminarse.
- Esos pagos no cierran la OT automáticamente.
- Se acumulan como `monto_recibido`.
- Cuando la OT se cierre comercialmente, el sistema calcula:
  - total final
  - menos anticipos
  - saldo pendiente

### Regla sugerida

- Si el cliente paga antes de cerrar:
  - se registra como **anticipo**
- Si paga al final:
  - se registra como **pago final**
- Si queda saldo:
  - se genera o actualiza la **cuenta por cobrar**

### Ejemplo

- Total final OT: `$4,000`
- Anticipo 1: `$1,000`
- Anticipo 2: `$500`
- Saldo al entregar: `$2,500`

---

## 2. ¿Debemos saber si pagaron en terminal?

Sí, absolutamente.

No solo hay que saber si fue "Tarjeta", sino también:

- si pasó por terminal
- qué porcentaje de comisión cobró la terminal
- cuánto fue esa comisión en monto

### Recomendación

Cada pago debe guardar:

- `metodo_pago`
- `usa_terminal`
- `porcentaje_comision_terminal`
- `monto_comision_terminal`
- `monto_neto_recibido`

### ¿Por qué?

Porque si cobras `$1,000` con terminal y la comisión es 3.6%, tu ingreso real no fue `$1,000`, sino `$964` antes de otros costos.

### Impacto financiero

En reportes debe separarse:

- **Ingreso cobrado bruto**
- **Comisiones bancarias / terminal**
- **Ingreso neto**

---

## 3. ¿De dónde debe salir el cobro que se manda a finanzas?

Debe salir de la **OT cerrada comercialmente**, no de la cotización aislada.

### Recomendación fuerte

La **cotización** sirve para proponer.

La **OT cerrada** sirve para cobrar y mandar a finanzas.

### ¿Por qué no desde la cotización?

Porque una cotización puede:

- no aprobarse
- aprobarse parcialmente
- cambiar durante el trabajo
- usarse solo como referencia

Entonces, si finanzas toma el monto desde cotización, puede terminar cobrando o reportando algo que nunca se hizo.

### Regla propuesta

Finanzas debe consumir un objeto tipo:

- `subtotal_ejecutado`
- `descuento_final`
- `iva_final`
- `total_final`
- `anticipo_acumulado`
- `saldo_pendiente`

Y ese objeto debe generarse en el **cierre comercial de la OT**.

---

## 4. ¿Cómo aplicar IVA?

El IVA no debe tratarse como ganancia.

### Recomendación funcional

El sistema debe separar siempre:

- **Subtotal**
- **IVA**
- **Total**

Y reportarlos por separado.

### Regla operativa sugerida

- Si la operación o servicio se cobrará con IVA:
  - `aplica_iva = true`
- Si no:
  - `aplica_iva = false`

### Regla financiera

- El subtotal afecta ventas/ingresos.
- El IVA afecta una bolsa o vista de **impuestos por trasladar / facturar**.
- El dashboard de utilidad no debe inflarse con IVA.

### Recomendación importante

Agregar una sección o vista de:

- **Pendientes de facturación**
- **IVA por facturar / emitido**
- **IVA cobrado no reconocido como utilidad**

---

## 5. ¿Debe existir una lista de OTs pendientes de facturación?

Sí. Es muy recomendable.

### Propuesta

Crear una vista tipo checklist o bandeja:

- OTs por facturar
- OTs facturadas
- OTs no facturables
- OTs con datos fiscales incompletos

### Campos sugeridos

- ID OT
- Cliente
- Vehículo
- Fecha de cierre
- Total subtotal
- IVA
- Total
- Estado de facturación
- RFC / razón social / uso CFDI / correo
- Responsable

### Estados sugeridos

- `No requiere factura`
- `Pendiente datos fiscales`
- `Lista para facturar`
- `Facturada`
- `Cancelada`

---

## 6. ¿Se debe poder editar el precio manualmente?

Sí, pero con control.

### Debe permitirse en

- Cotizador
- Cotización dentro de OT
- Cierre comercial de OT

### No debe implicar

- cambiar la lista de precios base para todos

### Reglas sugeridas

Cada línea debe poder tener:

- precio base
- precio manual final
- motivo del ajuste
- usuario que ajustó
- fecha del ajuste
- autorización si excede cierto porcentaje

### Ejemplos de motivo

- descuento comercial
- cliente frecuente
- garantía parcial
- ajuste por competencia
- error de captura

---

## 7. ¿Los empleados deben poder cambiar precios?

Sí, pero por **permiso**, no solo por rol general.

### Recomendación

Crear permisos específicos como:

- `puede_editar_precio_cotizacion`
- `puede_editar_precio_ot`
- `puede_aplicar_descuento`
- `puede_exentar_iva`
- `puede_autorizar_descuento_mayor_a_x`

### Regla operativa sugerida

- Técnicos:
  - pueden sugerir cambios
  - no necesariamente autorizar descuentos altos
- Recepción / asesor:
  - puede ajustar dentro de un rango
- Gerencia / admin:
  - puede sobreescribir cualquier precio con motivo

---

## Ciclo de vida recomendado de una OT

La OT necesita dos flujos claros:

- flujo **operativo**
- flujo **comercial-financiero**

## A. Flujo operativo

### Estados sugeridos

1. `Nueva`
2. `Diagnóstico`
3. `Esperando autorización`
4. `En reparación`
5. `Control de calidad`
6. `Lista para entrega`
7. `Entregada`
8. `Cerrada`
9. `Cancelada`

### Significado

#### 1. Nueva

- se recibe el vehículo
- se capturan datos
- se crea la OT

#### 2. Diagnóstico

- se revisa la unidad
- se detectan fallas
- se alimenta propuesta de trabajo

#### 3. Esperando autorización

- se presenta cotización
- cliente aprueba o rechaza

#### 4. En reparación

- se ejecutan los trabajos aprobados
- se consumen piezas reales

#### 5. Control de calidad

- revisión final
- pruebas

#### 6. Lista para entrega

- trabajo terminado
- se arma cierre comercial

#### 7. Entregada

- vehículo entregado al cliente
- puede existir saldo pendiente o pago total

#### 8. Cerrada

- OT ya no cambia operativamente
- importe final congelado
- facturación y cobranza quedan amarradas

#### 9. Cancelada

- no se realizó
- debe quedar motivo

## B. Flujo comercial-financiero

Este flujo puede avanzar en paralelo al operativo.

### Estados sugeridos

1. `Sin cotizar`
2. `Cotizada`
3. `Aprobada parcial`
4. `Aprobada total`
5. `En ejecución`
6. `Cierre comercial pendiente`
7. `Cobrada parcial`
8. `Cobrada total`
9. `Pendiente de facturar`
10. `Facturada`

### Idea clave

La OT puede estar:

- operativamente terminada
- pero financieramente aún parcial
- o ya cobrada
- o aún pendiente de factura

Eso evita usar un solo status para demasiadas cosas.

---

## Propuesta de estructura de secciones dentro de la OT

Hoy conviene dividir la OT por intención de uso, no solo por tipo de dato.

## Sección 1. Resumen

Debe mostrar de inmediato:

- ID OT
- cliente
- vehículo
- placas
- año
- asesor / técnico
- estado operativo
- estado comercial
- estado de cobro
- estado de facturación

## Sección 2. Recepción y diagnóstico

- problema reportado
- hallazgos
- checklist inicial
- fotos
- kilometraje
- observaciones

## Sección 3. Cotización / autorización

- servicios cotizados
- refacciones cotizadas
- precios base
- descuentos propuestos
- IVA estimado
- total estimado
- aprobación del cliente

Esta sección es una propuesta, no el cierre final.

## Sección 4. Ejecución real

- servicios realizados
- refacciones realmente usadas
- cantidades reales
- responsable
- avances
- cambios sobre lo cotizado

Esta sección debe ser la base del monto final.

## Sección 5. Cierre comercial

Esta es la sección más importante para conectar OT con finanzas.

Debe mostrar:

- subtotal ejecutado
- descuento final
- switch tipo descuento
- aplica IVA sí/no
- IVA final
- total final
- razón de ajustes manuales
- usuario que autorizó

### Regla

Cuando esta sección se confirma, se congela el total cobrable.

## Sección 6. Cobros y anticipos

Debe permitir registrar varios pagos.

Cada pago debe guardar:

- fecha
- monto
- método
- si fue anticipo o liquidación
- referencia
- si usó terminal
- porcentaje comisión terminal
- monto comisión terminal
- neto recibido

Debe mostrar resumen:

- total OT
- total cobrado
- saldo pendiente

## Sección 7. Facturación e impuestos

Aquí debe vivir todo lo fiscal.

Campos sugeridos:

- requiere factura
- datos fiscales
- uso CFDI
- estado facturación
- folio factura
- fecha factura
- subtotal facturable
- IVA facturado

### Importante

Esta sección ayuda a que el IVA no se pierda dentro del "ingreso".

## Sección 8. Evidencia e historial

- timeline
- comentarios
- cambios de precio
- cambios de responsables
- auditoría de autorizaciones

---

## Qué debe llegar a Finanzas

Finanzas no debería leer directamente "lo que parece cobrarse" en pantalla.

Debería recibir un resumen estructurado del cierre comercial.

## Payload conceptual recomendado

```json
{
  "otId": "WO-1024",
  "cliente": "Juan Perez",
  "subtotalEjecutado": 3500,
  "descuentoTipo": "porcentaje",
  "descuentoValor": 10,
  "descuentoMonto": 350,
  "aplicaIva": true,
  "ivaMonto": 504,
  "totalFinal": 3654,
  "anticipoAcumulado": 1000,
  "saldoPendiente": 2654,
  "requiereFactura": true,
  "estadoFacturacion": "Pendiente",
  "fechaCierreComercial": "2026-06-25"
}
```

## Qué hace Finanzas con eso

### 1. Cuentas por cobrar

Crear o actualizar:

- total
- pagado
- saldo
- vencimiento

### 2. Caja

Cada pago real genera entrada de caja.

### 3. Impuestos

Separar:

- subtotal
- IVA

### 4. Reportes

Separar:

- venta bruta
- descuentos
- IVA
- comisión terminal
- ingreso neto

---

## Modelo mental recomendado

## La cotización no es la factura

La cotización responde:

- "esto podría costar"

## La OT ejecutada no es el cobro aún

La OT responde:

- "esto sí se hizo"

## El cierre comercial no es todavía la cobranza completa

El cierre comercial responde:

- "esto es lo que decidimos cobrar"

## El pago responde otra pregunta

El pago responde:

- "esto es lo que ya entró"

## La facturación responde otra

La facturación responde:

- "esto es lo que fiscalmente se documentó"

---

## Recomendaciones concretas para el producto

## Prioridad alta

1. Definir que el monto que va a finanzas salga del **cierre comercial de la OT**.
2. Permitir **pagos parciales / anticipos** ligados a la OT.
3. Agregar campos de **terminal y comisión** por pago.
4. Crear estatus de **facturación** separado del estatus operativo.
5. Separar visualmente **subtotal, IVA y total**.

## Prioridad media

1. Permitir **override manual de precio por línea** con motivo.
2. Agregar auditoría de cambios de precio.
3. Agregar bandeja de **OTs pendientes de facturación**.
4. Agregar resumen financiero dentro de cada OT.

## Prioridad baja pero valiosa

1. Dashboard fiscal con IVA pendiente / facturado.
2. Reglas de autorización por porcentaje de descuento.
3. Reporte de comisiones por terminal.

---

## Propuesta de implementación funcional por fases

## Fase 1. Ordenar conceptos

- declarar OT como centro del flujo
- separar cotización de cierre comercial
- separar estado operativo de estado financiero

## Fase 2. Cobranza real

- anticipos
- múltiples pagos
- saldo pendiente
- terminal y comisión

## Fase 3. Fiscal

- requiere factura
- cola de pendientes de facturación
- separar IVA del ingreso

## Fase 4. Control comercial

- ajustes manuales por línea
- permisos por usuario
- auditoría de cambios

---

## Definición final recomendada

Si tuvieramos que resumir todo en una sola regla de negocio, sería esta:

> La cotización propone, la OT ejecuta, el cierre comercial define el monto cobrable, finanzas cobra y facturación documenta el impuesto.

---

## Siguiente paso sugerido para el equipo

Antes de seguir agregando pantallas, conviene alinear estas 5 decisiones:

1. ¿La cuenta por cobrar nace al cerrar operativamente o al confirmar cierre comercial?
2. ¿El IVA siempre aplica, o se decide por OT?
3. ¿Quién puede cambiar precios y hasta qué límite?
4. ¿Cómo quieren manejar anticipos antes de la entrega?
5. ¿Qué estados exactos quieren para facturación?

Cuando esas 5 respuestas queden fijas, ya se puede bajar a UI, backend y reportes sin volver a enredar el flujo.

---

## Decisiones ya confirmadas por el equipo

Estas decisiones ya quedaron definidas y deben tratarse como base del diseño funcional:

### 1. Nacimiento de la cuenta por cobrar

La **cuenta por cobrar nace al cerrar la OT**, cuando el carro ya está listo para entregar al cliente.

Esto significa:

- antes del cierre puede haber anticipos
- al cerrar se congela el total final cobrable
- en ese momento se crea la cuenta por cobrar con:
  - total final
  - anticipos acumulados
  - saldo pendiente

### 2. IVA

El **IVA se decide por OT**.

Esto significa:

- no aplica de forma global
- cada OT debe tener su propia decisión fiscal
- los reportes deben separar subtotal e IVA por cada OT

### 3. Cambio de precios

Todos los usuarios pueden **cambiar precios en el cotizador de una OT**.

Regla importante:

- el cambio es **solo para esa OT**
- el precio base general **no cambia**
- solo **administrador o gerente** pueden cambiar la lista de precios base del sistema

### 4. Anticipos

Los **anticipos se descuentan del total cotizado/final**.

Esto significa:

- el cliente puede pagar en partes antes de la entrega
- esos pagos se van acumulando
- al cerrar la OT se calcula cuánto falta por liquidar

### 5. Facturación

Los estados exactos de facturación no estaban cerrados, así que se proponen abajo.

---

## Estados propuestos de facturación

Dado el flujo que definieron, esta es la propuesta más clara y fácil de operar:

### 1. `No requerida`

La OT no necesita factura.

Usar cuando:

- el cliente no solicita factura
- la operación se cierra sin proceso fiscal adicional

### 2. `Pendiente de datos`

Sí requiere factura, pero aún faltan datos fiscales.

Usar cuando falta cualquiera de estos:

- RFC
- razón social
- régimen
- uso CFDI
- correo

### 3. `Lista para facturar`

La OT ya está cerrada, el monto final ya está congelado y los datos fiscales están completos.

Usar cuando:

- el trabajo ya terminó
- el monto ya no cambiará
- ya se puede emitir factura

### 4. `Facturada`

La factura ya fue emitida.

Aquí conviene guardar:

- folio
- fecha
- subtotal facturado
- IVA facturado
- total facturado

### 5. `Cancelada`

La factura o proceso fiscal fue cancelado.

Usar cuando:

- se canceló la factura emitida
- la OT cambió de condición fiscal
- hubo error en datos o monto

### Estado recomendado por defecto

La lógica recomendada sería:

- si `requiere_factura = false` -> `No requerida`
- si `requiere_factura = true` y faltan datos -> `Pendiente de datos`
- si `requiere_factura = true`, OT cerrada y datos completos -> `Lista para facturar`
- cuando se emite -> `Facturada`

---

## Diagramas PlantUML

Los diagramas visuales están en:

- [ot-operativa.puml](./diagrams/ot-operativa.puml)
- [ot-cobranza-finanzas.puml](./diagrams/ot-cobranza-finanzas.puml)
- [ot-facturacion.puml](./diagrams/ot-facturacion.puml)
- [ot-vista-general.puml](./diagrams/ot-vista-general.puml)

### Qué muestra cada uno

#### `ot-operativa.puml`

El ciclo operativo de la OT desde recepción hasta cierre y entrega.

#### `ot-cobranza-finanzas.puml`

Cómo se registran anticipos, cómo nace la cuenta por cobrar y cómo se conecta con caja/finanzas.

#### `ot-facturacion.puml`

Los estados propuestos de facturación y la separación entre IVA y utilidad.

#### `ot-vista-general.puml`

Una vista integral para explicar a negocio cómo se conectan OT, cotización, anticipos, cuenta por cobrar, cobro final y facturación.
