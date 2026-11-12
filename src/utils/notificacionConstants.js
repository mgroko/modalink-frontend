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
  SOLICITUD_CONEXION_RECIBIDA: "SOLICITUD_CONEXION_RECIBIDA",
  SOLICITUD_CONEXION_ACEPTADA: "SOLICITUD_CONEXION_ACEPTADA",
  SOLICITUD_CONEXION_RECHAZADA: "SOLICITUD_CONEXION_RECHAZADA",
  CONEXION_ELIMINADA: "CONEXION_ELIMINADA",
  MENSAJE_PRIVADO_RECIBIDO: "MENSAJE_PRIVADO_RECIBIDO",
  MENSAJE_GRUPAL_RECIBIDO: "MENSAJE_GRUPAL_RECIBIDO",
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
  ACTIVIDAD_DESASIGNADA: "ACTIVIDAD_DESASIGNADA",
  PERFIL_REPORTADO: "PERFIL_REPORTADO",
  PUBLICACION_REPORTADA: "PUBLICACION_REPORTADA",
  PUBLICACION_OCULTADA: "PUBLICACION_OCULTADA",
  PUBLICACION_REACTIVADA: "PUBLICACION_REACTIVADA",
  INTEGRANTE_ELIMINADO: "INTEGRANTE_ELIMINADO",
  INTEGRANTE_BAJA_VOLUNTARIA: "INTEGRANTE_BAJA_VOLUNTARIA",
  HABILIDAD_MODIFICADA: "HABILIDAD_MODIFICADA",
  HABILIDAD_ELIMINADA: "HABILIDAD_ELIMINADA",
  CALIFICACION_SOLICITADA: "CALIFICACION_SOLICITADA",
  REEMPLAZO_CANDIDATOS_DISPONIBLES: "REEMPLAZO_CANDIDATOS_DISPONIBLES",
  REEMPLAZO_SIN_CANDIDATOS: "REEMPLAZO_SIN_CANDIDATOS",
  REEMPLAZO_INVITACION_RECIBIDA: "REEMPLAZO_INVITACION_RECIBIDA",
  REEMPLAZO_CANDIDATO_RECHAZO: "REEMPLAZO_CANDIDATO_RECHAZO",
  REEMPLAZO_ACEPTADO_PENDIENTE_APROBACION:
    "REEMPLAZO_ACEPTADO_PENDIENTE_APROBACION",
  REEMPLAZO_INCORPORACION_APROBADA: "REEMPLAZO_INCORPORACION_APROBADA",
  REEMPLAZO_INCORPORACION_RECHAZADA: "REEMPLAZO_INCORPORACION_RECHAZADA",
  REEMPLAZO_CANCELADO: "REEMPLAZO_CANCELADO",
  CONTRATO_PENDIENTE_FIRMA: "CONTRATO_PENDIENTE_FIRMA",
  CONTRATO_MODIFICADO: "CONTRATO_MODIFICADO",
  CONTRATO_ACTIVO: "CONTRATO_ACTIVO",
  CONTRATO_RECHAZADO: "CONTRATO_RECHAZADO",
  CONTRATO_ELIMINADO: "CONTRATO_ELIMINADO",
  SOLICITUD_COLABORACION_RECIBIDA: "SOLICITUD_COLABORACION_RECIBIDA",
  SOLICITUD_COLABORACION_ACEPTADA: "SOLICITUD_COLABORACION_ACEPTADA",
  SOLICITUD_COLABORACION_RECHAZADA: "SOLICITUD_COLABORACION_RECHAZADA",
  PUBLICACION_MEGUSTA: "PUBLICACION_MEGUSTA",
  PUBLICACION_COMENTARIO: "PUBLICACION_COMENTARIO",
};

export const RUTAS_NOTIFICACION = {
  POSTULACIONES: "postulaciones-proyecto",
  PROYECTO: "dashboard-proyecto",
  ACTIVIDAD: "actividad-proyecto",
  ADMIN_REPORTE_PERFIL: "admin-reporte-perfil",
  ADMIN_REPORTE_PUBLICACION: "admin-reporte-publicacion",
  CALIFICACIONES: "calificaciones-proyecto",
  INVITACIONES: "solicitudes",
  PUBLICACION: "publicacion-detalle",
  CONTRATO: "detalle-contrato",
  MI_RED: "mi-red",
  MENSAJES: "mensajes",
};

