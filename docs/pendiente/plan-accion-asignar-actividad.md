# Plan de acción — UC-70 Asignar actividad a miembro

**Proyecto:** ModaLink — frontend Vue 3
**Ficha base:** `docs/backend/ficha-tecnica-asignar-actividad.md` (2026-10-29)
**Alcance:** integrar en el frontend el listado de miembros del proyecto, la
previsualización de disponibilidad y la asignación directa de una actividad a
un miembro, sin duplicar reglas de negocio ni persistir horarios.

> **Actualización 2026-10-29 — fases 1 a 3 implementadas.** Se agregaron los
> métodos `listarMiembros` y `asignar`, la utilidad de reglas/errores, el
> selector de miembros, el modal de asignación y la acción “Asignar” en la
> tabla de Planificación. El flujo principal queda conectado al dashboard y el
> build de producción pasa. Las fases 4 (accesos desde Cronograma/detalle) y 5
> (QA manual) quedan pendientes.

---

## 1. Objetivo

Que un director activo con permiso `ASIGNAR_ACTIVIDAD` pueda:

1. elegir una actividad de la planificación;
2. buscar y seleccionar un miembro activo del proyecto;
3. ver, antes de confirmar, si ese miembro tiene disponibilidad para la
   actividad;
4. confirmar la asignación contra `POST .../asignaciones`;
5. ver el resultado y refrescar planificación, cronograma y calendario.

La asignación **no agenda** la actividad. `inicioSeleccionado` y
`finSeleccionado` son sólo el hueco usado para validar; no se muestran como
horario definitivo ni se envían como fecha.

---

## 2. Lectura funcional de la ficha

### 2.1. Endpoints implicados

| Uso | Endpoint | Service actual |
|---|---|---|
| Listar miembros para el selector | `GET /proyectos/{idProyecto}/miembros` | No existe |
| Previsualizar disponibilidad | `GET /proyectos/{idProyecto}/actividades/{idActividad}/disponibilidad?idPerfil=...` | `actividadService.obtenerDisponibilidad` |
| Crear asignación | `POST /proyectos/{idProyecto}/actividades/{idActividad}/asignaciones` | No existe |

### 2.2. Datos que necesita el frontend

- **Selector de miembro:** `idMiembro` (sólo informativo), `idPerfil` (clave
  para el POST), `idUsuario`, `nombreArtistico`, `nombreUsuario`,
  `apellidoUsuario`, `idProfesion`, `nombreProfesion`, `rol`,
  `estadoParticipacion`.
- **Respuesta de asignación:** `idAsignacionActividad`, `idProyecto`,
  `idActividad`, `idMiembro`, `idPerfil`, `idUsuario`,
  `idRequerimientoActividad` (nullable), `requerimientoSatisfecho`,
  `provisional`, `inicioSeleccionado`, `finSeleccionado`,
  `resultadoPreferencia`, `desvioMinutos`.
- **Error de disponibilidad 409:** `message`, `motivo`, `provisional`,
  `inicioEvaluado`, `finEvaluado`, `miembrosBloqueantes`.

### 2.3. Reglas que el frontend debe respetar

1. El actor debe ser **director activo** con `ASIGNAR_ACTIVIDAD`.
2. El destinatario debe ser un **perfil activo con membresía activa**.
3. Se puede asignar a un director: no se vincula requerimiento y no consume
   cupo.
4. Un miembro no director puede quedar sin requerimiento si no hay uno de su
   profesión con cupo. `idRequerimientoActividad = null` es un resultado
   válido, no un error.
5. No se permiten duplicados `(miembro, actividad)`. El frontend puede marcar
   visualmente a los ya asignados, pero la verdad la impone el backend con
   `409`.
6. El proyecto debe estar en `Borrador`, `Publicado` o `Confirmado`.
7. La actividad no puede estar `CANCELADA` ni `FINALIZADA`.
8. El proyecto debe tener fecha de entrega.
9. La disponibilidad la calcula el backend: jornada, bloqueos, asignaciones
   existentes, margen y preferencia horaria. **No recalcular en JS.**
