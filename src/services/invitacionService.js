import http from "./http";
import { serializarParams } from "../utils/queryParams.js";

/*
 * Contrato de UC-30/UC-31: buscar e invitar.
 *
 * El backend resuelve remitente, estado inicial y fecha de envío desde la
 * sesión. El body sólo lleva destinatario, requerimiento (si aplica) y mensaje.
 */

/**
 * @typedef {Object} PerfilInvitacionResponse
 * @property {number} idPerfil
 * @property {string} nombreArtistico
 * @property {string|null} nombre
 * @property {string|null} apellido
 * @property {number|null} idProfesion
 * @property {string|null} nombreProfesion
 */

/**
 * @typedef {Object} InvitacionBusquedaResponse
 * @property {number} idInvitacion
 * @property {"GENERAL"|"ACTIVIDAD"} tipo
 * @property {"RECIBIDA"|"ENVIADA"} direccion
 * @property {"PENDIENTE"|"ACEPTADA"|"RECHAZADA"} estado
 * @property {string} fechaEnvio ISO-8601 local
 * @property {number} idProyecto
 * @property {string} nombreProyecto
 * @property {number|null} idRequerimientoGral
 * @property {number|null} idRequerimientoActividad
 * @property {number|null} idActividad
 * @property {string|null} nombreActividad
 * @property {PerfilInvitacionResponse} remitente
 * @property {PerfilInvitacionResponse} destinatario
 * @property {string|null} mensaje
 * @property {boolean} puedeEliminar
 */

/**
 * @typedef {Object} BuscarInvitacionesParams
 * @property {number|string} [idProyecto]
 * @property {string} [nombreProyecto]
 * @property {string} [fechaDesde] YYYY-MM-DD
 * @property {string} [fechaHasta] YYYY-MM-DD
 * @property {string} [nombrePerfil]
 * @property {"RECIBIDA"|"ENVIADA"} [direccion]
 * @property {"PENDIENTE"|"ACEPTADA"|"RECHAZADA"} [estado]
 * @property {"GENERAL"|"ACTIVIDAD"} [tipo]
 * @property {number} [page] base 0
 * @property {number} [size] default 20
 * @property {boolean} [todos]
 */

/**
 * @typedef {Object} InvitacionResponse
 * @property {number} idInvitacion
 * @property {"GENERAL"|"ACTIVIDAD"} tipo
 * @property {"PENDIENTE"|"ACEPTADA"|"RECHAZADA"} estado
 * @property {string} fechaEnvio ISO-8601 local
 * @property {number} idProyecto
 * @property {number|null} idRequerimientoGral
 * @property {number|null} idRequerimientoActividad
 * @property {number} idPerfilRemitente
 * @property {number} idPerfilDestinatario
 * @property {string|null} mensaje
 */

/**
 * @typedef {Object} InvitacionGeneralRequest
 * @property {number} idPerfilDestinatario
 * @property {string|null} [mensaje]
 */

/**
 * @typedef {Object} InvitacionActividadRequest
 * @property {number} idRequerimientoActividad
 * @property {number} idPerfilDestinatario
 * @property {string|null} [mensaje]
 */

/**
 * @typedef {Object} InvitacionGeneralBatchRequest
 * @property {number[]} idsPerfilDestinatario
 * @property {string|null} [mensaje]
 */

/**
 * @typedef {Object} InvitacionActividadBatchRequest
 * @property {number} idRequerimientoActividad
 * @property {number[]} idsPerfilDestinatario
 * @property {string|null} [mensaje]
 */

/**
 * @typedef {Object} InvitacionBatchError
 * @property {number} idPerfilDestinatario
 * @property {string} mensaje
 * @property {string} codigo
 */

/**
 * @typedef {Object} InvitacionBatchResponse
 * @property {InvitacionResponse[]} creadas
 * @property {InvitacionBatchError[]} errores
 */

/**
 * @typedef {Object} DisponibilidadInvitacion
 * @property {boolean} disponible
 * @property {boolean} provisional
 * @property {string|null} inicioEvaluado
 * @property {string|null} finEvaluado
 * @property {string|null} [codigoMotivo]
 * @property {string|null} [motivo]
 */

/**
 * @typedef {Object} AdvertenciaInvitacion
 * @property {number|null} idActividad
 * @property {string|null} nombreActividad
 * @property {number|null} idProyecto
 * @property {string|null} nombreProyecto
 * @property {string|null} inicioPotencial
 * @property {string|null} finPotencial
 */

