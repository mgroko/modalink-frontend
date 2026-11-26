# Ficha técnica: contratos con borrador

## Objetivo

Alinear el frontend con el flujo borrador-first del backend:

1. Crear un contrato en `BORRADOR`.
2. Editar nombre, descripción, destinatarios, cláusulas y texto.
3. Guardar sin notificar.
4. Emitir cuando el contrato esté completo.

La previsualización es opcional. La emisión es la única operación que notifica
a las partes.

## Endpoints

| Método | Endpoint | Acción |
|---|---|---|
| `GET` | `/proyectos/{idProyecto}/contratos/opciones` | Contexto de tipos, miembros y contratos activos |
| `POST` | `/proyectos/{idProyecto}/contratos/previsualizar` | Texto y conflictos sin persistir (opcional) |
| `POST` | `/proyectos/{idProyecto}/contratos` | Crear borrador (`201`) |
| `PUT` | `/proyectos/{idProyecto}/contratos/{idContrato}` | Guardar borrador o contrato pendiente |
| `POST` | `/proyectos/{idProyecto}/contratos/{idContrato}/emitir` | Emitir borrador y notificar |
| `DELETE` | `/proyectos/{idProyecto}/contratos/{idContrato}` | Baja lógica |
| `GET` | `/proyectos/{idProyecto}/contratos/{idContrato}` | Detalle |
| `GET` | `/contratos/buscar` | Búsqueda global |

## Request unificado

```json
{
  "idTipoAcuerdo": 1,
  "idsMiembro": [8, 9],
  "nombre": "Contrato campaña verano",
  "descripcion": "Cesión de imagen para la campaña",
  "modoTexto": "AUTO",
  "clausulasAdicionales": ["La parte cedente conserva..."],
  "texto": null
}
```

- `modoTexto: "AUTO"` regenera desde la plantilla.
- `modoTexto: "MANUAL"` usa `texto` tal cual.
- En borrador, `idsMiembro` y el texto pueden quedar incompletos.
- Al emitir se exige al menos un destinatario activo y texto no vacío.

## Respuesta de detalle

Además de los campos existentes, el backend devuelve:

```json
{
  "estado": "BORRADOR",
  "puedeModificarse": true,
  "puedeEmitir": true,
  "motivoNoEmitible": null,
  "puedeFirmar": false,
  "puedeRechazar": false,
  "puedeEliminar": true
}
```

La búsqueda devuelve `puedeEmitir` por fila.

## Reglas de visibilidad

- `BORRADOR` solo lo ve el Director del proyecto.
- La búsqueda incluye `BORRADOR` por defecto; el backend lo oculta a las partes.
- Las partes no ven el borrador en detalle, búsqueda ni historial.
- Al emitir, el contrato pasa a `PENDIENTE_FIRMA` y se notifica a las partes.

## Cambios de compatibilidad

- `POST /contratos` ya **no** emite: crea `BORRADOR`.
- La respuesta de creación ahora es `ContratoDetalleResponse`.
- `PUT /contratos/{id}` guarda directamente; no requiere previsualización.
- El payload anterior sigue funcionando: los campos nuevos son opcionales.
- Códigos nuevos relevantes:
  - `CONTRATO_NO_EDITABLE`
  - `CONTRATO_NO_BORRADOR`
  - `CONTRATO_SIN_DESTINATARIOS`
  - `CONTRATO_TEXTO_INVALIDO`
- Código reemplazado:
  - Antes: `CONTRATO_NO_PENDIENTE_FIRMA` al modificar estados no editables.
  - Ahora: `CONTRATO_NO_EDITABLE`.

## Implementación frontend

- `contratoService.crearBorrador`, `emitir` y `modificar`.
- `GenerarContratoView`: nombre, descripción, modo de texto, guardar borrador y emitir.
- `ModificarContratoView`: guardado directo, sin exigir previsualización.
- `DetalleContratoView`: aviso de borrador, botón y modal de emisión.
- `TablaContratos`: acción **Emitir** cuando `puedeEmitir`.
- `contratoConstants`: estados por defecto con `BORRADOR`, motivos de emisión y
  normalización de los nuevos flags.

## Despliegue

- Desplegar backend y frontend juntos: el `POST /contratos` cambió de semántica
  y un frontend anterior esperaría `PENDIENTE_FIRMA` en la creación.
- No requiere migración de base de datos ni cambios de triggers.
- Las ramas `feat/contratos-borrador` de ambos repositorios forman el par
  compatible de esta iteración.

## Verificación

- Backend: tests de contratos y suite de integración.
- Frontend: `npm run build` y `npm test` sin errores.
