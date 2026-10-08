# Estado de la implementación del Home - ModaLink Frontend V.0.2

**Fecha de corte:** 2026-09-07  
**Rama:** `gestion-perfiles`  
**Alcance:** nueva experiencia de Home basada en perfil activo

## 1. Resumen

El Home dejó de utilizar `UserDashboardLayout`, que se conserva para las operaciones administrativas del usuario, como gestionar perfiles, modificar datos y administrar la disponibilidad.

La ruta `/home` ahora utiliza un layout independiente orientado a la navegación del perfil activo. La pantalla se organiza en:

- Barra superior de navegación.
- Menú desplegable del perfil activo.
- Sidebar con información del perfil y accesos rápidos.
- Área central para publicaciones, proyectos y futuros módulos.

La selección inicial del perfil ya no se realiza mediante una vista separada. Cuando el usuario inicia sesión sin perfil activo, ingresa al dashboard administrativo de usuario y selecciona un perfil desde sus tarjetas.

## 2. Archivos creados

### [src/components/HomeLayout.vue](../../src/components/HomeLayout.vue)

Layout principal de la experiencia Home.

Muestra:

- Logo de ModaLink.
- Buscador de perfiles por nombre o profesión.
- Navegación superior:
  - Inicio.
  - Proyectos.
  - Mi red.
  - Mensajes.
  - Notificaciones.
- Avatar y nombre del perfil activo.
- Dropdown del perfil activo con:
  - Ver perfil.
  - Ajustes.
  - Cambiar perfil activo.
  - Lista de perfiles alternativos.
- Sidebar con:
  - Nombre artístico.
  - Profesión.
  - Biografía.
  - Ubicación del usuario.
  - Acceso a proyectos.
  - Acceso a contactos.
  - Acceso al calendario.
  - Acceso al dashboard de usuario.
  - Cerrar sesión.
- Área central blanca donde se renderiza el contenido de la vista mediante `<slot />`.

También contiene la lógica para:

- Obtener perfiles del usuario.
- Obtener la ubicación del usuario.
- Activar otro perfil mediante `PATCH /perfiles/{idPerfil}/activar`.
- Redirigir al Home luego del cambio de perfil.
- Cerrar sesión.
- Calcular si el dropdown y su submenú deben abrirse hacia la izquierda o hacia la derecha según el espacio disponible en pantalla.
- Recalcular la posición al redimensionar la ventana.

### [src/services/homeService.js](../../src/services/homeService.js)

Capa de acceso HTTP específica del Home.

Expone:

- `obtenerResumen()` para `GET /home/resumen`.
- `obtenerPerfilActivo()` para `GET /perfiles/activo`.

Utiliza el cliente Axios centralizado de [http.js](../../src/services/http.js), por lo que conserva el envío de credenciales y el tratamiento común de CSRF.

### [src/components/home/ProyectosSection.vue](../../src/components/home/ProyectosSection.vue)

Componente visual para proyectos destacados.

Estado actual:

- Recibe la lista mediante la prop `proyectos`.
- Muestra nombre y descripción de cada proyecto.
- Presenta un estado vacío cuando no hay proyectos.
- Todavía funciona como placeholder hasta que estén disponibles los endpoints definitivos de proyectos.

### [src/components/home/PublicacionesFeed.vue](../../src/components/home/PublicacionesFeed.vue)

Componente visual para publicaciones recientes.

Estado actual:

- Recibe la lista mediante la prop `publicaciones`.
- Muestra el contenido o texto de cada publicación.
- Presenta un estado vacío cuando no hay publicaciones.
- Todavía funciona como placeholder hasta que estén disponibles los endpoints definitivos de publicaciones.

## 3. Archivos modificados

### [src/views/usuario/HomeView.vue](../../src/views/usuario/HomeView.vue)

Vista orquestadora de `/home`.

Responsabilidades actuales:

- Solicitar el resumen del Home.
- Obtener como fallback el perfil activo mediante `/perfiles/activo`.
- Actualizar el estado reactivo del perfil activo.
- Cargar proyectos destacados y publicaciones recientes.
- Mostrar estado de carga.
- Mostrar errores mediante [AlertaBase.vue](../../src/components/AlertaBase.vue).
- Renderizar `ProyectosSection` y `PublicacionesFeed` dentro del área central de `HomeLayout`.

La información principal del perfil ya no se muestra como una tarjeta dentro de esta vista. Ahora la presenta `HomeLayout` en su sidebar.

Si no existe perfil activo, la vista informa que el usuario debe seleccionar uno desde el dashboard.

### [src/router/index.js](../../src/router/index.js)

Se actualizó el enrutamiento para:

- Asociar `/home` con `HomeLayout`.
- Proteger `/home` para usuarios autenticados con perfil activo.
- Redirigir al dashboard de usuario cuando se intenta acceder al Home sin perfil activo.
- Permitir acceder a `/dashboard-usuario` sin perfil activo.
- Permitir acceder al calendario sin perfil activo.
- Permitir acceder a editar un perfil sin perfil activo.
- Mantener las rutas administrativas y de autenticación existentes.

Rutas relevantes:

| Ruta | Layout | Función |
|---|---|---|
| `/home` | `HomeLayout` | Inicio contextual del perfil activo |
| `/dashboard-usuario` | `UserDashboardLayout` | Administración de perfiles |
| `/dashboard-usuario/calendario` | `UserDashboardLayout` | Jornada y disponibilidad |
| `/dashboard-usuario/editar-perfil/:id` | `UserDashboardLayout` | Edición de un perfil |

La vista independiente `SeleccionarPerfilView.vue` dejó de utilizarse y fue eliminada. La selección se realiza ahora desde las tarjetas del dashboard.

### [src/views/auth/LoginView.vue](../../src/views/auth/LoginView.vue)

Se ajustó la redirección posterior al login:

- Administradores: `/admin/dashboard`.
- Usuarios con perfil activo: `/home`.
- Usuarios sin perfil activo: `/dashboard-usuario`.

De esta manera, el usuario sin perfil activo puede seleccionar uno dentro del dashboard sin ser enviado a una vista separada.

### [src/views/usuario/DashboardUsuarioView.vue](../../src/views/usuario/DashboardUsuarioView.vue)

Esta vista permanece como el dashboard administrativo del usuario.

Cambios relacionados con el Home:

- Las tarjetas de perfil permiten iniciar sesión en un perfil mediante `Ingresar`.
- El botón `Ingresar` utiliza color verde y texto blanco.
- Al activar un perfil, redirige a `/home`.
- El modal de detalle conserva la acción de activar el perfil.
- Se eliminó el botón textual `Ver detalle` de las tarjetas.
- Se conserva el acceso al detalle mediante el ícono de persona.
- Se conserva la edición mediante el ícono de editar.
- Se conserva la eliminación y reactivación de perfiles.
- Cada tarjeta utiliza un color de la paleta del proyecto según la profesión.

### [src/components/UserDashboardLayout.vue](../../src/components/UserDashboardLayout.vue)

Este layout no se utiliza para `/home`; continúa destinado al dashboard administrativo del usuario.

Se conservaron y corrigieron sus funciones:

- Menú de cambio de perfil activo.
- Listado de perfiles alternativos.
- Creación de perfiles.
- Cierre de sesión.
- Acciones administrativas del usuario.

También se ajustó el ancho del `VaDropdownContent` para evitar que el menú se expandiera como una franja blanca de ancho completo.

## 4. Archivos de soporte utilizados por el Home

### [src/services/authState.js](../../src/services/authState.js)

Mantiene el estado reactivo de la sesión y del perfil activo.

El Home utiliza:

- `state.usuario`.
- `setPerfilActivo(perfil)`.
- `idPerfilActivo()`.
- `limpiarSesion()`.

El perfil activo se conserva en:

- `idPerfilActivo`.
- `nombreArtisticoActivo`.

### [src/services/perfilService.js](../../src/services/perfilService.js)

Proporciona las operaciones relacionadas con perfiles utilizadas por el Home:

- Listar perfiles del usuario.
- Activar un perfil.
- Obtener, editar, eliminar y reactivar perfiles.

La activación utiliza:

```text
PATCH /perfiles/{idPerfil}/activar
```

### [src/services/usuarioService.js](../../src/services/usuarioService.js)

El nuevo layout utiliza:

- `obtenerUbicacion()` para mostrar la ubicación del usuario en el sidebar.

También conserva las operaciones existentes de datos personales, baja y reactivación de cuenta.

### [src/components/home/PerfilActivoWidget.vue](../../src/components/home/PerfilActivoWidget.vue)

Este componente fue creado inicialmente para mostrar la información del perfil activo dentro del Home.

Estado actual:

- Permanece disponible en el repositorio.
- Ya no es renderizado por `HomeView`.
- La información del perfil activo fue trasladada al sidebar de `HomeLayout`, de acuerdo con la nueva maqueta.

## 5. Flujo actual del usuario

### Usuario con perfil activo

1. Inicia sesión.
2. Se consulta el estado de sesión.
3. Es redirigido a `/home`.
4. `HomeLayout` carga perfiles y ubicación.
5. `HomeView` carga el resumen del Home.

### Usuario sin perfil activo

1. Inicia sesión.
2. Es redirigido a `/dashboard-usuario`.
3. Visualiza las tarjetas de sus perfiles.
4. Presiona `Ingresar` en el perfil elegido.
5. Se activa el perfil mediante el backend.
6. Es redirigido a `/home`.

### Cambio de perfil desde el Home

1. Abre el dropdown del avatar.
2. Selecciona `Cambiar perfil activo`.
3. Elige un perfil alternativo.
4. Se ejecuta `PATCH /perfiles/{idPerfil}/activar`.
5. Se actualiza el estado global.
6. Se vuelve a cargar `/home` con el perfil seleccionado.

## 6. Estado visual y funcional

### Implementado

- Home independiente del dashboard administrativo.
- Barra superior.
- Buscador visual.
- Navegación principal.
- Sidebar del perfil activo.
- Ubicación del usuario.
- Dropdown de perfil.
- Submenú de perfiles alternativos.
- Dropdown adaptable a los bordes de la pantalla.
- Acceso a dashboard y calendario.
- Cambio de perfil activo.
- Cierre de sesión.
- Contenedor central para contenido futuro.

### Placeholder o pendiente

- Búsqueda de perfiles todavía sin lógica de consulta.
- Proyectos todavía sin endpoint específico.
- Contactos todavía sin pantalla funcional.
- Mensajes todavía sin pantalla funcional.
- Notificaciones todavía sin backend conectado.
- Los accesos de proyectos utilizan temporalmente el dashboard de perfiles.
- El área central todavía muestra estados vacíos para proyectos y publicaciones.

## 7. Validación

Se ejecutó:

```bash
npm run build
```

Resultado:

- Build exitoso con Vite.
- No se detectaron errores de compilación.
- Se mantiene la advertencia de Vite sobre chunks mayores a 500 kB.

## 8. Conclusión

La implementación actual separa correctamente dos experiencias:

- `UserDashboardLayout`: administración de la cuenta y de los perfiles.
- `HomeLayout`: navegación y contenido contextual del perfil activo.

El Home ya cuenta con la estructura visual principal de la maqueta y con el flujo de selección y cambio de perfil activo. Las secciones de proyectos, publicaciones, contactos, mensajes y notificaciones quedan preparadas para conectarse cuando el backend exponga sus contratos definitivos.
