import http from "./http";

/*
 * Contrato de colaboraciones automáticas
 * (docs/backend/ficha-tecnica-colaboraciones-automaticas.md).
 *
 * El backend detecta imágenes compartidas y crea propuestas recíprocas. El
 * frontend solo lista, consulta, confirma o rechaza; la detección es
 * responsabilidad del backend.
 */

/**
 * @typedef {Object} PublicacionColaboracionAutomatica
 * @property {number|null} idPublicacion
 * @property {string|null} titulo
 * @property {string|null} portadaUrl
 * @property {string} estado
 * @property {boolean} eliminada
 */

/**
 * @typedef {Object} PerfilColaboracionAutomatica
 * @property {number} idPerfil
 * @property {string} nombreArtistico
 * @property {string} [profesion]
 * @property {string|null} [fotoUrl]
 */

/**
 * @typedef {Object} ColaboracionAutomaticaResponse
 * @property {number} idColaboracionAutomatica
 * @property {"PENDIENTE"|"CONFIRMADA"|"RECHAZADA"|"CANCELADA"|"DISUELTA"} estado
 * @property {string} miEstado
 * @property {string} estadoContraparte
 * @property {string|null} fechaDeteccion
 * @property {string|null} fechaConfirmacion
 * @property {string|null} fechaDisolucion
 * @property {PublicacionColaboracionAutomatica|null} publicacionPropia
 * @property {PublicacionColaboracionAutomatica|null} publicacionContraparte
 * @property {PerfilColaboracionAutomatica|null} perfilContraparte
 * @property {{idImagen:number,url:string}|null} imagen
 * @property {boolean} puedeConfirmar
 * @property {boolean} puedeRechazar
 */

const colaboracionAutomaticaService = {
  /**
   * GET /colaboraciones-automaticas
   * Por defecto el backend devuelve las PENDIENTES.
   * @param {object} [params]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: object}>}
   */
  listar(params = {}, signal) {
    return http.get("/colaboraciones-automaticas", {
      params,
      ...(signal ? { signal } : {}),
    });
  },

  /**
   * GET /colaboraciones-automaticas/{id}
   * @param {number|string} idColaboracionAutomatica
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ColaboracionAutomaticaResponse}>}
   */
  obtener(idColaboracionAutomatica, signal) {
    return http.get(`/colaboraciones-automaticas/${idColaboracionAutomatica}`, {
      ...(signal ? { signal } : {}),
    });
  },

  /**
   * POST /colaboraciones-automaticas/{id}/confirmar
   * La primera confirmación deja la propuesta PENDIENTE; la segunda la activa.
   * @param {number|string} idColaboracionAutomatica
   * @returns {Promise<{data: ColaboracionAutomaticaResponse}|{status:number}>}
   */
  confirmar(idColaboracionAutomatica) {
    return http.post(
      `/colaboraciones-automaticas/${idColaboracionAutomatica}/confirmar`
    );
  },

  /**
   * POST /colaboraciones-automaticas/{id}/rechazar
   * El rechazo finaliza la propuesta y no agrega colaboradores.
   * @param {number|string} idColaboracionAutomatica
   * @returns {Promise<{data: ColaboracionAutomaticaResponse}|{status:number}>}
   */
  rechazar(idColaboracionAutomatica) {
    return http.post(
      `/colaboraciones-automaticas/${idColaboracionAutomatica}/rechazar`
    );
  },
};

export default colaboracionAutomaticaService;
