import http from "./http";

/*
 * Contrato de UC-31: invitar a proyecto.
 *
 * El backend resuelve remitente, estado inicial y fecha de envío desde la
 * sesión. El body sólo lleva destinatario, requerimiento (si aplica) y mensaje.
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

function normalizarMensaje(mensaje) {
  const texto = String(mensaje ?? "").trim();
  return texto || null;
}

const invitacionService = {
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
};

export default invitacionService;
