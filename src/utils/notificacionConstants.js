/*
 * Reglas de presentación y navegación de notificaciones
 * (docs/backend/ficha-tecnica-notificaciones-modal.md).
 *
 * El backend envía `titulo` y los IDs explícitos (`idProyecto`, `idActividad`,
 * `idHito`, `idInvitacion`). El frontend no infiere el proyecto desde
 * `entidadId`: la única regla de destino vive en `destinoNotificacion`.
 */

export const TIPOS_NOTIFICACION = {
  POSTULACION_RECIBIDA: "POSTULACION_RECIBIDA",
  POSTULACION_ACEPTADA: "POSTULACION_ACEPTADA",
  POSTULACION_RECHAZADA: "POSTULACION_RECHAZADA",
  PROYECTO_CANCELADO: "PROYECTO_CANCELADO",
  PROYECTO_CONFIRMADO: "PROYECTO_CONFIRMADO",
  ACTIVIDAD_MODIFICADA: "ACTIVIDAD_MODIFICADA",
  ACTIVIDAD_ELIMINADA: "ACTIVIDAD_ELIMINADA",
  AJUSTE_HORARIO: "AJUSTE_HORARIO",
  SOBRECOMPROMISO: "SOBRECOMPROMISO",
  INVITACION_RECHAZADA: "INVITACION_RECHAZADA",
  HITO_CUMPLIDO: "HITO_CUMPLIDO",
  ACTIVIDAD_ASIGNADA: "ACTIVIDAD_ASIGNADA",
  PERFIL_REPORTADO: "PERFIL_REPORTADO",
};

export const RUTAS_NOTIFICACION = {
  POSTULACIONES: "postulaciones-proyecto",
  PROYECTO: "dashboard-proyecto",
  ACTIVIDAD: "actividad-proyecto",
  ADMIN_REPORTE_PERFIL: "admin-reporte-perfil",
};

const ETIQUETAS_TIPO = {
  [TIPOS_NOTIFICACION.POSTULACION_RECIBIDA]: "Postulación recibida",
  [TIPOS_NOTIFICACION.POSTULACION_ACEPTADA]: "Postulación aceptada",
  [TIPOS_NOTIFICACION.POSTULACION_RECHAZADA]: "Postulación rechazada",
  [TIPOS_NOTIFICACION.PROYECTO_CANCELADO]: "Proyecto cancelado",
  [TIPOS_NOTIFICACION.PROYECTO_CONFIRMADO]: "Proyecto confirmado",
  [TIPOS_NOTIFICACION.ACTIVIDAD_MODIFICADA]: "Actividad modificada",
  [TIPOS_NOTIFICACION.ACTIVIDAD_ELIMINADA]: "Actividad eliminada",
  [TIPOS_NOTIFICACION.AJUSTE_HORARIO]: "Ajuste de horario",
  [TIPOS_NOTIFICACION.SOBRECOMPROMISO]: "Sobrecarga de agenda",
  [TIPOS_NOTIFICACION.INVITACION_RECHAZADA]: "Invitación rechazada",
  [TIPOS_NOTIFICACION.HITO_CUMPLIDO]: "Hito cumplido",
  [TIPOS_NOTIFICACION.ACTIVIDAD_ASIGNADA]: "Actividad asignada",
  [TIPOS_NOTIFICACION.PERFIL_REPORTADO]: "Perfil reportado",
};

const ICONOS_TIPO = {
  [TIPOS_NOTIFICACION.POSTULACION_RECIBIDA]: "person_add",
  [TIPOS_NOTIFICACION.POSTULACION_ACEPTADA]: "how_to_reg",
  [TIPOS_NOTIFICACION.POSTULACION_RECHAZADA]: "person_remove",
  [TIPOS_NOTIFICACION.PROYECTO_CANCELADO]: "cancel",
  [TIPOS_NOTIFICACION.PROYECTO_CONFIRMADO]: "event_available",
  [TIPOS_NOTIFICACION.ACTIVIDAD_MODIFICADA]: "edit_calendar",
  [TIPOS_NOTIFICACION.ACTIVIDAD_ELIMINADA]: "event_busy",
  [TIPOS_NOTIFICACION.AJUSTE_HORARIO]: "schedule",
  [TIPOS_NOTIFICACION.SOBRECOMPROMISO]: "warning",
  [TIPOS_NOTIFICACION.INVITACION_RECHAZADA]: "mail_off",
  [TIPOS_NOTIFICACION.HITO_CUMPLIDO]: "flag",
  [TIPOS_NOTIFICACION.ACTIVIDAD_ASIGNADA]: "assignment",
  [TIPOS_NOTIFICACION.PERFIL_REPORTADO]: "flag",
};

/**
 * Etiqueta legible derivada del tipo. Si el tipo no está mapeado, se muestra
 * el valor crudo sin guiones bajos (fallback de la ficha §2.3).
 * @param {string|null|undefined} tipo
 * @returns {string}
 */
