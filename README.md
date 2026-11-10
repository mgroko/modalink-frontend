# ModaLink Frontend

Plataforma de networking profesional para la industria creativa y de moda — un LinkedIn para producciones de moda. Frontend SPA desarrollado con Vue 3.

> **Última actualización:** 2026-11-10  
> **Estado:** implementación funcional avanzada, con autenticación, perfiles, red de contactos, mensajería privada, proyectos, contratos, invitaciones, notificaciones, chat grupal y panel administrativo.

## Estado actual

### Funcionalidad implementada

- Autenticación local y con Google OAuth2.
- Sesión con cookies HttpOnly y restauración vía `/auth/me`.
- Gestión de perfiles por usuario y perfil activo.
- Home con feed de proyectos y oportunidades.
- Búsqueda combinada de perfiles, proyectos y oportunidades.
- Mi red: conexiones, solicitudes enviadas/recibidas y presencia en línea.
- Notificaciones: resumen, listado, marcado como leídas y navegación contextual.
- Mensajería privada entre perfiles con conexión activa.
- Chat grupal por proyecto, separado de la pestaña Miembros.
- Proyectos: creación, edición, publicación, confirmación, finalización y cancelación.
- Planificación de actividades, asignación de responsables y disponibilidad.
- Postulaciones generales y por actividad.
- Contratos: generación, búsqueda, detalle, modificación, firma y rechazo.
- Invitaciones a proyectos y procesos de reemplazo.
- Calificaciones de integrantes al finalizar un proyecto.
- Calendario profesional, jornada laboral, bloqueos y disponibilidad.
- Panel administrativo: usuarios, proyectos, reportes, auditoría, características, habilidades, tipos de contrato, unidades de medida, configuración y schedulers.
- Tema claro/oscuro con tokens compartidos.
- Foto de perfil ampliable mediante lightbox.
- Selector de emojis en los chats.

### Tiempo real

La aplicación mantiene **un único stream SSE por pestaña** para el perfil activo:

- `GET /presencia/stream` — presencia de perfiles.
- `GET /mensajes/stream` — mensajes privados, estado de lectura, indicador de escritura y mensajes grupales.

`App.vue` inicia y detiene los streams al cambiar el perfil activo. Si el stream se corta, se reintenta la conexión y las vistas refrescan sus datos.

### Validación actual

```bash
npm run build
```

El build de producción finaliza correctamente. Se mantiene la advertencia de Vite por chunks mayores a 500 kB y por la importación dinámica del router desde `http.js`.

---

## Tecnologías

| Categoría | Tecnología | Versión |
|---|---|---|
| Framework | Vue 3 | `^3.5.20` |
| Router | Vue Router | `^4.5.1` |
| UI Components | Vuestic UI | `^1.10.3` |
| HTTP Client | Axios | `^1.11.0` |
| Gráficos | Chart.js | `^4.6.1` |
| Build Tool | Vite | `^7.0.4` |
| CSS | Tailwind CSS | `^4.3.3` |
| Iconos | Material Symbols Outlined | — |
| Tipografía | Inter | — |

> **Backend:** Java + Spring Boot + PostgreSQL, API REST separada.

---

## Estructura del proyecto