const ETIQUETAS_TIPO = {
  [TIPOS_NOTIFICACION.POSTULACION_RECIBIDA]: "Postulación recibida",
  [TIPOS_NOTIFICACION.SOLICITUD_CONEXION_RECIBIDA]:
    "Solicitud de conexión recibida",
  [TIPOS_NOTIFICACION.SOLICITUD_CONEXION_ACEPTADA]:
    "Solicitud de conexión aceptada",
  [TIPOS_NOTIFICACION.SOLICITUD_CONEXION_RECHAZADA]:
    "Solicitud de conexión rechazada",
  [TIPOS_NOTIFICACION.CONEXION_ELIMINADA]: "Conexión eliminada",
  [TIPOS_NOTIFICACION.MENSAJE_PRIVADO_RECIBIDO]:
    "Mensaje privado recibido",
  [TIPOS_NOTIFICACION.MENSAJE_GRUPAL_RECIBIDO]:
    "Mensaje en el chat del proyecto",
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
  [TIPOS_NOTIFICACION.ACTIVIDAD_DESASIGNADA]: "Actividad desasignada",
  [TIPOS_NOTIFICACION.PERFIL_REPORTADO]: "Perfil reportado",
  [TIPOS_NOTIFICACION.PUBLICACION_REPORTADA]: "Publicación reportada",
  [TIPOS_NOTIFICACION.PUBLICACION_OCULTADA]: "Publicación ocultada",
  [TIPOS_NOTIFICACION.PUBLICACION_REACTIVADA]: "Publicación reactivada",
  [TIPOS_NOTIFICACION.INTEGRANTE_ELIMINADO]: "Integrante eliminado",
  [TIPOS_NOTIFICACION.INTEGRANTE_BAJA_VOLUNTARIA]: "Baja voluntaria de integrante",
  [TIPOS_NOTIFICACION.HABILIDAD_MODIFICADA]: "Habilidad modificada",
  [TIPOS_NOTIFICACION.HABILIDAD_ELIMINADA]: "Habilidad eliminada",
  [TIPOS_NOTIFICACION.CALIFICACION_SOLICITADA]: "Calificación solicitada",
  [TIPOS_NOTIFICACION.REEMPLAZO_CANDIDATOS_DISPONIBLES]:
    "Candidatos de reemplazo",
  [TIPOS_NOTIFICACION.REEMPLAZO_SIN_CANDIDATOS]: "Reemplazo sin candidatos",
  [TIPOS_NOTIFICACION.REEMPLAZO_INVITACION_RECIBIDA]:
    "Invitación de reemplazo",
  [TIPOS_NOTIFICACION.REEMPLAZO_CANDIDATO_RECHAZO]:
    "Candidato rechazó la invitación",
  [TIPOS_NOTIFICACION.REEMPLAZO_ACEPTADO_PENDIENTE_APROBACION]:
    "Incorporación pendiente de aprobación",
  [TIPOS_NOTIFICACION.REEMPLAZO_INCORPORACION_APROBADA]:
    "Incorporación aprobada",
  [TIPOS_NOTIFICACION.REEMPLAZO_INCORPORACION_RECHAZADA]:
    "Incorporación rechazada",
  [TIPOS_NOTIFICACION.REEMPLAZO_CANCELADO]: "Reemplazo cancelado",
  [TIPOS_NOTIFICACION.CONTRATO_PENDIENTE_FIRMA]:
    "Contrato pendiente de firma",
  [TIPOS_NOTIFICACION.CONTRATO_MODIFICADO]: "Contrato modificado",
  [TIPOS_NOTIFICACION.CONTRATO_ACTIVO]: "Contrato activo",
  [TIPOS_NOTIFICACION.CONTRATO_RECHAZADO]: "Contrato rechazado",
  [TIPOS_NOTIFICACION.CONTRATO_ELIMINADO]: "Contrato eliminado",
  [TIPOS_NOTIFICACION.SOLICITUD_COLABORACION_RECIBIDA]:
    "Solicitud de colaboración recibida",
  [TIPOS_NOTIFICACION.SOLICITUD_COLABORACION_ACEPTADA]:
    "Solicitud de colaboración aceptada",
  [TIPOS_NOTIFICACION.SOLICITUD_COLABORACION_RECHAZADA]:
    "Solicitud de colaboración rechazada",
  [TIPOS_NOTIFICACION.PUBLICACION_MEGUSTA]:
    "Nueva interacción en publicación",
  [TIPOS_NOTIFICACION.PUBLICACION_COMENTARIO]:
    "Nuevo comentario en publicación",
};

