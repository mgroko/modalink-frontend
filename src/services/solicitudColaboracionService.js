import http from "./http";

/*
 * Contratos de solicitudes de colaboración:
 * - UC-61: envío desde una publicación propia.
 * - UC-62/63: aceptar y rechazar.
 * - UC-64: eliminación por el perfil remitente.
 * - UC-65: búsqueda y selector de publicaciones.
 */

/**
 * @typedef {Object} PerfilSolicitudColaboracion
 * @property {number} idPerfil
 * @property {string} nombreArtistico
 * @property {string} profesion
 * @property {string|null} [fotoUrl]
 */

/**
 * @typedef {Object} PublicacionSolicitudColaboracion
 * @property {number} idPublicacion
 * @property {string} titulo
 * @property {string|null} [portadaUrl]
 * @property {string} estado
 */

const solicitudColaboracionService = {
  /**
   * GET /solicitudes-colaboracion — UC-65.
   * Por defecto el backend devuelve las PENDIENTES.
   * @param {object} [params]
   * @param {AbortSignal} [signal]
   */
  listar(params = {}, signal) {
    return http.get("/solicitudes-colaboracion", { params, signal });
  },

  /**
   * GET /solicitudes-colaboracion/publicaciones
   * Publicaciones distintas con solicitudes en la dirección indicada.
   * @param {"RECIBIDA"|"ENVIADA"|null} [direccion]
   * @param {AbortSignal} [signal]
   */
  listarPublicaciones(direccion, signal) {
    return http.get("/solicitudes-colaboracion/publicaciones", {
      params: direccion ? { direccion } : {},
      signal,
    });
  },

  /**
   * POST /publicaciones/{idPublicacion}/solicitudes-colaboracion — UC-61.
   * @param {number|string} idPublicacion
   * @param {number|string} idPerfilDestinatario
   */
  crear(idPublicacion, idPerfilDestinatario) {
    return http.post(
      `/publicaciones/${idPublicacion}/solicitudes-colaboracion`,
      { idPerfilDestinatario }
    );
  },

  /**
   * POST /solicitudes-colaboracion/{id}/aceptar — UC-62.
   * @param {number|string} idSolicitudColaboracion
   */
  aceptar(idSolicitudColaboracion) {
    return http.post(
      `/solicitudes-colaboracion/${idSolicitudColaboracion}/aceptar`
    );
  },

  /**
   * POST /solicitudes-colaboracion/{id}/rechazar — UC-63.
   * @param {number|string} idSolicitudColaboracion
   */
  rechazar(idSolicitudColaboracion) {
    return http.post(
      `/solicitudes-colaboracion/${idSolicitudColaboracion}/rechazar`
    );
  },

  /**
   * DELETE /solicitudes-colaboracion/{id} — UC-64.
   * Sólo el perfil remitente puede eliminar una solicitud pendiente.
   * @param {number|string} idSolicitudColaboracion
   * @returns {Promise<{status: number}>} 204 No Content
   */
  eliminar(idSolicitudColaboracion) {
    return http.delete(
      `/solicitudes-colaboracion/${idSolicitudColaboracion}`
    );
  },
};

export default solicitudColaboracionService;