```text
src/
├── App.vue                     # Componente raíz; resuelve layouts y streams globales
├── main.js                     # Punto de entrada
├── style.css                   # Tailwind + tokens de color claro/oscuro
├── assets/auth/                # Imágenes de autenticación
├── components/
│   ├── AlertaBase.vue
│   ├── AuthLayout.vue
│   ├── ThemeToggle.vue
│   ├── admin/                  # Layout, auditoría
│   ├── busqueda/               # Tarjetas y paginación de búsqueda
│   ├── calendario/             # Calendario, jornada, bloqueos
│   ├── conexion/               # Mi red, solicitudes, presencia, avatares
│   ├── contrato/               # Listado, detalle, firma, rechazo, modificación
│   ├── home/                   # HomeLayout, feed, proyectos, oportunidades
│   ├── invitacion/             # Invitaciones y reemplazos
│   ├── mensajes/               # Chat privado, mensajes, selector de emojis
│   ├── notificaciones/         # Popover y filas de notificaciones
│   ├── perfil/                 # Hero, reseñas, términos, reportes, ajustes
│   ├── proyecto/               # Dashboard, actividades, miembros, chat grupal
│   ├── ubicacion/              # Filtros de ubicación
│   └── usuario/                # Layout del dashboard de usuario
├── router/index.js             # Rutas + guards de sesión, perfil y permisos
├── services/                   # Acceso HTTP y estados reactivos compartidos
│   ├── http.js                 # Axios + CSRF + manejo global de 401/403
│   ├── authService.js
│   ├── authState.js
│   ├── perfilService.js
│   ├── homeService.js
│   ├── proyectoService.js
│   ├── actividadService.js
│   ├── postulacionService.js
│   ├── contratoService.js
│   ├── contratoState.js
│   ├── invitacionService.js
│   ├── invitacionState.js
│   ├── reemplazoService.js
│   ├── reemplazoState.js
│   ├── conexionService.js
│   ├── solicitudConexionService.js
│   ├── solicitudConexionState.js
│   ├── presenciaService.js
│   ├── presenciaState.js
│   ├── notificacionService.js
│   ├── notificacionState.js
│   ├── mensajeService.js
│   ├── mensajeState.js
│   ├── chatGrupalService.js
│   ├── calendarioService.js
│   ├── calificacionPerfilService.js
│   ├── reporteService.js
│   ├── requerimientoService.js
│   ├── usuarioService.js
│   └── admin*.js
├── styles/
│   └── vuestic-overrides.css
├── utils/
│   ├── apiError.js
│   ├── fechas.js / horas.js
│   ├── fotos.js
│   ├── ubicacion.js
│   ├── reglas.js
│   ├── *Constants.js
│   └── helpers de dominio (proyecto, contrato, conexión, mensajes, etc.)
└── views/
    ├── auth/                   # Login, registro, callback y onboarding Google
    ├── conexion/               # Mi red
    ├── contrato/               # Contratos
    ├── mensajes/               # Mensajería privada
    ├── perfil/                 # Home, perfil propio/ajeno, búsqueda, ajustes
    ├── proyecto/               # Proyectos, actividades, postulaciones, invitaciones
    ├── usuario/                # Dashboard, datos, calendario, notificaciones
    └── admin/                  # Panel administrativo completo
```

### Arquitectura

- Vue 3 con **Options API** en la mayoría de los componentes.
- Sin Pinia ni Vuex: el estado compartido vive en módulos reactivos dentro de `src/services/*State.js`.
- Los componentes no llaman a Axios directamente; todo pasa por `src/services/`.
- `App.vue` remonta la vista al cambiar el perfil activo para recargar datos contextuales.
- Estilos con Tailwind CSS, Vuestic UI, CSS scoped y tokens de `src/style.css`.

---

## Rutas principales

### Públicas y autenticación

| Ruta | Descripción |
|---|---|
| `/` | Redirige a `/login` |
| `/login` | Inicio de sesión local o con Google |
| `/registro` | Registro de cuenta |
| `/auth/google/callback` | Callback OAuth2 |
| `/auth/google/completar` | Onboarding de usuario nuevo de Google |

### Home, perfiles y búsqueda

| Ruta | Descripción | Perfil activo |
|---|---|---|
| `/home` | Home con feed de proyectos y oportunidades | Sí |
| `/inicio-perfil` | Mi perfil | Sí |
| `/inicio-perfil/:seccion` | Secciones del perfil propio | Sí |
| `/inicio-perfil/ajustes` | Ajustes del perfil | Sí |
| `/inicio-perfil/ajustes/editar/:id` | Editar perfil desde ajustes | Sí |
| `/inicio-perfil/ajustes/terminos-condiciones` | Configurar términos y condiciones | Sí |
| `/inicio-perfil/resenas/:idCalificacion` | Detalle de reseña propia | Sí |
| `/inicio-perfil/editar/:id` | Editar perfil desde el inicio | Sí |
| `/perfiles/:id` | Ver perfil de otro usuario | Sí |
| `/perfiles/:id/:seccion` | Secciones del perfil ajeno | Sí |
| `/perfiles/:id/resenas/:idCalificacion` | Detalle de reseña ajena | Sí |
| `/buscar` | Búsqueda de perfiles, proyectos y oportunidades | Sí |
| `/buscar-perfiles` | Redirige a `/buscar` | Sí |
| `/buscar-requerimientos` | Redirige a `/buscar?tab=oportunidades` | Sí |

### Red, mensajes y notificaciones

