# ModaLink Frontend

Plataforma de networking profesional para la industria creativa y de moda. Frontend SPA desarrollado con Vue 3.

> **Última actualización:** 2026-11-17  
> **Estado:** implementación funcional avanzada, con autenticación, perfiles, publicaciones y moodboards, red de contactos, mensajería privada, proyectos, contratos, invitaciones, colaboraciones automáticas, notificaciones in-app y por email, chat grupal y panel administrativo.

## Estado actual

### Funcionalidad implementada

- Autenticación local, con Google OAuth2 y por enlace mágico desde emails.
- Sesión con cookies HttpOnly y restauración vía `/auth/me`.
- Gestión de perfiles por usuario y perfil activo.
- Home con feed unificado de publicaciones, proyectos y oportunidades.
- Búsqueda combinada de perfiles, proyectos y oportunidades.
- Publicaciones: creación y edición con imágenes, galería ampliable (moodboard), me gusta, comentarios, colaboradores y eliminación.
- Moderación de publicaciones: reportes desde el feed y el perfil, publicaciones ocultas por el administrador y panel de reportes.
- Polaroids del perfil: carga, edición, reordenamiento y visor.
- Mi red: conexiones, solicitudes enviadas/recibidas y presencia en línea.
- Notificaciones: resumen, listado, marcado como leídas y navegación contextual.
- Notificaciones por email con auto-login desde el enlace recibido (Mailpit en desarrollo).
- Mensajería privada entre perfiles con conexión activa.
- Chat grupal por proyecto, separado de la pestaña Miembros.
- Proyectos: creación, edición, publicación, confirmación, finalización y cancelación.
- Planificación de actividades, asignación de responsables y disponibilidad.
- Postulaciones generales y por actividad.
- Contratos: generación, búsqueda, detalle, modificación, firma y rechazo.
- Invitaciones a proyectos, procesos de reemplazo y colaboraciones manuales.
- Colaboraciones automáticas a partir de imágenes compartidas, con detalle de cada propuesta.
- Calificaciones de integrantes al finalizar un proyecto.
- Calendario profesional, jornada laboral, bloqueos y disponibilidad.
- Panel administrativo: usuarios, perfiles, proyectos, contratos, reportes de perfiles y publicaciones, auditoría, características, habilidades, tipos de contrato, unidades de medida, configuración, schedulers y procesamiento histórico de colaboraciones automáticas.
- Vistas de detalle administrativas para perfiles, proyectos y contratos.
- Auditoría con búsqueda por operador y por texto, filtros por tipo de evento y cobertura de mensajes privados y grupales.
- Tema claro/oscuro con tokens compartidos.
- Foto de perfil ampliable mediante lightbox.
- Selector de emojis en los chats.

### Publicaciones y moderación

- El feed del Home combina publicaciones de contactos, proyectos y oportunidades, con pestañas de filtrado y paginación incremental.
- Cada publicación tiene una vista de detalle propia en `/publicaciones/:idPublicacion`, accesible también desde las notificaciones.
- El moodboard se abre en un modal ampliado con galería navegable.
- Las publicaciones ocultas por moderación quedan visibles solo para su autor, que únicamente puede eliminarlas.
- Los usuarios pueden reportar perfiles y publicaciones; el panel administrativo permite revisar y resolver esos reportes.

### Tiempo real

La aplicación mantiene **un único stream SSE por pestaña** para el perfil activo:

- `GET /presencia/stream` — presencia de perfiles.
- `GET /mensajes/stream` — mensajes privados, estado de lectura, indicador de escritura y mensajes grupales.

`App.vue` inicia y detiene los streams al cambiar el perfil activo. Si el stream se corta, se reintenta la conexión y las vistas refrescan sus datos.

### Validación actual

```bash
npm run build
npm test
```

- El build de producción finaliza correctamente (1293 módulos transformados).
- Se mantiene la advertencia de Vite por chunks mayores a 500 kB y por la importación dinámica del router desde `http.js`.
- La suite de pruebas unitarias (`node --test`) pasa completa: 22 pruebas en 5 archivos, sobre constantes y helpers de auditoría, colaboraciones automáticas, reemplazos y reportes.

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
| Testing | Node.js Test Runner | Integrado en Node |

> **Backend:** Java + Spring Boot + PostgreSQL, API REST separada. En desarrollo usa Mailpit para capturar los emails de notificación.

