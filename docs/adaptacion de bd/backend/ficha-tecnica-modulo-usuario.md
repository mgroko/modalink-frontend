# Ficha Técnica: Módulo de Usuario - Frontend

## 1. Visión General
Módulo de gestión de datos personales y estado de cuenta de usuario. Proporciona funcionalidades para registrarse, iniciar y cerrar sesión, actualizar datos personales, solicitar baja temporal de cuenta y reactivar cuenta. El frontend consumirá los endpoints REST para proporcionar gestión del perfil de usuario y control de estado de cuenta.

## 2. Endpoints de API REST

### 2.1 Datos Personales (`/usuario/datos-personales`)

| Método | Endpoint | Descripción | Autorización |
|--------|----------|-------------|--------------|
| PUT | `/usuario/datos-personales` | Actualizar datos personales del usuario | Requiere auth |

**DatosPersonalesRequest:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "fechaNacimiento": "1990-05-15",
  "genero": "MASCULINO",
  "localidadId": 5
}
```

**Java constraints:**
- `nombre`: `@NotBlank @Size(min = 2, max = 50)` - obligatorio
- `apellido`: `@NotBlank @Size(min = 2, max = 50)` - obligatorio
- `fechaNacimiento`: `@NotNull @Past` - fecha pasada, obligatoria
- `genero`: `@NotBlank` - código de género, obligatorio
- `localidadId`: String - ID localidad catálogo Georef; null/vacio = sin ubicación

**DatosPersonalesResponse:**
```json
{
  "idUsuario": 1,
  "nombre": "Juan",
  "apellido": "Pérez",
  "fechaNacimiento": "1990-05-15",
  "genero": "MASCULINO",
  "ubicacion": {
    "idUbicacion": 10,
    "direccion": "Calle Falsa 123",
    "codigoPostal": "28001",
    "latitud": 40.4168,
    "longitud": -3.7038,
    "ciudad": {
      "idCiudad": 1,
      "idExterno": "GEOREF-123",
      "fuenteApi": "GEOREF",
      "nombre": "Madrid",
      "provincia": {...}
    }
  }
}
```

### 2.2 Solicitar Baja de Cuenta (`/usuario/solicitar-baja`)

| Método | Endpoint | Descripción | Autorización |
|--------|----------|-------------|--------------|
| POST | `/usuario/solicitar-baja` | Solicitar baja temporal de cuenta | Requiere auth |

**SolicitudBajaResponse:**
```json
{
  "mensaje": "Se ha solicitado la baja de su cuenta. Tiene 30 días para reactivarla.",
  "fechaLimite": "2024-01-20T10:30:00"
}
```

- **Proceso:** Usuario solicita baja → cuenta pasa a estado PENDIENTE_BAJA → cuenta regresiva de 30 días
- **fechaLimite:** Fecha exacta cuando la cuenta se eliminará permanentemente si no se reactiva
- **Mensaje:** Informa al usuario sobre el período de 30 días
- **Plazo configurable:** 30 días es el valor por defecto; el administrador lo cambia en
  `/admin/configuracion/schedulers/baja` (`diasBaja`, 1–365) y el nuevo valor se aplica a la
  solicitud, a la reactivación y a la expiración automática (mismo plazo para cuentas y perfiles).

> **Nota técnica (backend):** al vencer el plazo, `BajaScheduler` → `ExpirarCuentaService.expirarVencidos()`
> pasa la cuenta al estado `BAJA` (y sus perfiles a `Baja`); **la fila no se borra físicamente**.
> El copy mostrado al usuario dice *"eliminación permanente"* (decisión de producto): para el usuario
> el efecto es el mismo, porque una cuenta `BAJA` nunca más puede iniciar sesión ni recuperarse.

### 2.3 Reactivar Cuenta con sesión (`/usuario/reactivar-cuenta`)

| Método | Endpoint | Descripción | Autorización |
|--------|----------|-------------|--------------|
| POST | `/usuario/reactivar-cuenta` | Reactivar cuenta dada de baja | Requiere auth |

**ReactivarCuentaResponse:**
```json
{
  "mensaje": "Su cuenta ha sido reactivada exitosamente."
}
```

- **Proceso:** Dentro de los 30 días de solicitar baja → cuenta vuelve a estado ACTIVO
- **Limitación:** Pasado el plazo (`diasBaja`), responde `409` ("El plazo de N días… ha expirado") y
  la cuenta pasará a `BAJA` con el scheduler (no se puede reactivar)

### 2.4 Inicio de sesión con cuenta pendiente de baja (`POST /auth/login`)

| Método | Endpoint | Descripción | Autorización |
|--------|----------|-------------|--------------|
| POST | `/auth/login` | Login; devuelve **403** si la cuenta está PENDIENTE_BAJA | Público |

Cuando las credenciales son válidas pero la cuenta está en estado `PENDIENTE_BAJA`, **no se emite sesión** (no hay header `Set-Cookie`) y se responde:

| Código | Causa |
|--------|-------|
| `403` | Dentro del plazo: se ofrece la reactivación (payload abajo) |
| `409` | Plazo vencido: `"El plazo de 30 días para recuperar la cuenta ha expirado."` (30 = `diasBaja` configurado) |
| `401` | Credenciales inválidas |
| `403` | Usuario `DESHABILITADO`: payload genérico `{ message, httpStatus, timestamp }` **sin** `codigo: "CUENTA_PENDIENTE_BAJA"` (el front solo abre el modal si trae ese código) |

**Respuesta 403:**
```json
{
  "message": "Solicitaste la baja de tu cuenta. Reactívala antes del 20/01/2024 10:30 para poder iniciar sesión.",
  "codigo": "CUENTA_PENDIENTE_BAJA",
  "fechaSolicitudBaja": "2023-12-21T10:30:00",
  "fechaLimite": "2024-01-20T10:30:00",
  "diasRestantes": 25,
  "httpStatus": 403,
  "timestamp": 1703500000000
}
```

- **Front (implementado en `LoginView.vue`):** ante `403` + `codigo: "CUENTA_PENDIENTE_BAJA"` mostrar el modal [Cancelar / Reactivar cuenta] con el contador basado en `diasRestantes` (o `fechaLimite`).
- **Requiere contraseña correcta:** el estado del cuenta no se revela a credenciales inválidas (se responde `401` genérico).

### 2.5 Reactivar cuenta desde el login (`POST /auth/reactivar-cuenta`)

| Método | Endpoint | Descripción | Autorización |
|--------|----------|-------------|--------------|
| POST | `/auth/reactivar-cuenta` | Reactiva la cuenta **y** abre sesión en el mismo paso | Público (body: credenciales) |

**Request:** mismo body que `/auth/login` (`correo`, `password`).

**Respuesta `200`:** igual a un login normal (`AuthResponse` + header `Set-Cookie` con el JWT), por lo que el front queda dentro de la aplicación sin necesitar un paso extra.

| Código | Causa |
|--------|-------|
| `200` | Cuenta reactivada y sesión emitida |
| `401` | Credenciales inválidas |
| `409` | No hay solicitud activa o el plazo ya venció |

> `POST /usuario/reactivar-cuenta` (§2.3, requiere auth) **sigue existiendo** para reactivar desde una sesión ya iniciada; `/auth/reactivar-cuenta` es el camino a usar cuando el login fue bloqueado (no hay sesión).

### 2.6 Cerrar sesión (`POST /auth/logout`)

| Método | Endpoint | Descripción | Autorización |
|--------|----------|-------------|--------------|
| POST | `/auth/logout` | Invalida la sesión actual (cookie vencida) | Requiere auth |

- **`200`:** limpia el contexto de seguridad y devuelve header `Set-Cookie` con el JWT **expirado**.
- **`401`:** no había sesión activa.

**Front:** todo cierre de sesión debe llamar a este endpoint **y** limpiar el estado local
(helper `finalizarSesion()` en `services/authState.js`, best-effort: si el logout falla por red,
el estado local igual se limpia). Se usa en el logout del layout y al confirmar la solicitud de
baja (por eso no quedan cookies huérfanas que restauren una sesión `PENDIENTE_BAJA`).

### 2.7 Registro (`POST /auth/registro`)

| Método | Endpoint | Descripción | Autorización |
|--------|----------|-------------|--------------|
| POST | `/auth/registro` | Alta de cuenta local; crea la sesión en el mismo paso | Público |

**RegistroRequest:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "dni": "12345678",
  "fechaNacimiento": "1990-05-15",
  "correo": "juan@mail.com",
  "genero": "MUJER",
  "password": "secret123"
}
```