| Ruta | Descripción |
|---|---|
| `/mi-red` | Conexiones, solicitudes recibidas y enviadas |
| `/solicitudes-conexion` | Redirige a Mi red con la pestaña correspondiente |
| `/red-contactos` | Redirige a Mi red con la pestaña Conexiones |
| `/mensajes` | Mensajería privada entre perfiles |
| `/notificaciones` | Notificaciones del perfil activo |
| `/dashboard-usuario/notificaciones` | Notificaciones del usuario |
| `/admin/notificaciones` | Notificaciones del administrador |

### Proyectos, actividades, postulaciones, contratos e invitaciones

| Ruta | Descripción |
|---|---|
| `/proyectos` | Inicio de proyectos |
| `/crear-proyecto` | Crear proyecto |
| `/proyectos/:id` | Dashboard del proyecto |
| `/proyectos/:id/modificar` | Modificar proyecto |
| `/proyectos/:id/invitar` | Invitar miembros |
| `/proyectos/:id/chat` | Redirige al chat grupal del proyecto |
| `/proyectos/:id/actividades/crear` | Crear actividad |
| `/proyectos/:id/actividades/:idActividad/modificar` | Modificar actividad |
| `/proyectos/:id/actividades/:idActividad/detalle` | Detalle de actividad |
| `/proyectos/:id/actividades/:idActividad` | Redirige a la planificación del proyecto |
| `/proyectos/mis-postulaciones` | Postulaciones del perfil activo |
| `/proyectos/:id/postulaciones` | Redirige a la pestaña de postulaciones |
| `/proyectos/:id/calificaciones` | Calificaciones del equipo |
| `/proyectos/:id/contratos/nuevo` | Generar contrato |
| `/proyectos/:idProyecto/contratos/:idContrato` | Detalle de contrato |
| `/proyectos/:idProyecto/contratos/:idContrato/modificar` | Modificar contrato |
| `/contratos` | Búsqueda de contratos |
| `/contratos/pendientes` | Contratos pendientes de firma |
| `/contratos/buscar` | Redirige a `/contratos` |
| `/invitaciones` | Invitaciones a proyectos |

### Dashboard de usuario y calendario

| Ruta | Descripción |
|---|---|
| `/dashboard-usuario` | Administración de perfiles del usuario |
| `/dashboard-usuario/modificar-datos` | Datos personales |
| `/dashboard-usuario/calendario` | Calendario, jornada y bloqueos |
| `/dashboard-usuario/crear-perfil` | Crear perfil |
| `/dashboard-usuario/editar-perfil/:id` | Editar perfil |

### Administración

| Ruta | Descripción | Permiso |
|---|---|---|
| `/admin/dashboard` | Dashboard administrativo | — |
| `/admin/gestion-usuarios` | Gestión de usuarios | — |
| `/admin/busqueda-usuarios` | Búsqueda de usuarios | `VER_USUARIOS` |
| `/admin/proyectos` | Proyectos | `VER_USUARIOS` |
| `/admin/reportes` | Reportes | — |
| `/admin/reportes-perfil` | Reportes de perfil | — |
| `/admin/reportes-perfil/:id` | Detalle de reporte | — |
| `/admin/auditoria` | Auditoría | — |
| `/admin/gestionar-caracteristicas` | Características | — |
| `/admin/habilidades` | Habilidades | `VER_HABILIDADES` |
| `/admin/unidades-medida` | Unidades de medida | — |
| `/admin/tipos-contrato` | Tipos de contrato | `VER_TIPOS_CONTRATO` |
| `/admin/configuracion` | Configuración del sistema | `ADMINISTRAR_CONFIGURACION` |
| `/admin/configuracion-scheduler` | Scheduler de deshabilitación | `ADMINISTRAR_CONFIGURACION` |
| `/admin/configuracion-scheduler/baja` | Scheduler de bajas | `ADMINISTRAR_CONFIGURACION` |
| `/admin/configuracion/cronograma` | Reparación de cronogramas | `ADMINISTRAR_CONFIGURACION` |

---

## Autenticación y autorización

- JWT en cookies HttpOnly con `withCredentials: true`.
- Token CSRF gestionado por el interceptor de Axios (`X-XSRF-TOKEN`), con reintento automático ante `403` en métodos mutantes.
- La sesión se restaura al cargar la app mediante `GET /auth/me`.
- Manejo centralizado de errores en `src/services/http.js`:
  - `401` → sesión ausente o vencida; limpia estado y redirige a login.
  - `403` → permiso faltante, CSRF inválido o cuenta pendiente de baja.