const ICONOS_TIPO = {
  [TIPOS_NOTIFICACION.POSTULACION_RECIBIDA]: "person_add",
  [TIPOS_NOTIFICACION.SOLICITUD_CONEXION_RECIBIDA]: "person_add",
  [TIPOS_NOTIFICACION.SOLICITUD_CONEXION_ACEPTADA]: "how_to_reg",
  [TIPOS_NOTIFICACION.SOLICITUD_CONEXION_RECHAZADA]: "person_remove",
  [TIPOS_NOTIFICACION.CONEXION_ELIMINADA]: "link_off",
  [TIPOS_NOTIFICACION.MENSAJE_PRIVADO_RECIBIDO]: "chat",
  [TIPOS_NOTIFICACION.MENSAJE_GRUPAL_RECIBIDO]: "chat",
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
  [TIPOS_NOTIFICACION.ACTIVIDAD_DESASIGNADA]: "person_remove",
  [TIPOS_NOTIFICACION.PERFIL_REPORTADO]: "flag",
  [TIPOS_NOTIFICACION.PUBLICACION_REPORTADA]: "campaign",
  [TIPOS_NOTIFICACION.PUBLICACION_OCULTADA]: "visibility_off",
  [TIPOS_NOTIFICACION.PUBLICACION_REACTIVADA]: "visibility",
  [TIPOS_NOTIFICACION.INTEGRANTE_ELIMINADO]: "person_remove",
  [TIPOS_NOTIFICACION.INTEGRANTE_BAJA_VOLUNTARIA]: "person_remove",
  [TIPOS_NOTIFICACION.HABILIDAD_MODIFICADA]: "edit",
  [TIPOS_NOTIFICACION.HABILIDAD_ELIMINADA]: "delete",
  [TIPOS_NOTIFICACION.CALIFICACION_SOLICITADA]: "reviews",
  [TIPOS_NOTIFICACION.REEMPLAZO_CANDIDATOS_DISPONIBLES]: "person_search",
  [TIPOS_NOTIFICACION.REEMPLAZO_SIN_CANDIDATOS]: "person_off",
  [TIPOS_NOTIFICACION.REEMPLAZO_INVITACION_RECIBIDA]: "mail",
  [TIPOS_NOTIFICACION.REEMPLAZO_CANDIDATO_RECHAZO]: "person_remove",
  [TIPOS_NOTIFICACION.REEMPLAZO_ACEPTADO_PENDIENTE_APROBACION]:
    "how_to_reg",
  [TIPOS_NOTIFICACION.REEMPLAZO_INCORPORACION_APROBADA]: "check_circle",
  [TIPOS_NOTIFICACION.REEMPLAZO_INCORPORACION_RECHAZADA]: "cancel",
  [TIPOS_NOTIFICACION.REEMPLAZO_CANCELADO]: "cancel",
  [TIPOS_NOTIFICACION.CONTRATO_PENDIENTE_FIRMA]: "draw",
  [TIPOS_NOTIFICACION.CONTRATO_MODIFICADO]: "edit_note",
  [TIPOS_NOTIFICACION.CONTRATO_ACTIVO]: "verified",
  [TIPOS_NOTIFICACION.CONTRATO_RECHAZADO]: "cancel",
  [TIPOS_NOTIFICACION.CONTRATO_ELIMINADO]: "delete",
  [TIPOS_NOTIFICACION.SOLICITUD_COLABORACION_RECIBIDA]: "person_add",
  [TIPOS_NOTIFICACION.SOLICITUD_COLABORACION_ACEPTADA]: "check_circle",
  [TIPOS_NOTIFICACION.SOLICITUD_COLABORACION_RECHAZADA]: "cancel",
  [TIPOS_NOTIFICACION.PUBLICACION_MEGUSTA]: "favorite",
  [TIPOS_NOTIFICACION.PUBLICACION_COMENTARIO]: "chat_bubble",
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
 * Tipos que nunca deben ofrecer navegación, incluso si el backend envía
 * `destino` (ficha UC-38 §5: el perfil eliminado puede recibir 403; ficha
 * UC-40 §11: la baja voluntaria no debe navegar a un proyecto privado;
 * UC-56: no hay detalle de habilidad para el perfil afectado).
 * @param {string|null|undefined} tipo
 * @returns {boolean}
 */
export function esNotificacionSinNavegacion(tipo) {
  return [
    TIPOS_NOTIFICACION.INTEGRANTE_ELIMINADO,
    TIPOS_NOTIFICACION.INTEGRANTE_BAJA_VOLUNTARIA,
    TIPOS_NOTIFICACION.HABILIDAD_MODIFICADA,
    TIPOS_NOTIFICACION.HABILIDAD_ELIMINADA,
    TIPOS_NOTIFICACION.PUBLICACION_OCULTADA,
  ].includes(tipo);
}

/**
 * Decide si una notificación debe mostrar una label clickeable y a dónde
 * lleva. Ver §5 de la ficha.
 *
 * Reglas destacadas:
 * - `POSTULACION_RECIBIDA` → gestión de postulaciones.
 * - `ACTIVIDAD_MODIFICADA`, `AJUSTE_HORARIO`, `SOBRECOMPROMISO` → actividad.
 * - `ACTIVIDAD_ASIGNADA` → actividad (usa `entidadId` si falta `idActividad`).
 * - `ACTIVIDAD_ELIMINADA` → sólo el proyecto (la actividad ya no existe).
 * - `POSTULACION_RECHAZADA` e `INVITACION_RECHAZADA` → sin link.
 * - `HITO_CUMPLIDO` → proyecto (no hay pantalla de hitos).
 * - `INTEGRANTE_ELIMINADO` e `INTEGRANTE_BAJA_VOLUNTARIA` → sin link (el
 *   perfil puede no tener acceso o el proyecto puede ser privado).
 * - `HABILIDAD_MODIFICADA` y `HABILIDAD_ELIMINADA` → sin link (no hay una
 *   pantalla de detalle de habilidad para el perfil afectado).
 * - Sin `idPerfilContexto` no se muestra link (ficha §4), salvo reportes
 *   administrativos, que no dependen de un perfil activo.
 * @param {object|null|undefined} notificacion NotificacionResponse
 * @returns {DestinoNotificacion|null}
 */
export function destinoNotificacion(notificacion) {
  if (!notificacion) return null;
  if (esNotificacionSinNavegacion(notificacion.tipo)) return null;

  const tipo = notificacion.tipo;
  const esReporteAdmin =
    tipo === TIPOS_NOTIFICACION.PERFIL_REPORTADO ||
    tipo === TIPOS_NOTIFICACION.PUBLICACION_REPORTADA;
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

    case TIPOS_NOTIFICACION.SOLICITUD_CONEXION_RECIBIDA: {
      return {
        etiqueta: "Ver solicitudes",
        ruta: {
          name: RUTAS_NOTIFICACION.MI_RED,
          query: { tab: "recibidas" },
        },
      };
    }

    case TIPOS_NOTIFICACION.SOLICITUD_CONEXION_ACEPTADA: {
      const idConexion =
        idValido(notificacion.idConexion) ??
        (notificacion.entidadTipo === "CONEXION"
          ? idValido(notificacion.entidadId)
          : null);

      return {
        etiqueta: "Ver conexión",
        ruta: {
          name: RUTAS_NOTIFICACION.MI_RED,
          query: {
            tab: "conexiones",
            ...(idConexion != null ? { idConexion } : {}),
          },
        },
      };
    }

    case TIPOS_NOTIFICACION.SOLICITUD_CONEXION_RECHAZADA: {
      return {
        etiqueta: "Ver solicitudes",
        ruta: {
          name: RUTAS_NOTIFICACION.MI_RED,
          query: {
            tab: "enviadas",
            estado: "RECHAZADA",
          },
        },
      };
    }

    case TIPOS_NOTIFICACION.SOLICITUD_COLABORACION_RECIBIDA:
    case TIPOS_NOTIFICACION.SOLICITUD_COLABORACION_ACEPTADA:
    case TIPOS_NOTIFICACION.SOLICITUD_COLABORACION_RECHAZADA: {
      const id =
        idValido(notificacion.idPublicacion) ??
        (notificacion.entidadTipo === "PUBLICACION"
          ? idValido(notificacion.entidadId)
          : null);

      return id == null
        ? null
        : {
            etiqueta: "Ver publicación",
            ruta: {
              name: RUTAS_NOTIFICACION.PUBLICACION,
              params: { idPublicacion: id },
            },
          };
    }

    case TIPOS_NOTIFICACION.PUBLICACION_REACTIVADA: {
      const id =
        (notificacion.entidadTipo === "PUBLICACION"
          ? idValido(notificacion.entidadId)
          : null) ?? idValido(notificacion.idPublicacion);

      return id == null
        ? null
        : {
            etiqueta: "Ver publicación",
            ruta: {
              name: RUTAS_NOTIFICACION.PUBLICACION,
              params: { idPublicacion: id },
            },
          };
    }

    case TIPOS_NOTIFICACION.PUBLICACION_MEGUSTA:
    case TIPOS_NOTIFICACION.PUBLICACION_COMENTARIO: {
      // El backend de UC-66 envía entidadTipo=PUBLICACION y entidadId.
      // No usa idProyecto para estos tipos.
      const id =
        (notificacion.entidadTipo === "PUBLICACION"
          ? idValido(notificacion.entidadId)
          : null) ?? idValido(notificacion.idPublicacion);

      return id == null
        ? null
        : {
            etiqueta: "Ver publicación",
            ruta: {
              name: RUTAS_NOTIFICACION.PUBLICACION,
              params: { idPublicacion: id },
              ...(tipo === TIPOS_NOTIFICACION.PUBLICACION_COMENTARIO
                ? { hash: "#comentarios" }
                : {}),
            },
          };
    }

    case TIPOS_NOTIFICACION.CONEXION_ELIMINADA: {
      return {
        etiqueta: "Ver conexiones",
        ruta: {
          name: RUTAS_NOTIFICACION.MI_RED,
          query: { tab: "conexiones" },
        },
      };
    }

    case TIPOS_NOTIFICACION.MENSAJE_PRIVADO_RECIBIDO: {
      // El backend usa entidad_tipo = CONVERSACION y entidad_id = idConversacion.
      const id = idValido(
        notificacion.entidadTipo === "CONVERSACION"
          ? notificacion.entidadId
          : null
      );
      return id == null
        ? null
        : {
            etiqueta: "Ir al chat",
            ruta: {
              name: RUTAS_NOTIFICACION.MENSAJES,
              query: { conversacion: id },
            },
          };
    }

    case TIPOS_NOTIFICACION.MENSAJE_GRUPAL_RECIBIDO: {
      // El backend usa entidad_tipo = PROYECTO y entidad_id = idProyecto.
      const id =
        idValido(notificacion.idProyecto) ??
        (notificacion.entidadTipo === "PROYECTO"
          ? idValido(notificacion.entidadId)
          : null);
      return id == null
        ? null
        : {
            etiqueta: "Ir al chat del proyecto",
            ruta: {
              name: RUTAS_NOTIFICACION.PROYECTO,
              params: { id },
              query: { tab: "chat" },
            },
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

    case TIPOS_NOTIFICACION.CALIFICACION_SOLICITADA: {
      // La ficha envía `link: "/proyectos/{id}/calificaciones"`, pero la
      // navegación se resuelve por tipo para mantener una única fuente de
      // rutas y evitar navegar a URLs arbitrarias del backend.
      const id = idValido(notificacion.idProyecto);
      return id == null
        ? null
        : {
            etiqueta: "Calificar equipo",
            ruta: { name: RUTAS_NOTIFICACION.CALIFICACIONES, params: { id } },
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

    case TIPOS_NOTIFICACION.ACTIVIDAD_ASIGNADA:
    case TIPOS_NOTIFICACION.ACTIVIDAD_DESASIGNADA: {
      // El trigger inserta `entidad_tipo = 'ACTIVIDAD'` y
      // `entidad_id = id_actividad`; `idActividad` puede venir por el mapper
      // de lectura o deducirse de la entidad. `idProyecto` no se infiere.
      const idProyecto = idValido(notificacion.idProyecto);
      const idActividad =
        idValido(notificacion.idActividad) ??
        (notificacion.entidadTipo === "ACTIVIDAD"
          ? idValido(notificacion.entidadId)
          : null);
      if (idProyecto == null || idActividad == null) return null;
      return {
        etiqueta: "Ver actividad",
        ruta: {
          name: RUTAS_NOTIFICACION.ACTIVIDAD,
          params: { id: idProyecto, idActividad },
        },
      };
    }

    case TIPOS_NOTIFICACION.REEMPLAZO_INVITACION_RECIBIDA:
    case TIPOS_NOTIFICACION.REEMPLAZO_INCORPORACION_RECHAZADA: {
      return {
        etiqueta: "Ver invitaciones",
        ruta: {
          name: RUTAS_NOTIFICACION.INVITACIONES,
          query: { seccion: "reemplazos" },
        },
      };
    }

    case TIPOS_NOTIFICACION.REEMPLAZO_CANCELADO: {
      // La cancelación por vacante cubierta se envía al candidato con
      // entidad REEMPLAZO_CANDIDATO; el director la recibe con entidad
      // REEMPLAZO y debe ir al panel del proyecto.
      if (notificacion.entidadTipo === "REEMPLAZO_CANDIDATO") {
        return {
          etiqueta: "Ver invitaciones",
          ruta: {
            name: RUTAS_NOTIFICACION.INVITACIONES,
            query: { seccion: "reemplazos" },
          },
        };
      }
      const id = idValido(notificacion.idProyecto);
      return id == null
        ? null
        : {
            etiqueta: "Ver reemplazos",
            ruta: {
              name: RUTAS_NOTIFICACION.PROYECTO,
              params: { id },
              query: { tab: "reemplazos" },
            },
          };
    }

    case TIPOS_NOTIFICACION.REEMPLAZO_CANDIDATOS_DISPONIBLES:
    case TIPOS_NOTIFICACION.REEMPLAZO_SIN_CANDIDATOS:
    case TIPOS_NOTIFICACION.REEMPLAZO_CANDIDATO_RECHAZO:
    case TIPOS_NOTIFICACION.REEMPLAZO_ACEPTADO_PENDIENTE_APROBACION: {
      const id = idValido(notificacion.idProyecto);
      return id == null
        ? null
        : {
            etiqueta: "Ver reemplazos",
            ruta: {
              name: RUTAS_NOTIFICACION.PROYECTO,
              params: { id },
              query: { tab: "reemplazos" },
            },
          };
    }

    case TIPOS_NOTIFICACION.REEMPLAZO_INCORPORACION_APROBADA: {
      const id = idValido(notificacion.idProyecto);
      return id == null
        ? null
        : {
            etiqueta: "Ver proyecto",
            ruta: {
              name: RUTAS_NOTIFICACION.PROYECTO,
              params: { id },
            },
          };
    }

    case TIPOS_NOTIFICACION.CONTRATO_PENDIENTE_FIRMA:
    case TIPOS_NOTIFICACION.CONTRATO_MODIFICADO:
    case TIPOS_NOTIFICACION.CONTRATO_ACTIVO:
    case TIPOS_NOTIFICACION.CONTRATO_RECHAZADO:
    case TIPOS_NOTIFICACION.CONTRATO_ELIMINADO: {
      // El trigger de contrato envía `entidad_tipo = 'CONTRATO'`,
      // `entidad_id = id_contrato` e `id_proyecto`.
      const idProyecto = idValido(notificacion.idProyecto);
      const idContrato =
        idValido(notificacion.idContrato) ??
        (notificacion.entidadTipo === "CONTRATO"
          ? idValido(notificacion.entidadId)
          : null);
      if (idProyecto == null || idContrato == null) return null;
      return {
        etiqueta: "Ver contrato",
        ruta: {
          name: RUTAS_NOTIFICACION.CONTRATO,
          params: { idProyecto, idContrato },
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

    case TIPOS_NOTIFICACION.PUBLICACION_REPORTADA: {
      if (notificacion.entidadTipo !== "REPORTE_PUBLICACION") return null;
      const id = idValido(notificacion.entidadId);
      return id == null
        ? null
        : {
            etiqueta: "Ver reporte",
            ruta: {
              name: RUTAS_NOTIFICACION.ADMIN_REPORTE_PUBLICACION,
              params: { id },
            },
          };
    }

    // POSTULACION_RECHAZADA, INVITACION_RECHAZADA y el resto: sin link.
    default:
      return null;
  }
}