---

## Estructura del proyecto

```text
src/
├── App.vue                     # Componente raíz; resuelve layouts y streams globales
├── main.js                     # Punto de entrada + configuración de Vuestic
├── style.css                   # Tailwind + tokens de color claro/oscuro
├── assets/auth/                # Imágenes de autenticación
├── components/
│   ├── AlertaBase.vue
│   ├── AuthLayout.vue
│   ├── CampoHora.vue
│   ├── ThemeToggle.vue
│   ├── admin/                  # Layout, tablas, auditoría
│   ├── busqueda/               # Tarjetas y paginación de búsqueda
│   ├── calendario/             # Calendario, jornada, bloqueos
│   ├── colaboracion/           # Colaboraciones manuales y automáticas
│   ├── conexion/               # Mi red, solicitudes, presencia, avatares
│   ├── contrato/               # Listado, detalle, firma, rechazo, modificación
│   ├── home/                   # HomeLayout, feed, publicaciones, proyectos, oportunidades
│   ├── invitacion/             # Invitaciones, reemplazos y detalle
│   ├── mensajes/               # Chat privado, mensajes, selector de emojis
│   ├── notificaciones/         # Popover y filas de notificaciones
│   ├── perfil/                 # Hero, publicaciones, polaroids, reseñas, términos, reportes, ajustes
│   ├── proyecto/               # Dashboard, actividades, miembros, chat grupal, reemplazos
│   ├── ubicacion/              # Filtros de ubicación
│   └── usuario/                # Layout del dashboard de usuario
├── router/index.js             # Rutas + guards de sesión, perfil y permisos
├── services/                   # Acceso HTTP y estados reactivos compartidos
│   ├── http.js                 # Axios + CSRF + manejo global de 401/403
│   ├── authService.js
│   ├── authState.js
│   ├── themeState.js
│   ├── perfilService.js
│   ├── homeService.js
│   ├── publicacionService.js
│   ├── publicacionInteraccionState.js
│   ├── polaroidService.js
│   ├── proyectoService.js
│   ├── actividadService.js
│   ├── postulacionService.js
│   ├── requerimientoService.js
│   ├── contratoService.js
│   ├── contratoState.js
│   ├── invitacionService.js
│   ├── invitacionState.js
│   ├── reemplazoService.js
│   ├── reemplazoState.js
│   ├── conexionService.js
│   ├── solicitudConexionService.js
│   ├── solicitudConexionState.js
│   ├── solicitudColaboracionService.js
│   ├── solicitudColaboracionState.js
│   ├── colaboracionAutomaticaService.js
│   ├── colaboracionAutomaticaState.js
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
│   ├── usuarioService.js
│   ├── habilidadService.js
│   ├── auditoriaService.js
│   └── admin*.js               # Configuración, características, contratos, unidades, históricos
├── styles/
│   └── vuestic-overrides.css
├── utils/
│   ├── apiError.js
│   ├── fechas.js / horas.js
│   ├── fotos.js / moodboardImagenes.js
│   ├── ubicacion.js
│   ├── redirect.js
│   ├── reglas.js
│   ├── validaciones*.js
│   ├── *Constants.js
│   └── helpers de dominio (proyecto, contrato, conexión, mensajes, publicaciones, etc.)
└── views/
    ├── auth/                   # Login local, email, callback y onboarding Google
    ├── conexion/               # Mi red
    ├── contrato/               # Contratos
    ├── mensajes/               # Mensajería privada
    ├── perfil/                 # Home, perfil propio/ajeno, publicación, búsqueda, ajustes
    ├── proyecto/               # Proyectos, actividades, postulaciones, invitaciones
    ├── usuario/                # Dashboard, datos, calendario, notificaciones
    └── admin/                  # Panel administrativo completo y vistas de detalle
```

### Arquitectura

- Vue 3 con **Options API** en la mayoría de los componentes.
- Sin Pinia ni Vuex: el estado compartido vive en módulos reactivos dentro de `src/services/*State.js`.
- Los componentes no llaman a Axios directamente; todo pasa por `src/services/`.
- `App.vue` remonta la vista al cambiar la ruta o el perfil activo para recargar datos contextuales.
- Estilos con Tailwind CSS, Vuestic UI, CSS scoped y tokens de `src/style.css`.

---

## Rutas principales

### Públicas y autenticación

