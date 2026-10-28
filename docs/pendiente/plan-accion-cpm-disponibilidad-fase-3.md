# Plan de acción — CPM, proyecciones y disponibilidad (fases 1 a 3)

**Proyecto:** ModaLink — frontend Vue 3  
**Ficha base:** `docs/backend/ficha-tecnica-cpm-disponibilidad-fase-3.md` (2026-10-27)  
**Alcance:** aplicar en el front el contrato de actividades con CPM, el endpoint de disponibilidad y las reglas de refresco de UC-26/UC-34.

> **Actualización 2026-10-27 — endpoints implementados.** La planificación y el
> cronograma quedaron separados:
>
> - `GET /proyectos/{id}/actividades` → tabla de **Planificación**: datos
>   básicos, fechas persistidas, predecesoras y `responsables`; **sin CPM**.
> - `GET /proyectos/{id}/cronograma` → tarjetas, ruta crítica, **Gantt** y
>   **tabla CPM detallada**.
> - `GET /proyectos/{id}/actividades/buscar` sigue siendo la búsqueda de
>   candidatos (visibilidad, requerimientos, sin responsables).
>
> T0.1 y T0.2 quedan cerradas. La Fase 2 se ajusta a las dos pestañas. Ver
> `docs/backend/aplicadas/ficha-tecnica-planificacion-actividades.md` y
> `docs/backend/aplicadas/ficha-tecnica-visualizar-cronograma.md`.

---

## 1. Objetivo

Que la UI distinga de forma explícita y consistente:

- fecha persistida vs. proyectada;
- proyección tentativa;
- actividad crítica;
- actividad con conflicto (con su motivo);
- cálculo parcial por falta de fecha de entrega;
- disponibilidad real, provisional y multi-miembro.

Sin recalcular CPM, holguras ni márgenes en JavaScript, y sin persistir proyecciones.

---

## 2. Estado actual verificado

### 2.1. Frontend

| Superficie | Estado |
|---|---|
| `src/utils/actividadConstants.js` | `ESTADOS_CRONOGRAMA` sólo define `NORMAL` y `ALERTA_DESBORDE`. No hay helpers de proyección/tentativa/parcial/holgura. |
| `src/services/actividadService.js` | JSDoc de `ActividadResponse` incompleto: faltan `critica`, `holguraMakespan`, `holguraEntrega`, `rangoInicio`, `rangoEjecucion`, `tentative` y el valor `SIN_FECHA_ENTREGA`. No existe método de disponibilidad. |
| `src/components/proyecto/TablaActividades.vue` | Usa fallback `fechaHoraInicio ?? inicioProyectado` y muestra el chip «Proyectada». No muestra tentativa, crítica, conflicto, parcial ni holguras. |
| `src/components/proyecto/CronogramaActividades.vue` | Ya dibuja proyección (opacidad), crítica (subrayado) y conflicto (pista roja). Debe alimentarse de `GET /proyectos/{id}/cronograma` y sumar la tabla CPM, tooltips y el popover al hacer click en una barra. |
| `src/components/proyecto/PlanificacionProyecto.vue` | Usa `buscar` para la tabla y calcula duración/margen localmente; muestra «Ruta crítica: Próximamente». Debe pasar la tabla a `GET /proyectos/{id}/actividades` y mover el margen/ruta crítica a la pestaña Cronograma. |
| `src/views/proyecto/ModificarActividadView.vue` | Muestra `estadoCronograma`, pero no crítica/conflicto/parcial/holguras ni el fallback proyectado. |
| `src/components/proyecto/ModalGestionPostulacion.vue` | Muestra sólo fechas persistidas; no usa proyecciones ni datos CPM. |
| `src/components/proyecto/ModalPostulacion.vue` | No consulta disponibilidad; sólo avisa que se verificará al enviar. |
| `src/utils/postulacionConstants.js` | Ya contempla `tentativa` de la respuesta de postulación y el 409 de disponibilidad. |
| Endpoint de disponibilidad | No integrado en ningún service. |
| Endpoint de Planificación | `GET /proyectos/{id}/actividades` implementado; no integrado en el service. |
| Endpoint de Cronograma | `GET /proyectos/{id}/cronograma` implementado; no integrado en el service. |

