# Ficha técnica — Tipos de contrato (UC-76)

**Módulo:** Administración / Contratos  
**Ruta:** `/admin/tipos-contrato`  
**Permiso de acceso:** `VER_TIPOS_CONTRATO`

---

## 1. Objetivo

Permitir al Administrador gestionar el catálogo global de tipos de contrato usados al generar o modificar contratos.

La pantalla permite:

- listar tipos activos e inactivos;
- buscar por nombre, código o descripción;
- crear un tipo con nombre, descripción y plantilla legal;
- editar nombre, descripción y plantilla;
- activar o desactivar un tipo;
- eliminar un tipo sin contratos asociados;
- validar la plantilla y sus placeholders.

---

## 2. Reglas de UI

| Situación | Acción |
|---|---|
| Tipo sin contratos vivos | Se puede editar nombre y plantilla. |
| Tipo con contratos `BORRADOR`, `PENDIENTE_FIRMA` o `ACTIVO` | Se deshabilitan nombre y plantilla; solo se puede editar la descripción. |
| Tipo con contratos `PENDIENTE_FIRMA` | Se deshabilita “Desactivar”. |
| Tipo con contratos `ACTIVO` o cerrados | Se permite “Desactivar” si no es el último activo. |
| Tipo con cualquier contrato | Se deshabilita “Eliminar”. |
| Último tipo activo | Se deshabilita “Desactivar” y “Eliminar”. |

El backend devuelve `puedeEditar`, `puedeDesactivar`, `puedeEliminar` y los motivos de bloqueo. La UI debe usar esos flags y no recalcular las reglas.

---

## 3. Endpoints

| Método | Endpoint | Permiso |
|---|---|---|
| GET | `/admin/tipos-contrato` | `VER_TIPOS_CONTRATO` |
| GET | `/admin/tipos-contrato/{id}` | `VER_TIPOS_CONTRATO` |
| POST | `/admin/tipos-contrato` | `CREAR_TIPO_CONTRATO` |
| PUT | `/admin/tipos-contrato/{id}` | `MODIFICAR_TIPO_CONTRATO` |
| PATCH | `/admin/tipos-contrato/{id}/estado` | `MODIFICAR_TIPO_CONTRATO` |
| DELETE | `/admin/tipos-contrato/{id}` | `ELIMINAR_TIPO_CONTRATO` |
| POST | `/admin/tipos-contrato/validar-plantilla` | `CREAR_TIPO_CONTRATO` |

---

## 4. Placeholders

- `{{proyecto}}`
- `{{director}}`
- `{{partes}}`
- `{{clausulas_adicionales}}`
- `{{tipo}}`

Deben escribirse exactamente, sin espacios internos. `{{ proyecto }}` se considera inválido.

---

## 5. Implementación frontend

- Servicio: `src/services/adminTiposContratoService.js`.
- Vista: `src/views/admin/GestionTiposContratoView.vue`.
- Ruta: `src/router/index.js`.
- Menú: `src/components/admin/AdminLayout.vue`.
- Permisos: `src/services/authState.js` (`PERMISOS_ADMIN`).

La vista incluye:

- tabla con filtros locales;
- modal de alta/edición;
- editor de plantilla con contador;
- botones para insertar placeholders;
- validación contra el backend;
- confirmaciones de estado y baja;
- mensajes de error por código HTTP.

---

## 6. Errores esperados

| HTTP | Código |
|---|---|
| 400 | `TIPO_CONTRATO_PLANTILLA_INVALIDA` |
| 404 | `TIPO_CONTRATO_NO_ENCONTRADO` |
| 409 | `TIPO_CONTRATO_DUPLICADO` |
| 409 | `TIPO_CONTRATO_CON_CONTRATOS_VIVOS` |
| 409 | `TIPO_CONTRATO_CON_CONTRATOS_PENDIENTES` |
| 409 | `TIPO_CONTRATO_EN_USO` |
| 409 | `ULTIMO_TIPO_CONTRATO_ACTIVO` |
