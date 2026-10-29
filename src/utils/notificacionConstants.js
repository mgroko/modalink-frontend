/*
 * Reglas de navegación de notificaciones
 * (docs/backend/ficha-tecnica-notificaciones-navegacion.md).
 *
 * El sistema deriva `idProyecto` a partir de `entidadTipo + entidadId` y puede
 * enviarlo `null`. El frontend no infiere el proyecto desde `entidadId`: la
 * única regla de destino vive en `destinoNotificacion`.
 */

export const TIPOS_NOTIFICACION = {
  POSTULACION_RECIBIDA: "POSTULACION_RECIBIDA",
  POSTULACION_ACEPTADA: "POSTULACION_ACEPTADA",
  POSTULACION_RECHAZADA: "POSTULACION_RECHAZADA",
  PROYECTO_CANCELADO: "PROYECTO_CANCELADO",
  PROYECTO_CONFIRMADO: "PROYECTO_CONFIRMADO",
};

export const RUTAS_NOTIFICACION = {
  POSTULACIONES: "postulaciones-proyecto",
  PROYECTO: "dashboard-proyecto",
};

/**
 * Normaliza un id de proyecto. La ficha §7 indica tratar `0` o valores
 * inválidos como ausentes.
 * @param {unknown} valor
 * @returns {number|null}
 */
function idProyectoValido(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

/**
 * @typedef {Object} DestinoNotificacion
 * @property {string} etiqueta texto del link
 * @property {{name: string, params: {id: number}}} ruta ubicación de Vue Router
 */

/**
 * Decide si una notificación debe mostrar una label clickeable y a dónde
 * lleva. Ver §5 de la ficha.
 *
 * - `POSTULACION_RECIBIDA` → gestión de postulaciones, sólo con `idProyecto`.
 * - `PROYECTO_CANCELADO` → detalle del proyecto (`idProyecto ?? entidadId`).
 * - `PROYECTO_CONFIRMADO` → detalle del proyecto, sólo con `idProyecto`
 *   (UC-60: el sistema lo deriva de `entidadTipo = "PROYECTO"`).
 * - `POSTULACION_ACEPTADA` → detalle del proyecto.
 * - `POSTULACION_RECHAZADA`, `ACTIVIDAD_*`, `INVITACION_*`, `HITO_*` y el
 *   resto no tienen destino permitido.
 * @param {object|null|undefined} notificacion NotificacionResponse
 * @returns {DestinoNotificacion|null}
 */
export function destinoNotificacion(notificacion) {
  if (!notificacion) return null;

  switch (notificacion.tipo) {
    case TIPOS_NOTIFICACION.POSTULACION_RECIBIDA: {
      const id = idProyectoValido(notificacion.idProyecto);
      return id == null
        ? null
        : {
            etiqueta: "Ver postulaciones",
            ruta: { name: RUTAS_NOTIFICACION.POSTULACIONES, params: { id } },
          };
    }

    case TIPOS_NOTIFICACION.PROYECTO_CANCELADO: {
      const id =
        idProyectoValido(notificacion.idProyecto) ??
        idProyectoValido(notificacion.entidadId);
      return id == null
        ? null
        : {
            etiqueta: "Ver proyecto",
            ruta: { name: RUTAS_NOTIFICACION.PROYECTO, params: { id } },
          };
    }

    case TIPOS_NOTIFICACION.PROYECTO_CONFIRMADO: {
      const id = idProyectoValido(notificacion.idProyecto);
      return id == null
        ? null
        : {
            etiqueta: "Ver proyecto",
            ruta: { name: RUTAS_NOTIFICACION.PROYECTO, params: { id } },
          };
    }

    case TIPOS_NOTIFICACION.POSTULACION_ACEPTADA: {
      const id = idProyectoValido(notificacion.idProyecto);
      return id == null
        ? null
        : {
            etiqueta: "Ver proyecto",
            ruta: { name: RUTAS_NOTIFICACION.PROYECTO, params: { id } },
          };
    }

    default:
      return null;
  }
}