**Java constraints:**
- `nombre` / `apellido`: `@NotBlank @Size(min = 2, max = 50)`
- `dni`: `@NotBlank @Pattern("^[0-9]{1,15}$")` — únicamente dígitos
- `fechaNacimiento`: `@NotNull @Past` — además debe ser mayor de 18 años (`400`)
- `correo`: `@NotBlank @Email`
- `genero`: `@NotBlank @Size(max = 50)` — debe existir en el catálogo (`400` si no)
- `password`: `@NotBlank`

**Respuesta `200`:** `AuthResponse { usuario }` + header `Set-Cookie` (entra directo a la app).

| Código | Causa |
|--------|-------|
| `400` | Validación `@Valid` (mapa `errores` por campo), edad < 18 o género inexistente |
| `409` | Correo ya registrado / DNI ya registrado |
| `500` | Rol global `'Usuario'` no configurado (error de instalación) |

**Front:** vista `RegistroView.vue` → `authService.registrar()`; ya implementada.

### 2.8 (pendiente) Recuperar contraseña — `POST /auth/recuperar-password`

> **No está implementado en el backend.** El front ya tiene la vista
> (`RecuperarPasswordView.vue` → `authService.recuperarPassword()`) y hoy recibiría `404`.
> Documentar el contrato recién cuando el backend lo agregue.