10. `provisional = true` no es error: significa que el proyecto aún no tiene
    fecha de inicio confirmada y el rango evaluado fue `[ahora, fechaEntrega]`.

---

## 3. Estado actual verificado en el frontend

| Superficie | Estado |
|---|---|
| `src/services/proyectoService.js` | No tiene método para listar miembros. |
| `src/services/actividadService.js` | Tiene `obtenerDisponibilidad`, pero no `asignar`. Ya documenta `profesionalesAsignados` y `responsables`. |
| `src/components/proyecto/DisponibilidadActividad.vue` | Ya soporta uno o varios `idPerfiles`, estados de carga/error, `provisional`, `motivo`, huecos y bloqueantes. Reutilizable. |
| `src/components/proyecto/TablaActividades.vue` | Sólo tiene acciones **Editar** y **Eliminar**. No hay acción de asignar. |
| `src/components/proyecto/PlanificacionProyecto.vue` | Ya calcula `puedeEditarActividad`, `puedeEliminarActividad` y `tieneFechaEntrega`. Puede aportar el permiso y el estado del proyecto. |
| `src/views/proyecto/DashboardProyectoView.vue` | Tiene `toast`, manejadores de error por status, `tokenRefrescoPlanificacion` y el patrón de modales del proyecto. Es el contenedor natural. |
| `src/components/proyecto/CronogramaProyecto.vue` | Permite seleccionar una actividad y cargar su detalle completo con `profesionalesAsignados`. Puede ser un segundo punto de entrada. |
| `src/views/proyecto/ActividadDetalleView.vue` | Ya carga el proyecto completo, por lo que dispone de `permisos` y `rolUsuario`. Puede ser un tercer punto de entrada opcional. |
| `src/utils/disponibilidadConstants.js` | Ya traduce `motivo`, normaliza la respuesta y formatea ventanas/huecos. |
| `src/utils/proyectoConstants.js` | Ya tiene `ROLES_PROYECTO`, etiquetas de rol y normalización de estados de proyecto. |
| `src/utils/actividadConstants.js` | Ya tiene estados de actividad y helpers de edición. |
| Router | No hace falta una ruta nueva: la asignación se resuelve con modales dentro del dashboard. |

### 3.1. Brechas principales

1. **Contrato faltante:** no existen `listarMiembros` ni `asignar` en los
   services.
2. **Sin punto de entrada:** la tabla de Planificación no ofrece la acción.
3. **Sin selector de miembros:** no hay componente que consuma el endpoint
   paginado y muestre rol/profesión.
4. **Sin flujo de confirmación:** no hay modal que combine miembro,
   disponibilidad y POST.
5. **Refresco:** no está definido qué se invalida después de asignar.

---

## 4. Decisiones de diseño recomendadas

### D1. Punto de entrada principal

Agregar la acción **Asignar** en la fila de `TablaActividades` (pestaña
Planificación). Es el lugar donde el director ya está eligiendo una actividad y
donde se conocen sus `responsables` (incluye `idPerfil`), lo que permite marcar
duplicados sin una request extra.

Como extensión opcional, agregar el mismo botón en el panel de detalle de
`CronogramaProyecto`. No se crea una vista nueva ni una pestaña nueva.

### D2. Selector paginado en servidor

El modal carga miembros con `page=0&size=20&todos=false` y ofrece:

- búsqueda por `nombre` con debounce;
- filtro por `rol` (`DIRECTOR` / `MIEMBRO`);
- paginación anterior/siguiente.

El filtro por `idProfesion` es opcional: agrega valor, pero requiere cargar el
catálogo de profesiones. Se puede dejar para una segunda iteración.

### D3. La previsualización incluye a los ya asignados

