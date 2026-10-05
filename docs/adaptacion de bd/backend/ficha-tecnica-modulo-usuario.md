# Ficha Técnica: Módulo de Usuario - Frontend

## 1. Visión General
Módulo de gestión de datos personales y estado de cuenta de usuario. Proporciona funcionalidades para actualizar datos personales, solicitar baja temporal de cuenta y reactivar cuenta. El frontend consumirá los endpoints REST para proporcionar gestión del perfil de usuario y control de estado de cuenta.

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

**Javat constraints:**
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

### 2. Solicitar Baja de Cuenta (`/usuario/solicitar-baja`)

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

### 3. Reactivar Cuenta (`/usuario/reactivar-cuenta`)

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
- **Limitación:** Después de 30 días, la cuenta se elimina permanentemente y no se puede reactivar

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
- `fechaNacimiento` (LocalDate - formato dd-MM-aaaa)
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
- `fechaLimite` (LocalDateTime - cuándo se elimina permanentemente)

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
6. Actualizar UI: botón de "Reactivar" aparece en perfil

### 4.3 Flujo de Reactivación
1. Usuario con cuenta PENDIENTE_BAJA (dentro de los 30 días)
2. Accede a perfil o configuración
3. Clic en "Reactivar Cuenta"
4. Modal de confirmación rápida
5. Ejecutar POST /usuario/reactivar-cuenta
6. Estado cambia a ACTIVO inmediatamente
7. Cookie de sesión actualizada (si era perfil activo)

### 4.4 Visualización de Estado de Cuenta
- **Perfil de usuario:** Mostrar tiempo restante para reactivación
- **Formato:** "Cuenta en baja hasta el 20 de enero de 2024" o "30 días restantes"
- **Clases CSS/estilos:** Diferente color según proximidad al límite (verde > 15 días, amarillo 8-15 días, rojo < 8 días)

## 5. Patrón y Componentes Recomendados

### 5.1 Librerías Sugeridas
- **React Hook Form** + **Yup** para validación de formulario datos personales
- **Axios** para consumo de APIs
- **Day.js** o **date-fns** para manejo de fechas (validar fecha pasada, calcular días restantes)
- **React Select** o **Material-UI Select** para dropdowns de género y búsqueda de localidades
- **SweetAlert2** para modals de confirmación (baja, reactivación)
- **Toastify** o **notifications** para mensajes temporales

### 5.2 Componentes por funcionalidad

**DatosPersonalesForm:**
- Formulario reactivo con schema Yup validación
- Date picker para fecha nacimiento
- Select género con opciones codificadas
- Input/search localidad catálogo Georef
- Preview de ubicación actual si existe
- Botón guardar que hace PUT /usuario/datos-personales

**BajaCuentaModal:**
- Confirmación con detalles del proceso de 30 días
- Mostrar mensaje y fechaLimite de SolicitudBajaResponse
- Botón "Solicitar Baja" principal
- Estilo de advertencia/alert

**ReactivarCuentaModal:**
- Disponible solo cuando cuenta está PENDIENTE_BAJA y dentro del período
- Confirmación rápida "¿Desea reactivar su cuenta?"
- POST /usuario/reactivar-cuenta al confirmar
- Éxito: mensaje confirmación + redirección/actualización estado

**CuentaEstadoBanner:**
- Componente que muestra cuándo cuenta está PENDIENTE_BAJA
- Contador regresivo de días restantes
- Formato: "30 días para reactivar" o "X días restantes"
- Acceso rápido a botón reactivar

### 5.3 Integración con Módulo Perfiles
- Los datos personales se reflejan en el perfil artístico
- `idUsuario` en DatosPersonalesResponse corresponde a `idUsuario` en PerfilResponse
- Ubicación geográfica puede mostrarse en perfil público
- Género puede influir en ciertas características o búsquedas

### 5.4 Manejo de Estados y Caching

- **React Query** para fetching de datos personales
- Cache de localidad/catálogo Georef (puede ser estático)
- Calculadora en tiempo real de días restantes para baja:
  - `diasRestantes = fechaLimite - fechaActual`
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

1. **Validaciones stricto sensu:** Las anotaciones `@NotBlank`, `@Size`, `@NotNull`, `@Past` en backend deben ser respetadas en validación frontend (Yup schema debe ser compatible)

2. **Formato fechas:**
   - `fechaNacimiento`: `LocalDate` → formato `yyyy-MM-dd` en input date
   - `fechaLimite`: `LocalDateTime` → formato `yyyy-MM-ddTHH:mm:ss` para display

3. **BigDecimal para coordenadas:** latitud/longitud vienen como BigDecimal - usar librería compatible en frontend (dayjs plugins, decimal.js)

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
1. En configuración de cuenta o perfil, clic en "Solicitar Baja"
2. Modal de confirmación con explicación del proceso
3. Usuario confirma solicitud
4. Response: mensaje + fechaLimite mostrados en pantalla
5. Estado cuenta cambia a PENDIENTE_BAJA visualmente
6. Mostrar contador regresivo: "30 días para reactivar"
7. Durante los 30 días, opción "Reactivar cuenta" está disponible

### Flujo 3: Reactivar Cuenta (dentro de 30 días)
1. Usuario ve contador regresivo o banner de "cuenta en baja"
2. Clic en "Reactivar Cuenta"
3. Modal confirmación rápida
4. POST /usuario/reactivar-cuenta ejecutado
5. Response: mensaje confirmación
6. Estado cuenta vuelve a ACTIVO
7. Banner/contrador desaparece
8. Usuario tiene acceso completo de nuevo

### Flujo 4: Gestionar Ubicación Geográfica
1. Usuario ve su ubicación actual en el formulario de datos personales
2. Clic en "Cambiar ubicación" o lápiz edit
3. Search picker o input para nueva localidad ID Georef
4. Seleccionar nueva localidad del catálogo
5. Guardar cambios → actualiza UbicacionResponse con nueva ciudad/coordenadas
6. Si deja vacío → ubicacion becomes null, se muestra "Sin ubicación" en UI

---
*Ficha técnica generada basada en el análisis de endpoints y DTOs del módulo usuario en C:\Users\HP\Desktop\modalink-backend\src\main\java\org\mgroko\backend\usuario*