## 3. Modelos de Datos para Frontend

### 3.1 DatosPersonalesRequest
- `nombre` (String, 2-50 chars, obligatorio)
- `apellido` (String, 2-50 chars, obligatorio)
- `fechaNacimiento` (LocalDate, fecha pasada ≥ hoy, obligatoria)
- `genero` (String, código obligatorio, ej: "MUJER","HOMBRE", "NO_BINARIO", "NO_DECIRLO")
- `localidadId` (String, opcional - ID catálogo Georef; null/vacio = sin ubicación)

### 3.2 DatosPersonalesResponse
- `idUsuario` (Long)
- `nombre` (String)
- `apellido` (String)
- `fechaNacimiento` (LocalDate — el backend serializa `yyyy-MM-dd`; el front muestra `dd/mm/aaaa`)
- `genero` (String - código)
- `ubicacion` (UbicacionResponse, opcional - null si no tiene ubicación)

### 3.3 UbicacionResponse (anidada en DatosPersonalesResponse)
- `idUbicacion` (Long)
- `direccion` (String - dirección en texto libre)
- `codigoPostal` (String - código postal)
- `latitud` (BigDecimal - coordenadas geográficas)
- `longitud` (BigDecimal - coordenadas geográficas)
- `ciudad` (CiudadResponse - objeto anidado)

### 3.4 CiudadResponse (anidada en UbicacionResponse)
- `idCiudad` (Long)
- `idExterno` (String - ID en catálogo origen, ej. "GEOREF-123")
- `fuenteApi` (String - origen catálogo, ej. "GEOREF")
- `nombre` (String - nombre ciudad)
- `provincia` (provincia anidada - estructura completa)

### 3.5 SolicitudBajaResponse
- `mensaje` (String - mensaje explicativo al usuario)
- `fechaLimite` (LocalDateTime - fin del plazo de reactivación; al vencer la cuenta pasa a `BAJA`)

### 3.6 ReactivarCuentaResponse
- `mensaje` (String - confirmación de reactivación)

## 4. Consideraciones de UI/UX

### 4.1 Formulario de Datos Personales
- **Campos del formulario:**
  - Nombre (input text, 2-50 chars, requerido, validación backend)
  - Apellido (input text, 2-50 chars, requerido, validación backend)
  - Fecha de nacimiento (date picker, fecha debe ser pasada)
  - Género (select dropdown con códigos (para el display utilizar el nombre asociado a los códigos): "MUJER","HOMBRE", "NO_BINARIO", "NO_DECIRLO")
  - Localidad/Ubicación (input opcional o search picker catálogo Georef)