La ficha muestra `disponibilidad?idPerfil=50`, pero la regla 9 dice que la
verificación es la misma de UC-26/UC-34 e incluye **asignaciones existentes**.
Por eso el panel debe consultar:

```text
idPerfil = [perfilSeleccionado, ...perfilesYaAsignados]
```

`ModalGestionPostulacion.vue` ya aplica este patrón al aceptar una postulación
de actividad. Así el preview se aproxima al `POST` y evita mostrar
“Disponible” cuando el conjunto completo no lo está.

Si el backend sólo evaluara el perfil enviado, esta decisión sigue siendo
inocua: se envía el seleccionado y los asignados; el backend decide.

### D4. Bloqueo por disponibilidad

- `disponible === false` → deshabilitar **Confirmar asignación** y mostrar
  `motivo`, ventana evaluada y bloqueantes.
- Error técnico en la consulta (500/red) → permitir confirmar con aviso; el
  `POST` vuelve a validar. Mismo criterio que UC-26/UC-34.
- `provisional === true` → aviso ámbar, nunca error; se permite continuar.

### D5. Resultado exitoso

- Cerrar el modal y mostrar toast con el nombre del miembro y la actividad.
- Si `requerimientoSatisfecho === true`, indicar que el requerimiento quedó
  cubierto.
- Si `provisional === true`, indicar que la validación fue provisional.
- Si `resultadoPreferencia === "DESVIO"`, indicar el ajuste con
  `desvioMinutos`.
- Si `idRequerimientoActividad == null`, no mostrar error ni “sin cupo”: es
  normal en directores o cuando no hay requerimiento compatible.
- No insertar la asignación en el array local. Refrescar desde el backend.

### D6. Sin gestión de miembros completa

El endpoint de miembros se usa sólo para el selector. No se implementa en esta
ficha un ABM de membresías ni una pestaña “Miembros”.

---

## 5. Fases de implementación

### Fase 0 — Validación de contrato (S)

- **T0.1 — Confirmar endpoints en el backend desplegado.**
  - `GET /proyectos/{id}/miembros` responde con el shape de la ficha §2.1.
  - Acepta `nombre`, `rol`, `idProfesion`, `page`, `size`, `todos`.
  - Sólo devuelve miembros `ACTIVO`.
  - `POST .../asignaciones` responde `201` con el shape de §2.3.
- **T0.2 — Confirmar mensajes y body de error.**
  - El `409` de disponibilidad trae `motivo`, `provisional`,
    `inicioEvaluado`, `finEvaluado` y `miembrosBloqueantes`.
  - Confirmar los textos de duplicado, miembro inactivo, sin agenda y estados.
- **T0.3 — Confirmar semántica de disponibilidad.**
  - ¿El endpoint evalúa sólo los `idPerfil` enviados o también las
    asignaciones existentes? Si evalúa sólo los enviados, el front debe enviar
    seleccionado + asignados (D3).

**Aceptación:** no hay dudas de contrato antes de escribir componentes.

---

### Fase 1 — Services, tipos y utilidades (S)

- **T1.1 — `src/services/proyectoService.js`: listar miembros.**
  - Agregar typedefs:
    - `MiembroProyectoResponse`
    - `PaginaMiembrosResponse`
    - `BuscarMiembrosParams`
  - Agregar método:

    ```js
    listarMiembros(idProyecto, params = {}, signal)
    // GET /proyectos/{id}/miembros?nombre=&rol=&idProfesion=&page=0&size=20&todos=false
    ```

  - Documentar errores: `403` sin `VER_PROYECTO` o sin membresía activa;
    `404` perfil activo/proyecto inexistente.
  - No enviar parámetros vacíos.