### 2.2. Backend (verificado en código, no sólo en la ficha)

- `ActividadResponse` incluye `critica`, `holguraMakespan`, `holguraEntrega`, `rangoInicio`, `rangoEjecucion`, `inicioProyectado`, `finProyectado`, `tentativo`, `conflicto`, `motivoConflicto`, `parcial` y `tentative`.
- `EstadoCronograma` tiene exactamente: `NORMAL`, `ALERTA_DESBORDE`, `SIN_FECHA_ENTREGA`.
- `GET /proyectos/{id}/actividades/{id}/disponibilidad` existe y devuelve `ResultadoDisponibilidad` con el contrato de la ficha §6.
- `GET /proyectos/{id}/actividades` existe: tabla de Planificación liviana, con `responsables`, sin CPM. Acceso `VER_PROYECTO`.
- `GET /proyectos/{id}/cronograma` existe: `resumen`, `actividades` para Gantt/tabla CPM, `rutaCritica` y `conflictos`. Acceso `VER_PROYECTO`.
- `GET /proyectos/{id}/actividades/buscar` (UC-52) sigue siendo la búsqueda de candidatos: **no devuelve CPM, proyecciones ni responsables**. Es intencional.
- `rangoInicio` y `rangoEjecucion` en `ActividadResponse` son `RangoFactible` con **minutos relativos a t0** (`inicioMinutos`, `finMinutos`), no fechas absolutas.
- `GET /proyectos/{id}/cronograma` ya entrega fechas absolutas (`inicioProyectado`, `finProyectado`, `finConHolgura`). El front no necesita convertir rangos.
- `DetalleMiembroDisponibilidad` sólo expone `idUsuario`; no incluye nombre artístico ni `idPerfil`.
- `GET /proyectos/{id}/actividades/{id}` ahora requiere `VER_PROYECTO`, no `MODIFICAR_ACTIVIDAD`.

### 2.3. Discrepancias ficha ↔ backend que condicionan el plan

1. **Resuelto:** la ficha documenta la separación Planificación/Cronograma y los permisos.
2. **Resuelto:** la tabla de Planificación no necesita CPM; el Gantt y la tabla CPM usan `/cronograma`.
3. **Resuelto:** el link a `ficha-tecnica-gestionar-postulaciones.md` apunta a `./aplicadas/`.
4. **Rangos CPM:** el front no los muestra; usa las fechas absolutas del cronograma. No hace falta exponer `RangoFactibleAbsoluto`.

---

## 3. Reglas de implementación

1. **Una sola fuente de verdad para fechas visibles**:
   `fechaHoraInicio ?? inicioProyectado` y `fechaHoraFin ?? finProyectado`. Nunca al revés.
2. **Proyección ≠ persistencia**: el fallback es sólo visual. No se envía en `PUT` ni se usa para habilitar acciones de escritura.
3. **`critica` y `conflicto` son independientes**: no derivar una de la otra ni de `holguraEntrega`.
4. **Booleanos estrictos**: evaluar `=== true`; los campos pueden ser `null`.
5. **`tentativo` manda**. `tentative` sólo se acepta como compatibilidad (`"true"` o `true`).
6. **No calcular CPM, holguras, márgenes ni desplazar horarios** en el front.
7. **Estados y motivos desconocidos** se muestran con un texto genérico, sin romper la UI ni asumir listas cerradas.
8. **Fechas locales**: no interpretar `LocalDateTime` como UTC.
9. **Nullable de punta a punta**: `inicioProyectado`, `inicioSeleccionado`, `finSeleccionado`, `holgura*`, `motivo*` y `miembros` pueden faltar o ser `null`.

---

## 4. Fases de implementación

### Fase 0 — Desbloqueos de contrato (backend)

> **Cerrada.** Los endpoints necesarios ya están implementados y documentados.

