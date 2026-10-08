# ModaLink Frontend

Plataforma de networking profesional para la industria creativa y de moda — un LinkedIn para producciones de moda. Frontend SPA desarrollado con Vue 3.

## Tecnologías

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | Vue 3 | ^3.5.20 |
| Router | Vue Router | ^4.5.1 |
| UI Components | Vuestic UI | ^1.10.3 |
| HTTP Client | Axios | ^1.11.0 |
| Build Tool | Vite | ^7.0.4 |
| CSS | Tailwind CSS | ^4.3.3 |
| Icons | Material Symbols Outlined | — |
| Font | Inter (Google Fonts) | — |

> **Backend:** Java + Spring Boot + PostgreSQL (API REST separada)

## Estructura del proyecto

```
src/
├── App.vue                     # Componente raíz (resuelve layouts dinámicamente)
├── main.js                     # Punto de entrada
├── style.css                   # Tailwind + tokens de color
├── assets/auth/                # Imágenes de autenticación
├── components/
│   ├── AlertaBase.vue          # Alerta reutilizable
│   ├── AuthLayout.vue          # Layout login/registro/recuperar
│   ├── admin/AdminLayout.vue   # Layout panel admin
│   ├── usuario/UserDashboardLayout.vue  # Layout panel usuario
│   ├── home/HomeLayout.vue     # Layout del home (con sidebar de perfil)
│   │   ├── PerfilActivoWidget.vue
│   │   ├── ProyectosSection.vue
│   │   └── PublicacionesFeed.vue
│   ├── perfil/                 # Hero, sidebar, reseñas, eventos, reportes, skeletons
│   └── calendario/             # Calendario, compacto, jornada, bloqueos, disponibilidad
├── router/index.js             # Rutas + guards (admin, permisos, perfil activo)
├── services/                   # Capa de acceso HTTP (sin Axios directo en vistas)
│   ├── http.js                 # Instancia Axios + interceptores (CSRF, 401/403)
│   ├── authService.js          # Login/logout/session
│   ├── authState.js            # Estado de sesión (reactive) + permisos
│   ├── usuarioService.js       # Endpoints de usuario
│   ├── perfilService.js        # Endpoints de perfiles
│   ├── calendarioService.js    # Endpoints de calendario
│   ├── homeService.js          # Endpoints del home
│   ├── reporteService.js       # Reportes de perfil
│   ├── adminService.js         # Endpoints admin
│   ├── adminCaracteristicasService.js
│   ├── adminConfiguracionService.js    # Scheduler (deshabilitación/bajas)
│   ├── adminUnidadesMedidaService.js
│   └── vuestic-ui/icons-config.js
├── styles/vuestic-overrides.css
├── utils/
│   ├── apiError.js             # Normalización de errores de API
│   ├── fechas.js / horas.js    # Formateo de fechas y horas
│   ├── fotos.js                # Utilidades de imágenes
│   ├── perfilConstants.js      # Constantes y catálogos de perfil
│   ├── reglas.js               # Reglas de validación
│   └── ubicacion.js            # Mapeo de ubicación del sistema
└── views/
    ├── auth/                   # Login, Registro, Recuperar Password
    ├── perfil/                 # Home, Inicio/Ver perfil, Buscar, Crear, Editar
    ├── usuario/                # Dashboard, Modificar datos, Calendario
    └── admin/                  # Dashboard, Usuarios, Búsqueda, Características,
                                # Unidades de medida, Schedulers
```

## Rutas principales

### Públicas
| Ruta | Descripción |
|------|-------------|
| `/` | Redirige a `/login` |
| `/login` | Inicio de sesión |
| `/registro` | Registro de cuenta |
| `/recuperar-password` | Recuperación de contraseña |

### Autenticadas (requieren sesión; algunas requieren perfil activo)
| Ruta | Descripción | Perfil activo |
|------|-------------|---------------|
| `/home` | Home con feed, proyectos y perfil activo | Sí |
| `/inicio-perfil` · `/inicio-perfil/:seccion` | Mi perfil (secciones) | Sí |
| `/perfiles/:id` · `/perfiles/:id/:seccion` | Ver perfil de otro usuario (UC-16) | Sí |
| `/buscar-perfiles` | Búsqueda de perfiles | Sí |
| `/inicio-perfil/editar/:id` | Editar perfil desde el home | Sí |
| `/dashboard-usuario` | Panel de usuario | No |
| `/dashboard-usuario/crear-perfil` | Crear perfil de proyecto | Sin perfil activo |
| `/dashboard-usuario/editar-perfil/:id` | Editar perfil | No |
| `/dashboard-usuario/modificar-datos` | Modificar datos personales | No |
| `/dashboard-usuario/calendario` | Calendario, jornada y bloqueos | No |