- **Validaciones frontend (acorde a backend):**
  - Nombre y apellido mín. 2 máx. 50 caracteres
  - Fecha nacimiento: no puede ser futura
  - Género: campo requerido con opciones definidas

- **Ubicación:**
  - Si el usuario ya tiene ubicación, mostrar datos completos (ciudad, dirección, CP)
  - Input para seleccionar/changear localidad del catálogo Georef
  - Opción "Sin ubicación" (dejar campo vacío/null)

### 4.2 Flujo de Solicitud de Baja
1. Usuario accede a configuración de cuenta
2. Clic en "Solicitar Baja" o "Cerrar Cuenta"
3. Modal de confirmación explicando:
   - La cuenta pasará a estado PENDIENTE_BAJA
   - Período de 30 días para reactivar
   - Después de 30 días, eliminación permanente
4. Confirmar acción
5. Mostrar respuesta: mensaje + fecha límite
6. **Implementación actual (decisión de UX):** el front cierra la sesión
   (`POST /auth/logout` → cookie invalidada, §2.6) y redirige a login; el mensaje + `fechaLimite`
   se persisten (`authState.guardarBajaCuenta`) y se muestran una sola vez en la vista de login.
   La reactivación ocurre desde el modal de login (Flujo 3a). La opción "Reactivar" dentro de una
   sesión abierta (§4.3B) queda **deshabilitada en el front**.

### 4.3 Flujo de Reactivación

**A) Desde el login (sin sesión) — camino principal:**
1. Usuario ingresa correo y contraseña y confirma el login
2. Backend responde `403` con `codigo: "CUENTA_PENDIENTE_BAJA"` (no se emite cookie)
3. Modal: "Solicitaste la baja de tu cuenta…" con contador de días (`diasRestantes`) y botones [Cancelar / Reactivar cuenta]
4. **Reactivar cuenta:** `POST /auth/reactivar-cuenta` con las mismas credenciales → `200` + `Set-Cookie` + `AuthResponse` → entrar directo a la app
5. **Cancelar:** cerrar el modal y volver al formulario de login (no existe sesión que limpiar)
6. Si el backend responde `409`, el plazo venció: mostrar el mensaje y redirigir al login (la cuenta pasará a `BAJA` con el scheduler)

**B) Desde una sesión iniciada:**

> **Estado actual — deshabilitado en el front (decisión de UX):** como el front cierra la sesión
> (cookie invalidada) al solicitar la baja (§4.2) y el login con `PENDIENTE_BAJA` responde `403`
> sin emitir sesión, **no puede existir una sesión autenticada con cuenta pendiente**. El backend
> sí soporta este flujo (la sesión abierta antes de solicitar la baja no se cierra del lado
> servidor) y el endpoint sigue operativo; solo está inalcanzable desde la UI actual.

1. Usuario con cuenta PENDIENTE_BAJA (dentro de los 30 días) con sesión vigente (la sesión abierta antes de solicitar la baja **no** se cierra)
2. Accede a perfil o configuración
3. Clic en "Reactivar Cuenta" → `POST /usuario/reactivar-cuenta`
4. Estado del usuario y de sus perfiles cambia a `ACTIVO`
5. Refrescar los datos del usuario con `GET /auth/me` (la respuesta de reactivación solo trae `mensaje`; la cookie no se modifica)

### 4.4 Visualización de Estado de Cuenta

> **Estado actual — no implementado en el front (misma decisión que §4.3B):** sin una sesión
> `PENDIENTE_BAJA` accesible, no hay dónde mostrar el banner/contador. El backend sí expone los
> datos necesarios (`diasRestantes`, `fechaLimite` en el `403` de login, §2.4) por lo que el
> componente puede rehabilitarse si cambia la decisión de UX.

- **Perfil de usuario:** Mostrar tiempo restante para reactivación
- **Formato:** "Cuenta en baja hasta el 20 de enero de 2024" o "30 días restantes"
- **Clases CSS/estilos:** Diferente color según proximidad al límite (verde > 15 días, amarillo 8-15 días, rojo < 8 días)

## 5. Patrón y Componentes Recomendados

### 5.1 Stack real del front (implementado)

> La sección original sugería React/Yup/dayjs; el front está hecho en **Vue 3 + Vuestic UI**.
> Estos son los equivalentes realmente en uso:

- **Vue 3 (Options API)** + **Vuestic UI**: `VaModal`, `VaButton`, `VaInput`, `VaForm`, `VaAlert`, etc.
- **Axios** (`services/http.js`) para consumo de APIs (interceptor de auth por cookie httpOnly).
- **Fechas:** util propio `src/utils/fechas.js` — `formatearFecha` → `dd/mm/aaaa hh:mm`,
  `formatearFechaCorta` → `dd/mm/aaaa`, `diasRestantes(fecha)`. **Sin dayjs/date-fns.**
- **Validaciones de formulario:** `rules` de Vuestic (`utils/reglas.js` + reglas inline) — **sin Yup**.
- **Mensajes/alertas:** `components/AlertaBase.vue` (`BaseAlert`); confirmaciones con `VaModal` — sin SweetAlert2/Toastify.
- **Estado de sesión:** `services/authState.js` (reactive de Vue + `localStorage` para el flag de baja).

### 5.2 Componentes por funcionalidad (mapeo real)

**DatosPersonalesForm → `views/usuario/ModificarDatosView.vue`:**
- Formulario con `VaForm` y rules de validación
- Date picker para fecha nacimiento (`yyyy-MM-dd` en el input)
- Select género con opciones codificadas + nombre visible
- Input/search localidad catálogo Georef + opción "Sin ubicación"
- Guardar → `PUT /usuario/datos-personales`

**BajaCuentaModal → modal dentro de `components/usuario/UserDashboardLayout.vue`:**
- Confirmación con el copy de plazo configurado (30 días por defecto)
- Muestra mensaje y `fechaLimite` de `SolicitudBajaResponse` (se persisten y se ven en login)
- Al confirmar: `POST /usuario/solicitar-baja` → `finalizarSesion()` (logout + cookie invalidada) → login
- Oculta la acción "Solicitar baja del sistema" si la cuenta ya está `PENDIENTE_BAJA`

**ReactivarCuentaModal → modal dentro de `views/auth/LoginView.vue`:**
- Se abre ante `403` + `codigo: "CUENTA_PENDIENTE_BAJA"` (§2.4)
- Muestra el `message` del backend + días restantes; botones [Cancelar / Reactivar cuenta]
- Reactivar → `authService.reactivarCuentaDesdeLogin()` (`POST /auth/reactivar-cuenta`, §2.5)
- `409` → plazo vencido: mensaje y permanece en login

**CuentaEstadoBanner → no implementado (ver §4.4).**

### 5.3 Integración con Módulo Perfiles
- Los datos personales se reflejan en el perfil artístico
- `idUsuario` en DatosPersonalesResponse corresponde a `idUsuario` en PerfilResponse
- Ubicación geográfica puede mostrarse en perfil público
- Género puede influir en ciertas características o búsquedas

### 5.4 Manejo de Estados y Caching

- **Sin React Query:** fetching directo con Axios + estado reactivo de Vue (`authState.js`);
  el flag de baja se persiste en `localStorage` (clave `modalink.cuentaBaja`)
- Cache de localidad/catálogo Georef (puede ser estático)
- Calculadora en tiempo real de días restantes para baja:
  - Al hacer login bloqueado el backend ya devuelve `diasRestantes` (§2.4)
  - Si se tiene `fechaLimite`: `diasRestantes = fechaLimite - fechaActual`
  - Actualizar display cada 24h o cada hora
- Invalidar cache después de actualizar datos personales
- Estado local para modals abiertos/cerrados

## 6. Rutas y Navegación Sugerida

```
/usuario/datos-personales → Formulario actualizar datos personales (PUT)
/usuario/solicitar-baja → Solicitar baja temporal (POST)
/usuario/reactivar-cuenta → Reactivar cuenta dada de baja (POST)
```

## 7. Consideraciones Importantes del Backend

1. **Validaciones stricto sensu:** Las anotaciones `@NotBlank`, `@Size`, `@NotNull`, `@Past` en backend deben ser respetadas en validación frontend (rules de Vuestic en el front deben ser compatibles)