- **T0.1 — CPM en el listado. ✅ Cerrado.** Se separó en dos endpoints:
  - `GET /proyectos/{id}/actividades` para la tabla de Planificación (sin CPM);
  - `GET /proyectos/{id}/cronograma` para tarjetas, Gantt y tabla CPM.
  - Ambos requieren `VER_PROYECTO`; un miembro sin permiso de edición puede leerlos.
- **T0.2 — Rangos absolutos. ✅ Cerrado.** El front no muestra ventanas CPM; usa
  `inicioProyectado`, `finProyectado` y `finConHolgura` del cronograma.
- **T0.3 — (Opcional) nombres en disponibilidad multi-miembro.** Agregar `idPerfil` y `nombreArtistico` a `DetalleMiembroDisponibilidad` para no mostrar «Usuario 12».

### Fase 1 — Contrato local y utilidades

- **T1.1 — Actualizar `src/services/actividadService.js`.**
  - Agregar métodos:
    - `listarPlanificacion(idProyecto, params, signal)` → `GET /proyectos/{id}/actividades`.
    - `obtenerCronograma(idProyecto, signal)` → `GET /proyectos/{id}/cronograma`.
  - `ActividadResponse`: agregar `critica`, `holguraMakespan`, `holguraEntrega`, `rangoInicio`, `rangoEjecucion`, `tentative`.
  - `estadoCronograma`: `"NORMAL"|"ALERTA_DESBORDE"|"SIN_FECHA_ENTREGA"`.
  - Documentar que `holgura*` son minutos y que los rangos son relativos a `t0`; el front no los muestra.
  - `ActividadBusquedaResponse`: documentar que es solo para candidatos y que no incluye CPM ni responsables.
- **T1.2 — Crear `src/utils/cpmConstants.js`.**
  - `ESTADOS_CRONOGRAMA` con los tres valores + etiquetas + colores.
  - `etiquetaEstadoCronograma(valor)`: valor desconocido → texto crudo, nunca «—».
  - `esProyectada(actividad)`.
  - `esTentativa(actividad)` con fallback a `tentative`.
  - `esCritica`, `esConflictiva`, `esParcial` (estrictos).
  - `formatearHolgura(minutos)`: `null` → `""`; negativo → `−2 h 15 min`; sin cálculos.
  - `describirCpm(actividad)`: devuelve `[{ tipo, etiqueta, detalle }]` en orden estable (`Proyectada`, `Estimada`, `Crítica`, `Conflicto`, `Parcial`).
  - `textoProyeccion(actividad)`: tooltip único («Fecha proyectada por CPM; no está persistida» / «Proyección provisional hasta confirmar el proyecto»).
- **T1.3 — Serialización de `idPerfil` repetido.** Reutilizar `serializarParams` (ya soporta arrays) y validar manualmente el caso `idPerfil=10&idPerfil=11`.

**Aceptación:** ningún componente necesita lógica propia para interpretar flags CPM.

---

### Fase 2 — Planificación y Cronograma

- **T2.1 — `TablaActividades.vue` (pestaña Planificación).**
  - Cambiar la fuente a `GET /proyectos/{id}/actividades` (nuevo método en
    `actividadService`).
  - Columnas: `#`, Actividad, Responsables, Dur., Depende de, Inicio–Fin
    persistido, Estado y acciones.
  - Sin `Crítica`, `Holgura` ni fechas proyectadas.
  - `Responsables`: mostrar `nombreArtistico`; "Vos" comparando
    `idUsuario`/`idPerfil`; sin asignaciones → "-".
  - Los filtros (`nombre`, `estado`, etc.) siguen en servidor.
  - Las canceladas se muestran grises y sin acciones.
