# Estado del proyecto - ModaLink Frontend V.0.1

**Fecha de corte:** 2026-09-07  
**Rama:** `gestion-perfiles`  
**Ultimo commit:** `09e241e` - *Guias del backend para el desarrollo del front*

## 1. Resumen general

ModaLink Frontend es una SPA desarrollada con Vue 3, Vue Router, Axios, Vuestic UI y Vite. El frontend consume una API REST independiente desarrollada con Java, Spring Boot y PostgreSQL.

En el estado actual, la rama `gestion-perfiles` cuenta con:

- Autenticacion mediante cookies HttpOnly y restauracion de sesion.
- Separacion de layouts para autenticacion, usuario y administrador.
- Gestion de perfiles del usuario.
- Seleccion y activacion de un perfil activo.
- Cambio de perfil activo desde el layout del usuario.
- Nueva pantalla Home orientada al perfil activo.
- Gestion de calendario y disponibilidad.
- Panel administrativo para usuarios y caracteristicas tecnicas.
- Guias de integracion con los contratos recientes del backend.

La aplicacion se encuentra en una etapa de implementacion funcional temprana: los flujos principales ya tienen pantallas y conexion con servicios, mientras que algunos modulos del Home todavia son placeholders.

## 2. Historial relevante de la rama

### Base funcional del frontend

- `5f803a3` - Se incorporaron las vistas del dashboard de usuario, incluyendo datos personales y administracion de perfiles.
- `dd9752e` - Se creo la ruta del dashboard administrativo y se ajusto la administracion para impedir que un administrador se deshabilite a si mismo.
- `2fc4e87` - Se agrego la solicitud de baja del sistema, la reactivacion desde el login y la ubicacion opcional en los datos personales.
- `15c7cd9` - Se agrego la visualizacion de errores del backend al solicitar la baja.

### Gestion de perfiles y administracion

- `3628ec1` - Se incorporaron las pantallas de creacion de perfiles.
- `41fb8ab` - Se adapto el frontend al CRUD de caracteristicas tecnicas del administrador.
- `31abbbd` - Se preparo el diseño para editar y eliminar perfiles.
- `4fca7c9` - Se mejoro el tratamiento de errores HTTP y se realizaron ajustes visuales en el dashboard de usuario.

### Calendario y datos personales

- `90ebe02` - Se incorporo el manejo del calendario de usuarios.
- `b4a81c6` - Se actualizo la vista del calendario para reflejar la modificacion de la jornada en el backend y se agrego `figma.html` para apoyar el diseño de pantallas.
- `658a1d5` - Se agrego la pantalla para modificar la ubicacion del usuario.
- `1219b60` - Se incorporo una confirmacion cuando el usuario guarda sus datos sin ubicacion.

### Autenticacion y experiencia visual

- `237ea93` - El login de administrador redirige al dashboard administrativo.
- `2a7f57f` - Se incorporaron imagenes al banner inicial.
- `8688d89` - Se actualizo la paleta de colores.
- `773aa04` - Se actualizo el README con tecnologias, estructura, rutas y comandos.

### Integracion de perfil activo y Home

- `ddaebf2` - Se implemento el caso de uso UC-13 para cambiar el perfil activo y se agrego la pantalla Home.
- `09e241e` - Se agregaron las guias de integracion del backend:
  - `docs/backend/guia-integracion-home.md`
  - `docs/backend/guia-integracion-perfil-activo.md`

## 3. Funcionalidad disponible actualmente

### Sesion

- Login y registro.
- Recuperacion de contraseña en la interfaz.
- Restauracion de sesion mediante `GET /auth/me`.
- Cookies HttpOnly para el JWT.
- Envio de credenciales con Axios.
- Interceptor para el token CSRF.
- Cierre de sesion y limpieza del estado local reactivo.

### Perfiles

- Listado de perfiles del usuario mediante `GET /usuarios/me/perfiles`.
- Creacion y edicion de perfiles.
- Activacion de perfil mediante `PATCH /perfiles/{idPerfil}/activar`.
- Seleccion de perfil cuando no existe un perfil activo.
- Redireccion al Home despues de activar un perfil.
- Cambio de perfil desde el menu desplegable del `UserDashboardLayout`.
- Indicacion visual del perfil actualmente activo.

### Home