2. **Formato fechas:**
   - `fechaNacimiento`: `LocalDate` → formato `yyyy-MM-dd` en input date; el front muestra `dd/mm/aaaa`
   - `fechaLimite`: `LocalDateTime` → `yyyy-MM-ddTHH:mm:ss` en JSON; el front muestra `dd/mm/aaaa hh:mm` (`formatearFecha` de `utils/fechas.js`)

3. **BigDecimal para coordenadas:** latitud/longitud llegan como número JSON — en el front se manejan como `Number` (inputs con `step`), sin librerías extra

4. **Catálogo Georef localidadId:** Es un String que representa ID externo en catálogo origen (puede ser null/vacio). El frontend debe manejar caso "sin ubicación" (campo vacío).

5. **Autenticación Spring Security:** Todos los endpoints requieren `Authentication` con `getPrincipal()` que contiene el idUsuario como String

6. **Respuestas estandarizadas:** `SolicitudBajaResponse` y `ReactivarCuentaResponse` solo contienen `mensaje` + `fechaLimite` (o solo mensaje) - frontend debe mostrar estos mensajes tal cual del backend

## 8. Flujos de Trabajo Comunes

### Flujo 1: Actualizar Datos Personales
1. Usuario accede a configuración → "Editar datos personales"
2. Formulario pre-cargado con datos actuales
3. Usuario modifica los campos que desee (nombre, apellido, fecha nacimiento, género)
4. Si tiene ubicación actual, se muestra y puede ser cambiada
5. Clic en "Guardar" (hace PUT /usuario/datos-personales)
6. Éxito: mensaje toast "Datos actualizados correctamente"
7. UI actualizada con nuevos datos

### Flujo 2: Solicitar Baja Temporal
1. En el dashboard de usuario (sidebar), clic en "Solicitar baja del sistema"
2. Modal de confirmación con explicación del proceso (copy de producto: plazo de 30 días y eliminación permanente al vencer)
3. Usuario confirma solicitud → `POST /usuario/solicitar-baja` → `200 { mensaje, fechaLimite }`
4. El front persiste mensaje + fechaLimite (`authState.guardarBajaCuenta`) y cierra la sesión con `POST /auth/logout` (cookie invalidada, §2.6)
5. Redirige a login, donde se muestra una sola vez: el mensaje del backend + "Podés reactivarla antes del dd/mm/aaaa hh:mm"
6. La reactivación ocurre en el siguiente intento de login → `403 CUENTA_PENDIENTE_BAJA` → modal (Flujo 3a)

### Flujo 3: Reactivar Cuenta (dentro de 30 días)

**3a. El intento de login fue bloqueado (sin sesión):**
1. Usuario intenta iniciar sesión → `403` con `codigo: "CUENTA_PENDIENTE_BAJA"` y `diasRestantes`
2. Modal "Solicitaste la baja de tu cuenta…" con [Cancelar / Reactivar cuenta]
3. Reactivar: `POST /auth/reactivar-cuenta` con las mismas credenciales → `200` + cookie + `AuthResponse` → entrar a la app
4. Cancelar: volver al login (no hay sesión que limpiar)
5. `409` → plazo vencido: mostrar mensaje y quedarse en el login

**3b. Sesión iniciada (banner en perfil/configuración) — deshabilitado en el front, ver §4.3B:**
1. Usuario ve contador regresivo o banner de "cuenta en baja"
2. Clic en "Reactivar Cuenta" → confirmación rápida
3. `POST /usuario/reactivar-cuenta` → `200` con `mensaje`
4. Refrescar datos con `GET /auth/me` (el estado pasa a `ACTIVO`; la cookie no cambia)
5. Banner/contador desaparece; acceso completo de nuevo

### Flujo 4: Gestionar Ubicación Geográfica
1. Usuario ve su ubicación actual en el formulario de datos personales
2. Clic en "Cambiar ubicación" o lápiz edit
3. Search picker o input para nueva localidad ID Georef
4. Seleccionar nueva localidad del catálogo
5. Guardar cambios → actualiza UbicacionResponse con nueva ciudad/coordenadas
6. Si deja vacío → ubicacion becomes null, se muestra "Sin ubicación" en UI

---
*Ficha técnica generada basada en el análisis de endpoints y DTOs del módulo usuario en C:\Users\HP\Desktop\modalink-backend\src\main\java\org\mgroko\backend\usuario*