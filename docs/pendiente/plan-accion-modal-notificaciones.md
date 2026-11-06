# Plan de acción — modal pequeño de notificaciones

**Referencia visual:** `docs/pantallas/notificacion_modal.jpeg`
**Alcance:** implementar un panel/popover de notificaciones reutilizable.
**Importante:** se toma **solo la estructura** de la imagen. No se copian colores,
tipografías ni medidas exactas; se usan los tokens del tema actual.

---

## 1. Estructura a replicar

```text
┌──────────────────────────────────────────────────────┐
│ Notificaciones                 2 sin leer  Marcar todas │
├──────────────────────────────────────────────────────┤
│ (icono)  Título de la notificación              •     │
│          Mensaje, hasta 2 líneas.                     │
│          28 oct 2026, 17:48     Ver ... →             │
├──────────────────────────────────────────────────────┤
│ (icono)  Otra notificación                      •     │
│          ...                                          │
├──────────────────────────────────────────────────────┤
│            Ver todas las notificaciones               │
└──────────────────────────────────────────────────────┘
```

Elementos:

1. **Cabecera**
   - Título.
   - Contador de no leídas.
   - Acción `Marcar todas`, deshabilitada si no hay no leídas.
   - Separador inferior.
2. **Lista scrolleable**
   - Icono en círculo a la izquierda.
   - Título en negrita y mensaje debajo.
   - Pie con fecha y link contextual (`Ver proyecto`, `Ver postulaciones`, etc.).
   - Punto de no leída a la derecha.
   - Separador entre filas.
3. **Pie fijo**
   - Link centrado `Ver todas las notificaciones`.

---

## 2. Estado actual

- No existe un modal/popover de notificaciones.
- `HomeLayout` tiene un botón de navegación que va directo a la vista completa.
- `UserDashboardLayout` tiene un botón lateral que también va directo a la vista completa.
- `NotificacionesView` ya resuelve:
  - listado paginado;
  - filtros;
  - marcar una/todas como leídas;
  - destino por tipo;
  - activación del perfil de la notificación antes de navegar.
- El DTO no trae un campo `titulo`: sólo `tipo`, `mensaje`, `fechaGenerada`,
  `leida`, `idPerfilContexto`, `idProyecto`, etc.

### Decisión de contenido

| Elemento visual | Dato a usar |
|---|---|
| Título de la fila | `etiquetaTipoNotificacion(tipo)` |
| Mensaje | `mensaje` |
| Fecha | `fechaGenerada` en formato corto |
| Link | `destinoNotificacion(notificacion)` |
| Punto no leída | `!notificacion.leida` |
| Contador | `notificacionState.noLeidasPerfil/Usuario` |

Si más adelante el backend agrega `titulo`, el componente puede priorizarlo sin
cambiar la estructura.

---

## 3. Fases

### Fase 1 — Extraer presentación y navegación compartida

Objetivo: que la vista completa y el modal no dupliquen reglas.

- **T1.1 — Centralizar etiquetas e iconos.**
  - Mover `etiquetaTipo` e `iconoPorTipo` desde `NotificacionesView` a
    `src/utils/notificacionConstants.js` como:
    - `etiquetaTipoNotificacion(tipo)`
    - `iconoNotificacion(tipo)`
  - Mantener el fallback actual (`tipo` crudo y `notifications`).

- **T1.2 — Extraer la navegación.**
  - Crear `src/utils/notificacionNavegacion.js` con:
    - `hrefNotificacion(notificacion, router)`
    - `navegarANotificacion(notificacion, router)`
  - Mover allí la lógica de activar `idPerfilContexto` si no coincide con el
    perfil activo, y el manejo de error.
  - `NotificacionesView` y el modal usan la misma función.

- **T1.3 — Fecha compacta.**
  - Agregar helper en `src/utils/fechas.js` para el formato de la imagen
    (`28 oct 2026, 17:48`) o reutilizar el formateador actual si se decide
    mantener `dd/mm/aaaa hh:mm`.
  - No interpretar `fechaGenerada` como UTC.

**Aceptación:** la vista completa sigue funcionando igual y no queda lógica de
navegación duplicada.

---

### Fase 2 — Componente de fila

- **T2.1 — Crear `src/components/notificaciones/NotificacionItem.vue`.**
  - Props:
    - `notificacion` (obligatoria)
    - `compacta` (boolean, default `true`)
  - Emits:
    - `navegar`
    - `marcar-leida`
  - Render:
    - círculo con icono;
    - título (etiqueta del tipo);
    - mensaje con `line-clamp: 2`;
    - fecha + link si `destino != null`;
    - punto de no leída con texto accesible.
  - El link usa `hrefNotificacion` y emite `navegar` con `preventDefault`.

- **T2.2 — Estilos estructurales.**
  - `display: grid; grid-template-columns: auto 1fr auto`.
  - Separador inferior.
  - Sin colores hardcodeados: `var(--color-surface)`,
    `var(--color-text)`, `var(--color-text-muted)`, `var(--color-primary)`,
    `var(--color-border)`, etc.
  - Título y mensaje con corte por elipsis/líneas.

**Aceptación:** una notificación larga no rompe el ancho ni empuja el punto de
no leída.

---

### Fase 3 — Panel/popover