- **T1.2 — `src/services/actividadService.js`: asignar.**
  - Agregar typedef `AsignacionActividadResponse`.
  - Agregar método:

    ```js
    asignar(idProyecto, idActividad, idPerfil, signal)
    // POST /proyectos/{id}/actividades/{id}/asignaciones
    // body: { idPerfil }
    ```

  - Documentar `201`, `400`, `403`, `404`, `409` y que
    `idRequerimientoActividad` puede ser `null`.
  - No enviar `idMiembro`, `idUsuario`, `idProyecto` ni `idActividad` en el
    body.

- **T1.3 — Crear `src/utils/asignacionConstants.js`.**
  - `PERMISO_ASIGNAR_ACTIVIDAD = "ASIGNAR_ACTIVIDAD"`.
  - `ESTADOS_PROYECTO_ASIGNABLES` con `Borrador`, `Publicado`, `Confirmado`.
  - `ESTADOS_ACTIVIDAD_NO_ASIGNABLES` con `CANCELADA`, `FINALIZADA`.
  - `puedeAsignarActividad({ proyecto, actividad, tieneFechaEntrega })`:
    - `proyecto.rolUsuario === "DIRECTOR"`;
    - `proyecto.permisos` incluye `ASIGNAR_ACTIVIDAD`;
    - estado del proyecto permitido;
    - estado de actividad permitido;
    - fecha de entrega presente.
  - `motivoNoAsignable({ ... })`: texto para el tooltip del botón.
  - `estaPerfilAsignado(actividad, idPerfil)`: compara contra
    `responsables[].idPerfil` y `profesionalesAsignados[].idPerfil`, con
    comparación por string.
  - `normalizarAsignacion(data)`: defaults seguros.
  - `clasificarErrorAsignacion(error)`: devuelve
    `{ tipo, mensaje, motivo, provisional, inicioEvaluado, finEvaluado, miembrosBloqueantes, erroresCampo }`.
    Tipos mínimos:
    - `PERFIL_INVALIDO`
    - `SIN_FECHA_ENTREGA`
    - `SIN_PERMISO`
    - `NO_ENCONTRADO`
    - `PERFIL_INACTIVO`
    - `MIEMBRO_INACTIVO`
    - `DUPLICADO`
    - `ESTADO_INVALIDO`
    - `SIN_AGENDA`
    - `SIN_DISPONIBILIDAD`
    - `DESCONOCIDO`
  - `mensajeExitoAsignacion(data, miembro, actividad)`.
  - `TEXTOS_ASIGNACION` con textos de UI.
  - La detección del `409` de disponibilidad debe priorizar la presencia de
    `motivo`/`inicioEvaluado`; no depender sólo de una regex.

**Aceptación:** los componentes no interpretan estados, permisos ni errores
por su cuenta. Los helpers son puros y fáciles de probar.

---

### Fase 2 — Selector de miembros y modal (M/L)

- **T2.1 — Crear `src/components/proyecto/SelectorMiembroProyecto.vue`.**
  - Props:
    - `idProyecto` (obligatorio)
    - `modelValue` (`idPerfil` seleccionado o `null`)
    - `idPerfilesAsignados` (array, opcional para marcar “ya asignado”)
    - `deshabilitado` (boolean)
  - Emits:
    - `update:modelValue`
    - `seleccionado` con el objeto completo del miembro
  - Estado:
    - `miembros`, `paginacion`, `cargando`, `error`, `puedeReintentar`;
    - `filtros = { nombre, rol }`.
  - Comportamiento:
    - cargar al montar y al cambiar filtros/página;
    - debounce de 350 ms para `nombre`;
    - abortar request anterior;
    - no cargar si falta `idProyecto`;
    - estados vacío, error y reintento.
  - Render por miembro:
    - `nombreArtistico` como principal;
    - `nombreUsuario apellidoUsuario` como secundario;
    - `nombreProfesion` + chip de rol;
    - indicador “Ya asignado” si corresponde (sólo visual);
    - aviso “Director: no consume cupo” cuando `rol === "DIRECTOR"`.
  - Accesibilidad:
    - cada opción es un `button` o radio con `aria-pressed`/`aria-checked`;
    - nombre accesible completo;
    - no depender sólo del color.
  - Errores:
    - `403` → “No tenés permiso para ver los miembros de este proyecto.”
    - `404` perfil/proyecto → refrescar sesión o mensaje;
    - `500`/red → reintento.