export function etiquetaTipoNotificacion(tipo) {
  if (!tipo) return "";
  return ETIQUETAS_TIPO[tipo] || String(tipo).replaceAll("_", " ");
}

/**
 * Icono Material Symbols asociado al tipo.
 * @param {string|null|undefined} tipo
 * @returns {string}
 */
export function iconoNotificacion(tipo) {
  return ICONOS_TIPO[tipo] || "notifications";
}

/**
 * Normaliza un id. La ficha §7 indica tratar valores inválidos como ausentes.
 * @param {unknown} valor
 * @returns {number|null}
 */
function idValido(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

/**
 * @typedef {Object} DestinoNotificacion
 * @property {string} etiqueta texto del link
 * @property {{name: string, params?: object}} ruta ubicación de Vue Router
 */

/**
 * Decide si una notificación debe mostrar una label clickeable y a dónde
 * lleva. Ver §5 de la ficha.
 *
 * Reglas destacadas:
 * - `POSTULACION_RECIBIDA` → gestión de postulaciones.
 * - `ACTIVIDAD_MODIFICADA`, `AJUSTE_HORARIO`, `SOBRECOMPROMISO` → actividad.
 * - `ACTIVIDAD_ELIMINADA` → sólo el proyecto (la actividad ya no existe).
 * - `POSTULACION_RECHAZADA` e `INVITACION_RECHAZADA` → sin link.
 * - `HITO_CUMPLIDO` → proyecto (no hay pantalla de hitos).
 * - Sin `idPerfilContexto` no se muestra link (ficha §4), salvo reportes
 *   administrativos, que no dependen de un perfil activo.
 * @param {object|null|undefined} notificacion NotificacionResponse
 * @returns {DestinoNotificacion|null}
 */
export function destinoNotificacion(notificacion) {
  if (!notificacion) return null;

  const tipo = notificacion.tipo;
  const esReporteAdmin = tipo === TIPOS_NOTIFICACION.PERFIL_REPORTADO;
  if (!esReporteAdmin && notificacion.idPerfilContexto == null) return null;

  switch (tipo) {
    case TIPOS_NOTIFICACION.POSTULACION_RECIBIDA: {
      const id = idValido(notificacion.idProyecto);
      return id == null
        ? null
        : {
            etiqueta: "Ver postulaciones",
            ruta: { name: RUTAS_NOTIFICACION.POSTULACIONES, params: { id } },
          };
    }

    case TIPOS_NOTIFICACION.PROYECTO_CANCELADO: {
      // Compatibilidad con notificaciones históricas: para entidad PROYECTO,
      // `entidadId` es el id del proyecto. Las nuevas traen `idProyecto`.
      const id =
        idValido(notificacion.idProyecto) ?? idValido(notificacion.entidadId);
      return id == null
        ? null
        : {
            etiqueta: "Ver proyecto",
            ruta: { name: RUTAS_NOTIFICACION.PROYECTO, params: { id } },
          };
    }

    case TIPOS_NOTIFICACION.PROYECTO_CONFIRMADO:
    case TIPOS_NOTIFICACION.POSTULACION_ACEPTADA:
    case TIPOS_NOTIFICACION.ACTIVIDAD_ELIMINADA:
    case TIPOS_NOTIFICACION.HITO_CUMPLIDO: {
      const id = idValido(notificacion.idProyecto);
      return id == null
        ? null
        : {
            etiqueta: "Ver proyecto",
            ruta: { name: RUTAS_NOTIFICACION.PROYECTO, params: { id } },
          };
    }

    case TIPOS_NOTIFICACION.ACTIVIDAD_MODIFICADA:
    case TIPOS_NOTIFICACION.AJUSTE_HORARIO:
    case TIPOS_NOTIFICACION.SOBRECOMPROMISO: {
      const idProyecto = idValido(notificacion.idProyecto);
      const idActividad = idValido(notificacion.idActividad);
      if (idProyecto == null || idActividad == null) return null;
      return {
        etiqueta: "Ver actividad",
        ruta: {
          name: RUTAS_NOTIFICACION.ACTIVIDAD,
          params: { id: idProyecto, idActividad },
        },
      };
    }

    case TIPOS_NOTIFICACION.PERFIL_REPORTADO: {
      if (notificacion.entidadTipo !== "REPORTE_PERFIL") return null;
      const id = idValido(notificacion.entidadId);
      return id == null
        ? null
        : {
            etiqueta: "Ver reporte",
            ruta: {
              name: RUTAS_NOTIFICACION.ADMIN_REPORTE_PERFIL,
              params: { id },
            },
          };
    }

    // POSTULACION_RECHAZADA, INVITACION_RECHAZADA y el resto: sin link.
    default:
      return null;
  }
}