La ruta `/home` utiliza el layout del usuario y se compone de los siguientes modulos:

- Informacion del perfil activo.
- Proyectos destacados.
- Publicaciones recientes.

El servicio [homeService.js](../../src/services/homeService.js) consulta:

- `GET /home/resumen` como endpoint agregador.
- `GET /perfiles/activo` como fallback para obtener el perfil activo.

Si el resumen devuelve `perfilActivo: null` o el backend informa que no hay perfil activo, el frontend redirige a la seleccion de perfil.

Los componentes de proyectos y publicaciones muestran estados vacios porque sus endpoints de negocio aun no estan implementados en el frontend.

### Administracion

- Dashboard administrativo.
- Gestion de usuarios.
- Habilitacion y deshabilitacion de usuarios.
- Gestion de caracteristicas tecnicas.
- Proteccion de rutas administrativas mediante guardia de Vue Router.

### Calendario

- Configuracion de jornada laboral.
- Creacion de bloqueos de disponibilidad.
- Visualizacion del calendario del usuario.

## 4. Arquitectura actual

La estructura principal sigue estas convenciones:

- Vistas de rutas en `src/views/`.
- Componentes reutilizables en `src/components/`.
- Acceso HTTP centralizado en `src/services/`.
- Estado de autenticacion reactivo en `src/services/authState.js`.
- Proteccion de rutas en `src/router/index.js`.
- Layouts dinamicos resueltos desde `App.vue`.
- Options API en los componentes Vue existentes.

El frontend no utiliza Pinia ni Vuex. El perfil activo se mantiene dentro del estado reactivo de autenticacion y las vistas se vuelven a montar cuando cambia el identificador del perfil activo.

## 5. Rutas principales

| Ruta | Funcion | Acceso |
|---|---|---|
| `/login` | Inicio de sesion | Publico |
| `/registro` | Registro de usuario | Publico |
| `/recuperar-password` | Recuperacion de contraseña | Publico |
| `/home` | Inicio contextual del perfil activo | Usuario autenticado con perfil activo |
| `/dashboard-usuario` | Administracion de perfiles | Usuario autenticado |
| `/dashboard-usuario/seleccionar-perfil` | Seleccion de perfil | Usuario autenticado sin perfil activo |
| `/dashboard-usuario/crear-perfil` | Creacion de perfil | Usuario autenticado |
| `/dashboard-usuario/editar-perfil/:id` | Edicion de perfil | Usuario autenticado |
| `/dashboard-usuario/modificar-datos` | Datos personales | Usuario autenticado |
| `/dashboard-usuario/calendario` | Disponibilidad y jornada | Usuario autenticado |
| `/admin/dashboard` | Inicio administrativo | Administrador |
| `/admin/gestion-usuarios` | Gestion de usuarios | Administrador |
| `/admin/gestionar-caracteristicas` | Caracteristicas tecnicas | Administrador |

## 6. Validacion realizada

Se ejecuto el build de produccion con:

```bash
npm run build
```

Resultado:

- Build exitoso con Vite.
- 746 modulos transformados.
- No se detectaron errores de compilacion.
- Vite informa una advertencia de chunks mayores a 500 kB; no impide la generacion del build.

## 7. Pendientes conocidos

- Conectar los endpoints reales de proyectos destacados.
- Conectar los endpoints reales de publicaciones recientes.
- Completar la informacion y acciones del Home a medida que avance el backend.
- Actualizar el README para incluir explicitamente la ruta `/home` y los componentes nuevos.
- Reemplazar la URL hardcodeada de Axios por `VITE_API_URL`, tal como ya se indica en el README.
- Completar la recuperacion de contraseña cuando el backend exponga el endpoint definitivo.
- Incorporar pruebas automatizadas para los flujos de autenticacion, activacion y cambio de perfil.
- Evaluar la division de chunks del build para mejorar la carga inicial.

## 8. Conclusion

La rama `gestion-perfiles` deja el frontend preparado para trabajar con el concepto de perfil activo definido por el backend. El flujo de autenticacion, seleccion, activacion y cambio de perfil esta integrado con cookies HttpOnly y con proteccion de rutas. El Home ya tiene una estructura modular y un contrato de integracion definido, pero sus secciones de proyectos y publicaciones permanecen como base visual hasta que existan los endpoints correspondientes.