| Ruta | Descripción |
|---|---|
| `/` | Redirige a `/login` |
| `/login` | Inicio de sesión local o con Google |
| `/registro` | Registro de cuenta |
| `/auth/email` | Auto-login desde el enlace de una notificación por email |
| `/auth/google/callback` | Callback OAuth2 |
| `/auth/google/completar` | Onboarding de usuario nuevo de Google |

### Home, perfiles, publicaciones y búsqueda

| Ruta | Descripción | Perfil activo |
|---|---|---|
| `/home` | Home con feed de publicaciones, proyectos y oportunidades | Sí |
| `/publicaciones/:idPublicacion` | Detalle de una publicación | Sí |
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

### Red, solicitudes, mensajes y notificaciones

| Ruta | Descripción |
|---|---|
| `/mi-red` | Conexiones, solicitudes recibidas y enviadas |
| `/solicitudes-conexion` | Redirige a Mi red con la pestaña correspondiente |
| `/red-contactos` | Redirige a Mi red con la pestaña Conexiones |
| `/solicitudes` | Invitaciones, reemplazos y colaboraciones manuales |
| `/invitaciones` | Redirige a `/solicitudes` |
| `/colaboraciones-automaticas` | Propuestas generadas por imágenes compartidas |
| `/colaboraciones-automaticas/:id` | Detalle de una propuesta automática |
| `/mensajes` | Mensajería privada entre perfiles |
| `/notificaciones` | Notificaciones del perfil activo |
| `/dashboard-usuario/notificaciones` | Notificaciones del usuario |
| `/admin/notificaciones` | Notificaciones del administrador |

### Proyectos, actividades, postulaciones y contratos

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
| `/admin/dashboard` | Dashboard administrativo | `VER_USUARIOS` |
| `/admin/gestion-usuarios` | Gestión de usuarios | — |
| `/admin/busqueda-usuarios` | Búsqueda de usuarios | `VER_USUARIOS` |
| `/admin/perfiles` | Perfiles | — |
| `/admin/perfiles/:id` | Detalle del perfil | — |
| `/admin/proyectos` | Proyectos | — |
| `/admin/proyectos/:id` | Detalle del proyecto | — |
| `/admin/contratos` | Contratos | `VER_CONTRATOS` |
| `/admin/contratos/:id` | Detalle del contrato | `VER_CONTRATOS` |
| `/admin/reportes` | Reportes | — |
| `/admin/reportes-perfil` | Reportes de perfil | — |
| `/admin/reportes-perfil/:id` | Detalle de reporte de perfil | — |
| `/admin/reportes-publicacion` | Reportes de publicaciones | — |
| `/admin/reportes-publicacion/:id` | Detalle de reporte de publicación | — |
| `/admin/auditoria` | Auditoría | — |
| `/admin/gestionar-caracteristicas` | Características | — |
| `/admin/habilidades` | Habilidades | `VER_HABILIDADES` |
| `/admin/unidades-medida` | Unidades de medida | — |
| `/admin/tipos-contrato` | Tipos de contrato | `VER_TIPOS_CONTRATO` |
| `/admin/configuracion` | Configuración del sistema | `ADMINISTRAR_CONFIGURACION` |
| `/admin/configuracion-scheduler` | Scheduler de deshabilitación | `ADMINISTRAR_CONFIGURACION` |
| `/admin/configuracion-scheduler/baja` | Scheduler de bajas | `ADMINISTRAR_CONFIGURACION` |
| `/admin/configuracion-scheduler/limpieza-imagenes` | Scheduler de limpieza de imágenes | `ADMINISTRAR_CONFIGURACION` |
| `/admin/configuracion/cronograma` | Reparación de cronogramas | `ADMINISTRAR_CONFIGURACION` |
| `/admin/configuracion/colaboraciones-automaticas-historicas` | Procesamiento histórico de colaboraciones | `ADMINISTRAR_CONFIGURACION` |
| `/admin/configuracion/colaboraciones-automaticas-historicas/:id` | Detalle de un procesamiento histórico | `ADMINISTRAR_CONFIGURACION` |

---

## Autenticación y autorización