- **T2.2 — Pestaña Cronograma (nueva vista).**
  - Crear `CronogramaView.vue` o reutilizar `CronogramaActividades.vue` con
    `GET /proyectos/{id}/cronograma`.
  - Tarjetas: duración estimada, ruta crítica (`enRutaCritica`), margen hasta
    la entrega (`margenMinutos`).
  - Cadena de ruta crítica desde `resumen.rutaCritica`.
  - Gantt: barra sólida `inicioProyectado`→`finProyectado`; barra clara
    `finProyectado`→`finConHolgura`.
  - Tabla CPM: `#`, Actividad, Dur., Depende de, Inicio–Fin, Holgura, Crítica.
  - Chip "Crítica" y conteo usan `enRutaCritica`; "Holgura" usa
    `holguraMakespan`.
  - Tooltips: `holguraEntrega`, `rangoInicio`, `rangoEjecucion`, `conflicto`,
    `motivoConflicto`, `fijo`, `tentativo`.
  - Click en barra: popover con los datos de la fila; "Ver detalle completo"
    llama a `GET /actividades/{id}`.
  - No dibujar `rangoInicio`/`rangoEjecucion` como barras; son minutos.
- **T2.3 — `PlanificacionProyecto.vue` (contenedor de pestañas).**
  - Mantener dos pestañas: **Planificación** (tabla) y **Cronograma** (Gantt +
    tabla CPM).
  - Quitar el cálculo local de margen (`calcularMetricasPlanificacion(...).margenDias`).
  - La tabla usa `GET /actividades`; el cronograma usa `GET /cronograma`.
  - `SIN_FECHA_ENTREGA`: aviso de cálculo parcial en Cronograma, sin métricas
    de margen.
- **T2.4 — `ModificarActividadView.vue`.**
  - Resumen: `estadoCronograma`, chips CPM, `holguraMakespan`, `holguraEntrega`, `motivoConflicto`.
  - Fechas actuales con fallback y etiqueta de proyección.
  - Verificar manualmente que `buildModificarActividadRequest` no envíe fechas proyectadas (hoy no envía fechas).
- **T2.5 — `ModalGestionPostulacion.vue` (detalle de actividad).**
  - Fechas con fallback proyectado.
  - Mostrar chips de `Estimada`, `Crítica`, `Conflicto`, `Parcial` y `motivoConflicto` antes de aceptar.
  - Mantener el mensaje de error de actividad sin bloquear el resto del modal.

**Aceptación:** en una actividad sólo proyectada se ven fechas + «Proyectada»; una crítica no se pinta como error; una conflictiva muestra su motivo; una parcial no se presenta como confirmada.

---

### Fase 3 — Disponibilidad (endpoint UC-26/UC-70)

- **T3.1 — `src/services/actividadService.js`.**
  - Nuevo método:
    ```js
    obtenerDisponibilidad(idProyecto, idActividad, { idPerfil } = {}, signal)
    // GET /proyectos/{id}/actividades/{id}/disponibilidad?idPerfil=10&idPerfil=11
    ```
  - JSDoc con `ResultadoDisponibilidad`, `DetalleMiembroDisponibilidad`, `Intervalo`, códigos `401/403/404/409` y la aclaración de que es solo lectura.
- **T3.2 — Crear `src/utils/disponibilidadConstants.js`.**
  - `MOTIVOS_DISPONIBILIDAD` con los seis motivos de la ficha + etiquetas.
  - `mensajeMotivo(motivo)`: desconocido → «No hay disponibilidad suficiente para la actividad.»
  - `normalizarResultado(data)`: defaults seguros (`miembros: []`, `disponible: false`, `provisional: false`).
  - `formatearHuecos(huecos)` y `formatearVentana(inicio, fin)` reutilizando `fechas.js`.
  - No calcular huecos ni intersecciones.
- **T3.3 — Crear `src/components/proyecto/DisponibilidadActividad.vue`.**
  - Props: `idProyecto`, `idActividad`, `idPerfiles` (array, opcional), `autoCargar`, `titulo`.
  - Estados: cargando, error, sin datos, disponible, no disponible, provisional.
  - Cabecera: badge `Disponible` / `Sin disponibilidad`, badge `Provisional`, `inicioEvaluado`–`finEvaluado`.
  - Hueco elegido: `inicioSeleccionado`–`finSeleccionado` o «Sin hueco seleccionado».
  - Motivo: `motivo` con texto amigable + fallback.
  - Detalle por miembro: `idUsuario`, ventana evaluada, huecos y motivo individual. Si `miembros` viene vacío, no renderizar la sección (ficha §10.9).
  - Botón `Reconsultar` y emisión `actualizado`.
  - Manejo de errores: `409` actividad cancelada, `403` consulta de terceros, `404`, red/500 con reintento.
  - Abortar request al desmontar o cambiar de actividad/perfiles.