- **T3.1 — Crear `src/components/notificaciones/NotificacionesPopover.vue`.**
  - Props:
    - `modelValue` (abierto/cerrado)
    - `idPerfilContexto` (number|null)
    - `rutaVerTodas` (objeto de ruta)
    - `limite` (default `6`)
  - Emits:
    - `update:modelValue`
    - `ver-todas`
    - `actualizado`
  - Datos:
    - `notificaciones`
    - `cargando`
    - `error`
    - `marcandoTodas`
    - `marcandoId`
  - Métodos:
    - `cargar()`: `GET /notificaciones?idPerfilContexto=&page=0&size=limite`.
    - `cargarResumen()`: perfil o usuario según `idPerfilContexto`.
    - `marcarTodas()`: `PATCH /notificaciones/leidas`.
    - `marcarLeida(notificacion)`.
    - `navegar(notificacion)`: usa la utilidad compartida y luego cierra.
    - `cerrar()`.
  - Mapear cada ítem agregando `destino: destinoNotificacion(notificacion)`.

- **T3.2 — Estructura del panel.**
  - Cabecera:
    - `Notificaciones`.
    - `${noLeidas} sin leer` o `Sin novedades`.
    - botón `Marcar todas`.
  - Cuerpo con `max-height` y `overflow-y: auto`.
  - Pie sticky con `Ver todas las notificaciones`.
  - Estados:
    - cargando (skeleton o texto);
    - error con reintento;
    - vacío.
  - Ancho `min(420px, calc(100vw - 2rem))`.
  - `max-height: min(70vh, 520px)`.

- **T3.3 — Comportamiento.**
  - Cargar sólo al abrir, no al montar el layout.
  - Al cerrar, abortar la request si sigue en vuelo.
  - Escape y click fuera cierran.
  - Devolver el foco al botón que abrió.
  - `Marcar todas` actualiza filas, contador y badge del layout.
  - `Ver todas` cierra el panel y navega a la vista completa.
  - No hacer polling.

**Aceptación:** el panel replica la estructura de la imagen y funciona sin
perfil activo (la navegación activa el perfil de contexto).

---

### Fase 4 — Integración en layouts

- **T4.1 — `HomeLayout.vue` (principal).**
  - Envolver el botón de notificaciones en un contenedor `position: relative`.
  - Cambiar el click: en vez de navegar, alternar el popover.
  - Mantener el badge de no leídas.
  - Agregar `@click.stop` para que el cierre del menú de perfil no interfiera.
  - Cerrar el menú de perfil al abrir notificaciones y viceversa.
  - `rutaVerTodas: { name: 'notificaciones-perfil' }`.
  - Prop `idPerfilContexto: idActivo`.

- **T4.2 — `UserDashboardLayout.vue` (opcional, misma fase).**
  - Reutilizar el popover desde el botón lateral.
  - Posicionarlo a la derecha del sidebar o como panel fijo en mobile.
  - `rutaVerTodas: { name: 'notificaciones-usuario' }`.
  - Si se prefiere un cambio mínimo, dejar el botón lateral navegando a la
    vista completa y limitar el popover al topbar.

- **T4.3 — `AdminLayout.vue`.**
  - Fuera de alcance. Mantiene su link actual.

**Aceptación:** desde el topbar se abre el panel; el footer lleva a la vista
completa; el badge se actualiza sin recargar la página.

---

### Fase 5 — QA y build

- `npm run build`.
- Casos manuales:

| Caso | Esperado |
|---|---|
| Abrir panel | Carga sólo al abrir; muestra hasta `limite` filas |
| 0 notificaciones | Estado vacío, sin “Marcar todas” activo |
| Muchas no leídas | Contador correcto y badge del layout |
| Marcar todas | Filas y contador en 0; badge actualizado |
| Click en link | Marca leída, activa perfil si hace falta y navega |
| Sin perfil activo | Activa `idPerfilContexto`; si falla, muestra error |
| Destino nulo | Fila sin link, sin romper |
| Mensaje largo | Máximo 2 líneas con elipsis |
| Escape / click fuera | Cierra y devuelve foco |
| Mobile | Panel dentro del viewport, sin recortes |
| Tema claro/oscuro | Sólo tokens; contraste legible |

---

## 4. Archivos previstos

**Nuevos**

- `src/components/notificaciones/NotificacionItem.vue`
- `src/components/notificaciones/NotificacionesPopover.vue`
- `src/utils/notificacionNavegacion.js`

**Modificados**

- `src/utils/notificacionConstants.js` (etiquetas/iconos compartidos)
- `src/utils/fechas.js` (fecha compacta, si se agrega)
- `src/views/usuario/NotificacionesView.vue` (usar helpers compartidos)
- `src/components/home/HomeLayout.vue` (trigger + popover)
- `src/components/usuario/UserDashboardLayout.vue` (opcional)

**Sin cambios**

- Backend y contrato de `NotificacionResponse`.
- Reglas de `destinoNotificacion`.
- Rutas existentes.

---

## 5. Riesgos y cuidados

1. **Posicionamiento:** el topbar no tiene `overflow: hidden`, pero el panel
   debe quedar por encima del menú de perfil (`z-index`).
2. **Doble contador:** el badge del layout y el contador del panel deben usar
   `notificacionState`; no crear estado paralelo.
3. **Sin perfil activo:** no duplicar la navegación; reutilizar la utilidad que
   activa `idPerfilContexto`.
4. **Carga innecesaria:** no pedir notificaciones en cada render ni al montar
   el layout; sólo al abrir.
5. **Texto:** el título es la etiqueta del tipo porque el DTO no trae `titulo`.
6. **Colores:** no trasladar los colores de la imagen; usar variables del tema.
7. **Accesibilidad:** foco, Escape, `aria-expanded`, `aria-controls` y punto de
   no leída con texto alternativo.