- **T2.2 — Crear `src/components/proyecto/ModalAsignarActividad.vue`.**
  - Props:
    - `modelValue`
    - `idProyecto`
    - `actividad`
    - `nombreProyecto`
    - `idPerfilesAsignados`
    - `tieneFechaEntrega`
    - `asignando`
    - `error`
  - Emits:
    - `update:modelValue`
    - `confirmar` con `{ idPerfil, miembro }`
  - Estructura:
    1. Cabecera: “Asignar actividad” + nombre de la actividad.
    2. Resumen de la actividad: duración, estado, fechas persistidas si
       existen. No mostrar proyecciones CPM como horario confirmado.
    3. Selector de miembro.
    4. Panel `DisponibilidadActividad` cuando hay miembro seleccionado.
    5. Aviso si el proyecto no tiene fecha de entrega.
    6. Error del POST.
    7. Footer: Cancelar / Confirmar asignación.
  - Disponibilidad:
    - `idPerfiles = [seleccionado, ...idPerfilesAsignados]`;
    - `sinFechaEntrega` cuando corresponda;
    - `tokenRefresco` se incrementa al cambiar de miembro o tras un `409`;
    - título “Disponibilidad del miembro y asignados” si hay asignados.
  - Deshabilitar confirmar si:
    - no hay miembro;
    - `asignando`;
    - no hay fecha de entrega;
    - `disponibilidad?.disponible === false`.
  - Al cerrar/desmontar: abortar disponibilidad y limpiar selección.
  - Al cambiar de miembro: limpiar error y reconsultar disponibilidad.
  - No hacer el POST desde el modal: lo hace el contenedor, igual que
    `ModalGestionPostulacion`.

**Aceptación:** se puede buscar, seleccionar y previsualizar disponibilidad sin
salir del dashboard; cerrar y reabrir no conserva estado viejo.

---

### Fase 3 — Integración en Planificación y POST (M)

- **T3.1 — `TablaActividades.vue`.**
  - Nueva prop `puedeAsignar`.
  - Nueva acción con icono `person_add` (o `group_add`), título accesible
    “Asignar miembro”.
  - Emit `asignar-actividad` con la actividad.
  - Deshabilitar y explicar por tooltip cuando no se puede asignar:
    - sin permiso;
    - proyecto en estado no permitido;
    - actividad `FINALIZADA`/`CANCELADA`;
    - proyecto sin fecha de entrega.
  - Mantener las acciones actuales y el ancho de la tabla.

- **T3.2 — `PlanificacionProyecto.vue`.**
  - Computed `puedeAsignarActividad` usando `proyecto`, `permisos`,
    `estadoNormalizado` y `tieneFechaEntrega`.
  - Pasar `:puede-asignar` a `TablaActividades`.
  - Reenviar `@asignar-actividad` al padre.
  - No cargar miembros ni disponibilidad desde aquí.