### Admin (`requiereAdmin`)
| Ruta | Descripción | Permiso |
|------|-------------|---------|
| `/admin/dashboard` | Panel administrativo | — |
| `/admin/gestion-usuarios` | Gestión de usuarios (bajas, reactivación) | — |
| `/admin/busqueda-usuarios` | Búsqueda de usuarios | `VER_USUARIOS` |
| `/admin/gestionar-caracteristicas` | Gestión de características | — |
| `/admin/unidades-medida` | Gestión de unidades de medida | — |
| `/admin/configuracion-scheduler` | Scheduler de deshabilitación | `ADMINISTRAR_CONFIGURACION` |
| `/admin/configuracion-scheduler/baja` | Scheduler de bajas (`diasBaja`) | `ADMINISTRAR_CONFIGURACION` |

## Requisitos previos

- [Node.js](https://nodejs.org/) >= 18
- Backend corriendo en `http://localhost:8080`

## Instalación y ejecución

```bash
# Clonar el repositorio
git clone https://github.com/usuario/modalink-frontend.git
cd modalink-frontend

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build de producción
npm run build

# Previsualizar build
npm run preview
```

## Variables de entorno

No se requiere archivo `.env`: la URL del backend está definida en `src/services/http.js` (`API_BASE_URL = "http://localhost:8080"`).

> **Nota:** se recomienda migrar a `import.meta.env.VITE_API_URL` para no editar código fuente al cambiar de entorno.

## Autenticación y autorización

- JWT almacenado en cookies (HttpOnly) con `withCredentials: true`
- Tokens CSRF gestionados automáticamente por el interceptor de Axios (`X-XSRF-TOKEN`), con reintento automático ante un 403 en métodos mutantes
- La sesión se restaura al cargar la app vía `/auth/me` (`restaurarSesion()`)
- Manejo de errores centralizado en `src/services/http.js`:
  - `401` → cuenta no activa (ej. `PENDIENTE_BAJA`)
  - `403` → sin sesión (redirige a `/login?redirect=...`), permiso faltante o CSRF inválido
- Guards en `src/router/index.js`:
  - `requiereAdmin` → solo rol `Administrador`
  - `requierePermiso` → permisos derivados del rol (`VER_USUARIOS`, `ADMINISTRAR_CONFIGURACION`, …)
  - Flujo de perfil activo → sin perfil redirige a `crear-perfil` o `dashboard-usuario`
- `App.vue` remonta la vista al cambiar el perfil activo para recargar datos contextuales

## Documentación

Bajo `docs/` se encuentran las fichas técnicas y guías de integración con el backend:

- `docs/backend/` — fichas técnicas por caso de uso (buscar perfil, ver perfil, búsqueda de usuarios, unidades de medida, jornada partida) y guías de integración (home, perfil activo)
- `docs/adaptacion de bd/backend/` — fichas técnicas de los módulos admin, calendario, perfiles, ubicación y usuario
- `docs/estado/` — estado del proyecto (V.0.1) y del home (V.0.2)
- `docs/pantallas/` — referencia visual (Figma export)

## Paleta de colores

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-primary` | `#494776` | Elementos principales |
| `--color-secondary` | `#6866A9` | Elementos secundarios |
| `--color-accent` | `#A97B5C` | Acentos |
| `--color-background` | `#FAF8F5` | Fondo general |
| `--color-surface` | `#FFFFFF` | Superficies |
| `--color-text-primary` | `#484848` | Texto principal |
| `--color-text-secondary` | `#767171` | Texto secundario |

## Convenciones

- Componentes en **PascalCase**, un componente por archivo
- Vistas en `src/views/`, componentes reutilizables en `src/components/`
- Llamadas HTTP centralizadas en `src/services/` — nunca Axios directo desde componentes
- Constantes y helpers compartidos en `src/utils/`
- Nombres en español para conceptos de dominio, inglés para genéricos de UI
- Estilos vía Tailwind CSS (clases utility-first) + Vuestic UI