- **T3.4 — `ModalPostulacion.vue` (candidato).**
  - Al abrir una postulación `ACTIVIDAD`, consultar disponibilidad **sin `idPerfil`** (perfil activo).
  - Mostrar `DisponibilidadActividad` dentro del modal.
  - Si `disponible === false`: deshabilitar «Confirmar postulación», mostrar `motivo` y ofrecer «Revisar mi calendario» + «Reconsultar».
  - Si `provisional === true`: aviso visible pero permitir continuar (el backend acepta disponibilidad provisional).
  - Si la consulta falla por error técnico: permitir continuar con aviso («No pudimos verificar; el backend validará al enviar»), para no bloquear por un 500.
  - No reemplazar el 409 real del POST: mantener el manejo actual.
- **T3.5 — `GestionPostulaciones.vue` + `ModalGestionPostulacion.vue` (director).**
  - Al abrir una postulación `ACTIVIDAD`, consultar con `idPerfil = [postulacion.idPerfil]`.
  - Mostrar el panel en el modal; deshabilitar «Confirmar aceptación» si `disponible === false`.
  - Si hay `provisional`, avisar que la asignación se revalidará en UC-60/UC-70.
  - Ante `409` de disponibilidad: mantener el modal abierto, mostrar el mensaje del backend y ofrecer «Reconsultar».
  - Tras aceptar: refrescar listado, detalle de actividad y disponibilidad; emitir `gestionada` para que la vista padre invalide el proyecto.
- **T3.6 — (Opcional) `ActividadesPostulables.vue`.**
  - Agregar acción «Ver disponibilidad» por requerimiento que abra el modal/panel bajo demanda.
  - No consultar disponibilidad automáticamente por cada actividad (N requests).

**Aceptación:** el candidato ve su disponibilidad antes de postular; el director ve la del postulante antes de aceptar; un `null` en `inicioSeleccionado` no rompe; un motivo desconocido muestra texto genérico; un `409` no cierra el modal.

---

### Fase 4 — Refresco y consistencia

- **T4.1 — Invalidación tras cambios.**
  - Crear/modificar/eliminar actividad → refrescar planificación y disponibilidad (ya existe `tokenRefresco` en `PlanificacionProyecto`).
  - Cambios de jornada/bloqueos en calendario → no cachear disponibilidad; reconsultar al abrir.
  - Aceptar/rechazar postulación → refrescar listado + detalle + disponibilidad.
- **T4.2 — Aceptación de actividad.**
  - No crear asignaciones ni membresías localmente.
  - Tras aceptar, refrescar actividades/asignaciones y volver a consultar disponibilidad (ficha §10.11).
  - Si el backend responde `409`, dejar la postulación como `PENDIENTE` en la UI (no cambiarla localmente).
- **T4.3 — Proyecciones no persistidas.**
  - Confirmar que ningún formulario (`CrearActividadView`, `ModificarActividadView`) envía `inicioProyectado`/`finProyectado`.
  - `calcularInicioEstimado` de `CrearActividadView` se mantiene sólo como vista previa y rotulada «estimado»; no se envía ni se presenta como confirmada.
- **T4.4 — Documentación.**
  - Link de la ficha corregido a `docs/backend/aplicadas/ficha-tecnica-gestionar-postulaciones.md`.
  - Nuevas fichas: `ficha-tecnica-planificacion-actividades.md` y
    `ficha-tecnica-visualizar-cronograma.md`.
  - Registrar en el JSDoc del service que `buscar` es la búsqueda de candidatos
    y que la tabla usa `GET /actividades`.