/**
 * @typedef {Object} InvitacionGestionadaResponse
 * @property {number} idInvitacion
 * @property {"GENERAL"|"ACTIVIDAD"} tipo
 * @property {"ACEPTADA"|"RECHAZADA"} estado
 * @property {number} idProyecto
 * @property {number} idPerfil
 * @property {number|null} idMiembro
 * @property {number|null} idAsignacionActividad
 * @property {DisponibilidadInvitacion|null} disponibilidad
 * @property {AdvertenciaInvitacion[]} advertencias
 */

function normalizarMensaje(mensaje) {
  const texto = String(mensaje ?? "").trim();
  return texto || null;
}

const invitacionService = {
  /**
   * GET /invitaciones/buscar — UC-30.
   *
   * Devuelve sólo invitaciones donde el perfil activo es remitente o
   * destinatario. No requiere membresía ni visibilidad del proyecto.
   *
   * Errores:
   * - 400 rango de fechas inválido
   * - 401 sesión/cuenta no válida
   * - 404 perfil activo no seleccionado
   * @param {BuscarInvitacionesParams} [params]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: {
   *   contenido: InvitacionBusquedaResponse[],
   *   paginaActual: number,
   *   tamanoPagina: number,
   *   totalElementos: number,
   *   totalPaginas: number,
   *   primera: boolean,
   *   ultima: boolean
   * }>}>} 200 OK
   */
  buscar(params = {}, signal) {
    const todos = params.todos === true;
    const query = serializarParams({
      idProyecto: params.idProyecto ?? "",
      nombreProyecto: String(params.nombreProyecto || "").trim(),
      fechaDesde: params.fechaDesde || "",
      fechaHasta: params.fechaHasta || "",
      nombrePerfil: String(params.nombrePerfil || "").trim(),
      direccion: params.direccion || "",
      estado: params.estado || "",
      tipo: params.tipo || "",
      page: todos ? undefined : params.page ?? 0,
      size: todos ? undefined : params.size ?? 20,
      todos: todos ? true : undefined,
    });

    return http.get(`/invitaciones/buscar${query ? `?${query}` : ""}`, {
      signal,
    });
  },

  /**
   * POST /proyectos/{idProyecto}/invitaciones/general — UC-31.
   *
   * Errores esperables:
   * - 400 destinatario o mensaje inválido
   * - 403 sin perfil activo, sin membresía o sin `INVITAR_MIEMBRO`
   * - 404 proyecto o perfil destinatario inexistente
   * - 409 proyecto no Publicado/Confirmado, perfil inactivo, autoinvitación,
   *   perfil ya miembro o invitación pendiente duplicada
   *   (`codigo = INVITACION_DUPLICADA`)
   * @param {number|string} idProyecto
   * @param {InvitacionGeneralRequest} request
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: InvitacionResponse}>} 201 Created
   */
  invitarGeneral(idProyecto, { idPerfilDestinatario, mensaje } = {}, signal) {
    return http.post(
      `/proyectos/${idProyecto}/invitaciones/general`,
      {
        idPerfilDestinatario,
        mensaje: normalizarMensaje(mensaje),
      },
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/invitaciones/actividad — UC-31.
   *
   * Errores esperables: mismos que la invitación general, más actividad en
   * estado inválido, requerimiento inexistente o profesión incompatible.
   * @param {number|string} idProyecto
   * @param {InvitacionActividadRequest} request
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: InvitacionResponse}>} 201 Created
   */
  invitarActividad(
    idProyecto,
    { idRequerimientoActividad, idPerfilDestinatario, mensaje } = {},
    signal
  ) {
    return http.post(
      `/proyectos/${idProyecto}/invitaciones/actividad`,
      {
        idRequerimientoActividad,
        idPerfilDestinatario,
        mensaje: normalizarMensaje(mensaje),
      },
      { signal }
    );
  },

  /**
   * POST /invitaciones/general/{idInvitacion}/aceptar — UC-28.
   *
   * Sin body. El perfil activo debe ser el destinatario.
   * Errores:
   * - 403 la invitación no pertenece al perfil activo
   * - 404 invitación/perfil activo inexistente
   * - 409 ya gestionada, proyecto no habilitado, requerimiento satisfecho,
   *   profesión incompatible o perfil ya miembro
   * @param {number|string} idInvitacion
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: InvitacionGestionadaResponse}>} 200 OK
   */
  aceptarGeneral(idInvitacion, signal) {
    return http.post(
      `/invitaciones/general/${idInvitacion}/aceptar`,
      null,
      { signal }
    );
  },

  /**
   * POST /invitaciones/actividad/{idInvitacion}/aceptar — UC-28.
   *
   * Sin body. Además de la membresía, crea la asignación a la actividad y
   * revalida la disponibilidad. Los 409 pueden traer `codigo`/`codigoMotivo`
   * de disponibilidad.
   * @param {number|string} idInvitacion
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: InvitacionGestionadaResponse}>} 200 OK
   */
  aceptarActividad(idInvitacion, signal) {
    return http.post(
      `/invitaciones/actividad/${idInvitacion}/aceptar`,
      null,
      { signal }
    );
  },

  /**
   * POST /invitaciones/general/{idInvitacion}/rechazar — UC-28.
   *
   * Sin body. La invitación queda RECHAZADA; no se elimina.
   * @param {number|string} idInvitacion
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: InvitacionGestionadaResponse}>} 200 OK
   */
  rechazarGeneral(idInvitacion, signal) {
    return http.post(
      `/invitaciones/general/${idInvitacion}/rechazar`,
      null,
      { signal }
    );
  },

  /**
   * POST /invitaciones/actividad/{idInvitacion}/rechazar — UC-28.
   *
   * Sin body. La invitación queda RECHAZADA; no se elimina.
   * @param {number|string} idInvitacion
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: InvitacionGestionadaResponse}>} 200 OK
   */
  rechazarActividad(idInvitacion, signal) {
    return http.post(
      `/invitaciones/actividad/${idInvitacion}/rechazar`,
      null,
      { signal }
    );
  },

  /**
   * DELETE /proyectos/{idProyecto}/invitaciones/general/{idInvitacion} — UC-32.
   *
   * Borra físicamente una invitación general pendiente enviada por el perfil
   * activo. No genera notificación al destinatario.
   *
   * Errores:
   * - 403 sin `ELIMINAR_INVITACION`, no Director o no remitente
   * - 404 perfil activo, invitación inexistente o de otro proyecto
   * - 409 `INVITACION_NO_PENDIENTE`
   * @param {number|string} idProyecto
   * @param {number|string} idInvitacion
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: null}>} 204 No Content
   */
  eliminarGeneral(idProyecto, idInvitacion, signal) {
    return http.delete(
      `/proyectos/${idProyecto}/invitaciones/general/${idInvitacion}`,
      { signal }
    );
  },

  /**
   * DELETE /proyectos/{idProyecto}/invitaciones/actividad/{idInvitacion} — UC-32.
   * Mismas reglas que la eliminación general.
   * @param {number|string} idProyecto
   * @param {number|string} idInvitacion
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: null}>} 204 No Content
   */
  eliminarActividad(idProyecto, idInvitacion, signal) {
    return http.delete(
      `/proyectos/${idProyecto}/invitaciones/actividad/${idInvitacion}`,
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/invitaciones/general/batch — UC-31.
   *
   * Crea una invitación independiente por cada perfil. Responde 200 con
   * `creadas` y `errores`; un perfil con error no invalida los demás.
   * @param {number|string} idProyecto
   * @param {InvitacionGeneralBatchRequest} request
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: InvitacionBatchResponse}>} 200 OK
   */
  invitarGeneralBatch(
    idProyecto,
    { idsPerfilDestinatario, mensaje } = {},
    signal
  ) {
    return http.post(
      `/proyectos/${idProyecto}/invitaciones/general/batch`,
      {
        idsPerfilDestinatario: Array.isArray(idsPerfilDestinatario)
          ? idsPerfilDestinatario
          : [],
        mensaje: normalizarMensaje(mensaje),
      },
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/invitaciones/actividad/batch — UC-31.
   *
   * Mismas reglas que la invitación general múltiple, asociadas a un
   * requerimiento de actividad.
   * @param {number|string} idProyecto
   * @param {InvitacionActividadBatchRequest} request
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: InvitacionBatchResponse}>} 200 OK
   */
  invitarActividadBatch(
    idProyecto,
    { idRequerimientoActividad, idsPerfilDestinatario, mensaje } = {},
    signal
  ) {
    return http.post(
      `/proyectos/${idProyecto}/invitaciones/actividad/batch`,
      {
        idRequerimientoActividad,
        idsPerfilDestinatario: Array.isArray(idsPerfilDestinatario)
          ? idsPerfilDestinatario
          : [],
        mensaje: normalizarMensaje(mensaje),
      },
      { signal }
    );
  },
};

export default invitacionService;