- **T3.3 — `DashboardProyectoView.vue`.**
  - Estado:
    - `modalAsignarVisible`
    - `actividadAsignar`
    - `asignando`
    - `errorAsignar`
    - controlador no reactivo para el POST.
  - Abrir modal:
    - validar permiso/estado/fecha antes de abrir;
    - guardar actividad;
    - limpiar error;
    - obtener `idPerfilesAsignados` desde `actividad.responsables` (Planificación).
  - Confirmar:
    - `actividadService.asignar(idProyecto, idActividad, idPerfil, signal)`;
    - cerrar modal solo con `201`;
    - toast con `mensajeExitoAsignacion`;
    - incrementar `tokenRefrescoPlanificacion` para refrescar Planificación y
      Cronograma;
    - refrescar notificaciones del perfil activo sólo si el asignado es el
      mismo perfil; el trigger notifica al destinatario, no al actor;
    - no modificar arrays locales.
  - Errores:
    - `400`: mostrar `errores.idPerfil` o el mensaje de fecha de entrega;
    - `403`: cerrar modal, toast y recargar el proyecto;
    - `404`: cerrar modal, toast, recargar; si es perfil, refrescar sesión y
      volver al dashboard;
    - `409`:
      - miembro/perfil inactivo → mantener modal, mostrar mensaje, refrescar
        lista de miembros;
      - duplicado → mantener modal, marcar al miembro y refrescar planificación;
      - estado no permitido → cerrar modal, toast y recargar proyecto;
      - sin agenda → mantener modal y mostrar el mensaje;
      - sin disponibilidad → mantener modal, mostrar motivo/ventana/
        bloqueantes y reconsultar disponibilidad;
    - `500`/red → mantener modal con reintento.
  - Nunca tratar `provisional` como error.

- **T3.4 — Refresco posterior.**
  - Planificación: `tokenRefrescoPlanificacion++` (ya refresca tabla y
    cronograma).
  - Cronograma: se invalida con el mismo token.
  - Calendario: no se cachea; se reconsulta al abrir. No hace falta una llamada
    extra desde este flujo.
  - Proyecto: recargar sólo si el error lo exige o si se necesita actualizar
    cupos en “Personal requerido”. La tabla de Planificación ya muestra
    responsables.
  - Notificaciones: refrescar el resumen del perfil activo si el asignado es el
    perfil activo; en caso contrario, no forzar una llamada ajena.

**Aceptación:** desde Planificación se asigna un miembro, se ve el resultado y
la tabla/cronograma reflejan la asignación sin recargar la página.

---

### Fase 4 — Puntos de entrada secundarios (S/M, opcional)

- **T4.1 — `CronogramaProyecto.vue`.**
  - Prop `puedeAsignar`.
  - En el panel de actividad seleccionada, botón “Asignar miembro”.
  - Emit `asignar-actividad` con la actividad y los `idPerfil` de
    `detalleCompleto.profesionalesAsignados`.
  - Si el detalle completo no se cargó, cargarlo antes de abrir el modal para
    conocer los asignados; o pasar un array vacío y dejar que el backend
    revalide. Preferible cargarlo para que el preview sea correcto.

- **T4.2 — `ActividadDetalleView.vue`.**
  - Mostrar “Asignar miembro” sólo si el proyecto cargado indica
    `rolUsuario === "DIRECTOR"` y `permisos` incluye `ASIGNAR_ACTIVIDAD`.
  - Reutilizar el modal y el mismo manejo de errores.
  - No mostrarlo a visitantes ni a miembros sin permiso.

- **T4.3 — No hacer.**
  - No crear una ruta nueva.
  - No crear una pestaña “Miembros”.
  - No implementar un endpoint alternativo ni una asignación local.

**Aceptación:** la acción está disponible en los lugares donde el director ya
trabaja con la actividad, sin duplicar lógica.

---

### Fase 5 — QA, build y documentación (S)

- **T5.1 — Build:** `npm run build`.
- **T5.2 — Matriz manual:**