---

### Fase 5 — QA

- **T5.1 — Pruebas E2E.** Se incorporarán con Playwright más adelante; por ahora no se agregan tests unitarios.
- **T5.2 — Build** (`npm run build`).
- **T5.3 — Matriz manual:** los casos de proyección/CPM aplican a la pestaña **Cronograma**; la tabla de Planificación muestra solo fechas persistidas.

| Caso | Resultado esperado |
|---|---|
| Actividad `PENDIENTE` con `fechaHoraInicio: null` y `inicioProyectado` | Fecha visible + «Proyectada»; tooltip aclara que no está persistida |
| `tentativo: true` | Chip «Estimada» + aviso de provisionalidad |
| `critica: true`, `conflicto: false` | Ruta crítica sin alerta de error |
| `conflicto: true` con `motivoConflicto` | Alerta + motivo; no se marca crítica automáticamente |
| `parcial: true` | «Cálculo parcial»; no se afirma fecha confirmada |
| `estadoCronograma: SIN_FECHA_ENTREGA` | Aviso de cálculo parcial; sin métricas de margen |
| Disponibilidad propia `disponible: true` | Hueco seleccionado visible |
| `disponible: false` con motivo conocido | Mensaje específico + acción bloqueada |
| `disponible: false` con motivo desconocido | Mensaje genérico |
| `provisional: true` | Badge «Provisional» y aviso de revalidación |
| `miembros: []` | Sección individual oculta, sin error |
| Multi-miembro sin hueco común | `SIN_HUECO_COMUN` + detalle por miembro |
| `inicioSeleccionado: null` | «Sin hueco seleccionado», sin excepción |
| POST/aceptar con 409 de disponibilidad | Modal abierto, mensaje del backend, listado reconsultado |
| Aceptar postulación de actividad | Se refrescan actividades/asignaciones; no se crea asignación local |
| Error 500 en consulta de disponibilidad | Se permite continuar con aviso; el backend sigue validando |

---

## 5. Orden y dependencias

```
Fase 0 (backend) ✅
Fase 1 ──> Fase 2 ──> Fase 4 ──> Fase 5
       └─> Fase 3 ──┘
```

- **Fase 1** puede empezar ya.
- **Fase 2** puede empezar ya: los endpoints de Planificación y Cronograma están disponibles. `ModificarActividadView` y `ModalGestionPostulacion` siguen usando `obtener`.
- **Fase 3** puede empezar ya: el endpoint está disponible.
- **Fase 4** depende de 2 y 3.

Tamaño relativo: F1 **S**, F2 **M/L**, F3 **M/L**, F4 **S**, F5 **S**.

---

## 6. Decisiones

### Resueltas

1. **CPM en el listado:** se separó en `GET /actividades` (tabla, sin CPM) y
   `GET /cronograma` (CPM, Gantt y tabla detallada).
2. **Rangos CPM:** el front no muestra ventanas; usa fechas absolutas del
   cronograma (`inicioProyectado`, `finProyectado`, `finConHolgura`).
3. **Métrica «Margen hasta la entrega»:** se toma de `resumen.margenMinutos`;
   no se calcula localmente.
4. **Bloqueo por disponibilidad:** se mantiene el criterio de bloquear sólo con
   `disponible === false`; si falla la consulta, se permite continuar con aviso.
5. **Nombres en multi-miembro:** sigue pendiente; por ahora se muestran ids de
   usuario.

### Abiertas para el front

1. **Diseño de la pestaña Cronograma:** confirmar si la tabla CPM va debajo del
   Gantt o en un panel lateral.
2. **Popover de barra:** confirmar contenido exacto; el backend entrega
   `descripcion`, fechas, holguras, conflicto y predecesoras.
3. **Filtros de la tabla de Planificación:** se mantienen en servidor; confirmar
   si el front necesita filtrado en cliente además del server-side.
4. **Formato de duraciones:** unificar el helper de minutos → días con el usado
   en la tabla actual.