- JWT en cookies HttpOnly con `withCredentials: true`.
- Token CSRF gestionado por el interceptor de Axios (`X-XSRF-TOKEN`), con reintento automático ante `403` en métodos mutantes.
- La sesión se restaura al cargar la app mediante `GET /auth/me`.
- Auto-login desde email: `/auth/email` lee `token` y `redirect` del fragmento (`#`) de la URL, limpia el hash, valida el token con `POST /auth/email/validar` y navega al destino interno validado. Si falla, vuelve a `/login` conservando el `redirect`.
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

- [Node.js](https://nodejs.org/) >= 20.19 (o >= 22.12), requerido por Vite 7.
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

# Pruebas unitarias (Node Test Runner)
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

- `docs/backend/` — ficha técnica de colaboraciones automáticas históricas.
- `docs/backend/aplicadas/` — fichas implementadas de colaboraciones automáticas y auto-login por email.
- `docs/adaptacion de bd/backend/` — módulos de admin, calendario, perfiles, ubicación y usuario.
- `docs/estado/` — snapshots del estado del proyecto, Home y Home con feed.
- `docs/pendiente/` — planes de acción y propuestas de próximos módulos.
- `docs/pantallas/` — referencias visuales y mockups (Figma export).

---

## Paleta de colores

Los tokens se definen en `src/style.css` y se reutilizan en todos los componentes. El tema se aplica con el atributo `data-theme` en `<html>`, se guarda en `localStorage` (`modalink-theme`) y, si no hay preferencia guardada, parte de `prefers-color-scheme`.

| Token | Valor (claro) | Valor (oscuro) | Uso |
|---|---|---|---|
| `--color-primary` | `#494776` | `#8D86E0` | Acciones y elementos principales |
| `--color-secondary` | `#6866A9` | `#A9A6BD` | Elementos secundarios |
| `--color-accent` | `#A97B5C` | `#C9A07F` | Acentos |
| `--color-support` | `#5CA4A9` | `#6FC3C8` | Apoyo visual |
| `--color-bg` | `#F5F5F8` | `#17161F` | Fondo general |
| `--color-surface` | `#FFFFFF` | `#201F2B` | Superficies y tarjetas |
| `--color-text` | `#232134` | `#ECEBF5` | Texto principal |
| `--color-text-muted` | `#6B6980` | `#A9A6BD` | Texto secundario |
| `--color-border` | `#E5E7EB` | `#34324A` | Bordes |
| `--color-danger` | `#DC2626` | `#F87171` | Errores y acciones destructivas |
| `--color-success` | `#16A34A` | `#4ADE80` | Estados exitosos |

---

## Convenciones

- Componentes en **PascalCase**, un componente por archivo.
- Vistas en `src/views/`; componentes reutilizables en `src/components/`.
- Llamadas HTTP centralizadas en `src/services/` — nunca Axios directo desde componentes.
- Constantes y helpers compartidos en `src/utils/`.
- Nombres en español para conceptos de dominio; inglés para genéricos de UI.
- Estilos con Tailwind CSS, Vuestic UI, CSS scoped y tokens del tema.
- Estado compartido con módulos reactivos; no se usa Pinia ni Vuex.
- Pruebas unitarias con `node:test` y `node:assert/strict` en `test/`, sobre lógica pura extraída a `src/utils/`.

---

## Pendientes conocidos

- Migrar `API_BASE_URL` a una variable de entorno (`VITE_API_URL`).
- Ampliar la suite de pruebas a servicios, guards y componentes; hoy cubre helpers y constantes.
- Reducir el tamaño del bundle inicial mediante división de chunks (el JS principal supera los 2,8 MB).
- Optimizar imágenes de assets que hoy pesan varios MB cada una.
- El bus SSE del backend es en memoria para una instancia; para múltiples instancias se requiere Redis Pub/Sub o PostgreSQL `LISTEN/NOTIFY`.
- Chats sin adjuntos, edición, borrado, búsqueda de mensajes ni moderación.
- El chat grupal no tiene contador propio de no leídos ni confirmación de lectura; el aviso se gestiona por notificaciones.
- Algunas secciones del perfil y módulos complementarios siguen documentados como pendientes en `docs/pendiente/`.

---

## Estado del build

```bash
npm run build
```

- Build exitoso con Vite.
- 1293 módulos transformados.
- JS principal: ~2,81 MB (≈713 kB gzip); CSS: ~887 kB (≈116 kB gzip).
- Advertencia de chunks mayores a 500 kB (no bloqueante).
- Advertencia por la importación dinámica del router desde `http.js` (no bloqueante).