| Caso | Resultado esperado |
|---|---|
| Director con `ASIGNAR_ACTIVIDAD` | Ve la acción “Asignar” |
| Miembro sin permiso | No ve la acción; no hay requests de miembros |
| Proyecto `Finalizado`/`Cancelado` | Acción deshabilitada con motivo |
| Actividad `FINALIZADA`/`CANCELADA` | Acción deshabilitada con motivo |
| Proyecto sin fecha de entrega | Acción deshabilitada; tooltip pide completar la fecha |
| Abrir modal | Carga miembros activos paginados |
| Buscar por nombre | Filtra en servidor con debounce |
| Filtro por rol | Devuelve directores/miembros según corresponda |
| Miembro ya asignado | Se marca; el backend igual puede responder 409 |
| Seleccionar director | Aviso “no consume cupo”; asignación con `idRequerimientoActividad = null` |
| Miembro con requerimiento compatible | Asignación vincula requerimiento; `requerimientoSatisfecho` se refleja |
| Miembro sin requerimiento compatible | Asignación exitosa sin requerimiento; sin error |
| Preview `disponible: false` | Confirmar deshabilitado; motivo y ventana visibles |
| Preview `disponible: true` | Confirmar habilitado |
| Preview `provisional: true` | Aviso ámbar; se permite continuar |
| Error técnico en preview | Aviso; se permite continuar; el POST decide |
| POST 409 duplicado | Modal abierto; mensaje específico; listado refrescado |
| POST 409 miembro inactivo | Modal abierto; mensaje; lista de miembros refrescada |
| POST 409 sin agenda | Modal abierto; mensaje específico |
| POST 409 sin disponibilidad | Modal abierto; motivo/ventana/bloqueantes; confirmar deshabilitado |
| POST 409 estado inválido | Modal cerrado; toast; proyecto y planificación refrescados |
| POST 403 | Toast; proyecto recargado; sin estado inconsistente |
| POST 404 | Toast; recarga o vuelta al dashboard según recurso |
| POST 500/red | Modal abierto con reintento |
| Asignación exitosa | Toast; tabla y cronograma refrescados; sin mutación local |
| Asignarse a sí mismo | Se refresca el resumen de notificaciones del perfil activo |
| Mobile | Modal usable, selector y footer sin recortes |
| Tema claro/oscuro | Sólo tokens del tema; contraste legible |
| Teclado | Foco, Enter/Espacio, Escape y `aria-busy` funcionan |

- **T5.3 — Documentación.**
  - Al cerrar la implementación, mover la ficha a
    `docs/backend/aplicadas/` o actualizar su estado, siguiendo la convención
    del repositorio.
  - Registrar en el JSDoc de los services que `listarMiembros` es sólo para el
    selector y que `asignar` no agenda horarios.

---

## 6. Archivos previstos

**Nuevos**

- `src/components/proyecto/ModalAsignarActividad.vue`
- `src/components/proyecto/SelectorMiembroProyecto.vue`
- `src/utils/asignacionConstants.js`

**Modificados**

- `src/services/proyectoService.js` — `listarMiembros` + typedefs
- `src/services/actividadService.js` — `asignar` + typedefs
- `src/components/proyecto/TablaActividades.vue` — acción “Asignar”
- `src/components/proyecto/PlanificacionProyecto.vue` — permiso y evento
- `src/views/proyecto/DashboardProyectoView.vue` — modal, POST y refresco
- `src/components/proyecto/CronogramaProyecto.vue` — opcional, segundo acceso
- `src/views/proyecto/ActividadDetalleView.vue` — opcional, tercer acceso

**Sin cambios**

- Router.
- Backend.
- `DisponibilidadActividad.vue` (se reutiliza tal cual).
- Reglas de CPM, holguras y márgenes.

---

## 7. Riesgos y cuidados

1. **`idPerfil` vs `idMiembro`:** el POST usa `idPerfil`; el selector debe
   guardar y emitir ese campo, no `idMiembro`.
2. **Director:** no asumir que `idRequerimientoActividad` existe ni que se
   consume cupo.
3. **Duplicados:** marcar “ya asignado” es sólo ayuda visual; el `409` del
   backend es la fuente de verdad.
4. **Disponibilidad:** no calcular huecos, intersecciones ni márgenes. Enviar
   seleccionado + asignados y mostrar lo que devuelve el backend.
5. **`miembrosBloqueantes`:** son `idUsuario`, no `idPerfil` ni nombres. No
   inventar etiquetas; mostrar “Usuario #N” si no hay nombre.