- Guards en `src/router/index.js`:
  - `requiereAdmin`.
  - `requierePermiso`.
  - `requiresActiveProfile`.
  - `permiteSinPerfil`, `sinPerfilActivo` y `soloPerfilActivo`.
- Cambio de perfil activo con remontaje de la vista para recargar datos contextuales.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) >= 18.
- Backend corriendo en `http://localhost:8080`.

## Instalación y ejecución

```bash
# Clonar el repositorio
git clone https://github.com/usuario/modalink-frontend.git
cd modalink-frontend

# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build de producción
npm run build

# Previsualizar build
npm run preview

# Tests (script disponible)
npm test
```

## Variables de entorno

Actualmente no se requiere archivo `.env`: la URL del backend está definida en `src/services/http.js`:

```js
export const API_BASE_URL = "http://localhost:8080";
```

> **Recomendación:** migrar a `import.meta.env.VITE_API_URL` para no modificar código fuente entre entornos.

---

## Documentación

La documentación funcional y técnica vive en `docs/`:

- `docs/backend/` — fichas vigentes de mensajería privada y chat grupal.
- `docs/backend/aplicadas/` — fichas implementadas de conexiones, solicitudes y presencia.
- `docs/adaptacion de bd/backend/` — módulos de admin, calendario, perfiles, ubicación y usuario.
- `docs/estado/` — snapshots del estado del proyecto, Home y Home con feed.
- `docs/pendiente/` — planes de acción y propuestas de próximos módulos.
- `docs/pantallas/` — referencias visuales y mockups (Figma export).

---

## Paleta de colores

Los tokens se definen en `src/style.css` y se reutilizan en todos los componentes. El tema oscuro se activa con `[data-theme="dark"]` o `prefers-color-scheme: dark`.

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#494776` | Acciones y elementos principales |
| `--color-secondary` | `#6866A9` | Elementos secundarios |
| `--color-accent` | `#A97B5C` | Acentos |
| `--color-support` | `#5CA4A9` | Apoyo visual |
| `--color-bg` | `#F5F5F8` | Fondo general |
| `--color-surface` | `#FFFFFF` | Superficies y tarjetas |
| `--color-text` | `#232134` | Texto principal |
| `--color-text-muted` | `#6B6980` | Texto secundario |
| `--color-border` | `#E5E7EB` | Bordes |
| `--color-danger` | `#DC2626` | Errores y acciones destructivas |
| `--color-success` | `#16A34A` | Estados exitosos |

---

## Convenciones

- Componentes en **PascalCase**, un componente por archivo.
- Vistas en `src/views/`; componentes reutilizables en `src/components/`.
- Llamadas HTTP centralizadas en `src/services/` — nunca Axios directo desde componentes.
- Constantes y helpers compartidos en `src/utils/`.
- Nombres en español para conceptos de dominio; inglés para genéricos de UI.
- Estilos con Tailwind CSS, Vuestic UI, CSS scoped y tokens del tema.
- Estado compartido con módulos reactivos; no se usa Pinia ni Vuex.

---

## Pendientes conocidos

- Migrar `API_BASE_URL` a una variable de entorno (`VITE_API_URL`).
- Incorporar una suite de pruebas automatizadas; el script `npm test` existe, pero todavía no hay cobertura versionada.
- Reducir el tamaño del bundle inicial mediante división de chunks.
- El bus SSE del backend es en memoria para una instancia; para múltiples instancias se requiere Redis Pub/Sub o PostgreSQL `LISTEN/NOTIFY`.
- Chats sin adjuntos, edición, borrado, búsqueda de mensajes ni moderación.
- El chat grupal no tiene contador propio de no leídos ni confirmación de lectura; el aviso se gestiona por notificaciones.
- El botón **Nueva publicación** del Home está deshabilitado hasta que exista el endpoint correspondiente.
- Algunas secciones del perfil y módulos complementarios siguen documentados como pendientes en `docs/pendiente/`.

---

## Estado del build

```bash
npm run build
```

- Build exitoso con Vite.
- 1158 módulos transformados.
- Advertencia de chunks mayores a 500 kB (no bloqueante).
- Advertencia por la importación dinámica del router desde `http.js` (no bloqueante).