6. **Provisional:** no es error. Mostrar aviso y permitir continuar.
7. **Fechas:** `inicioSeleccionado`/`finSeleccionado` son sólo validación. No
   persistirlos ni mostrarlos como horario confirmado.
8. **Estados:** el proyecto usa forma legible (`"Borrador"`) y la actividad
   mayúsculas (`"CANCELADA"`). Usar los normalizadores existentes.
9. **Concurrencia:** abortar requests al cerrar/cambiar de miembro; bloquear
   doble submit con `asignando`.
10. **Permisos:** combinar `rolUsuario === "DIRECTOR"` con
    `permisos.includes("ASIGNAR_ACTIVIDAD")`; no alcanza con uno solo.
11. **Refresco:** no mutar la tabla localmente; reconsultar para respetar
    requerimientos y cupos calculados por el backend.
12. **Notificaciones:** el trigger notifica al asignado, no al director. No
    refrescar contadores ajenos.

---

## 8. Orden, dependencias y tamaño

```text
Fase 0 (contrato)
      │
      ▼
Fase 1 (services/utilidades)
      │
      ▼
Fase 2 (selector + modal)
      │
      ▼
Fase 3 (Planificación + POST + refresco)
      │
      ├──> Fase 4 (accesos secundarios, opcional)
      │
      ▼
Fase 5 (QA + build + documentación)
```

| Fase | Tamaño | Depende de |
|---|---|---|
| 0 — Validación de contrato | S | — |
| 1 — Services y utilidades | S | 0 |
| 2 — Selector y modal | M/L | 1 |
| 3 — Integración principal | M | 2 |
| 4 — Accesos secundarios | S/M | 3 |
| 5 — QA y build | S | 3 (y 4 si se hace) |

**Camino crítico:** F0 → F1 → F2 → F3 → F5.

---

## 9. Decisiones abiertas

1. **Disponibilidad con asignados:** confirmar si el backend ya considera las
   asignaciones existentes o si el front debe enviarlas. Recomendación:
   enviarlas siempre (D3).
2. **Filtro por profesión:** ¿se incluye en la primera entrega? Requiere el
   catálogo de profesiones; el filtro por nombre y rol cubre el caso básico.
3. **Accesos secundarios:** ¿Cronograma y detalle de actividad entran en esta
   entrega o quedan para una siguiente? La acción principal en Planificación es
   suficiente para cerrar UC-70.
4. **Resultado persistente:** ¿alcanza con toast o se quiere un banner con
   “requerimiento cubierto / validación provisional”? Recomendación: toast
   enriquecido; sin banner nuevo.
5. **Miembros inactivos:** la ficha dice que el endpoint devuelve sólo
   `ACTIVO`. Si el backend cambiara, el selector debe filtrar igual por
   `estadoParticipacion === "ACTIVO"` como defensa.

---

## 10. Definición de terminado

- [ ] `listarMiembros` y `asignar` documentados y usados por la UI.
- [ ] El botón “Asignar” aparece sólo para director activo con
      `ASIGNAR_ACTIVIDAD`, proyecto y actividad en estado permitido, y fecha de
      entrega definida.
- [ ] El selector busca, filtra y pagina miembros activos.
- [ ] El modal muestra disponibilidad del miembro seleccionado y de los ya
      asignados.
- [ ] `provisional` se muestra como aviso, no como error.
- [ ] `idRequerimientoActividad = null` no rompe la UI.
- [ ] Los `409` se distinguen y el modal se mantiene abierto cuando el usuario
      puede corregir (duplicado, inactivo, sin agenda, sin disponibilidad).
- [ ] Tras un `201` se refrescan planificación y cronograma; calendario y
      notificaciones quedan consistentes.
- [ ] No se crean asignaciones ni horarios localmente.
- [ ] `npm run build` pasa.
- [ ] Ficha y documentación de estado actualizadas.
