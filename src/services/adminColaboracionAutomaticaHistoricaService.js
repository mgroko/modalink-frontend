import http from "./http";

/*
 * Contrato administrativo del procesamiento histórico de colaboraciones
 * automáticas
 * (docs/backend/ficha-tecnica-colaboraciones-automaticas-historicas.md).
 *
 * Todos los endpoints viven bajo /admin y requieren rol Administrador.
 */

const BASE_URL = "/admin/colaboraciones-automaticas/historicas";

/**
 * @typedef {"HUELLAS"|"DETECCION"|"AMBOS"} ModoProcesamientoHistorico
 */

/**
 * @typedef {"PENDIENTE"|"EN_PROGRESO"|"COMPLETADO"|
 *   "COMPLETADO_CON_ERRORES"|"CANCELADO"|"FALLIDO"|"INTERRUMPIDO"} EstadoProcesamientoHistorico
 */

/**
 * @typedef {Object} ProcesamientoHistoricoResponse
 * @property {number} idProcesamiento
 * @property {EstadoProcesamientoHistorico} estado
 * @property {ModoProcesamientoHistorico} modo
 * @property {number|null} filtroIdPublicacion
 * @property {number|null} filtroIdPerfil
 * @property {string|null} filtroFechaDesde
 * @property {string|null} filtroFechaHasta
 * @property {boolean} notificar
 * @property {number} tamanoLote
 * @property {number|null} limitePublicaciones
 * @property {number} totalPublicaciones
 * @property {number} publicacionesProcesadas
 * @property {number} totalImagenes
 * @property {number} imagenesProcesadas
 * @property {number} hashesCalculados
 * @property {number} propuestasCreadas
 * @property {number} propuestasOmitidas
 * @property {number} errores
 * @property {number|null} ultimoIdPublicacion
 * @property {number|null} idUsuarioAdmin
 * @property {string|null} fechaInicio
 * @property {string|null} fechaFin
 * @property {string|null} mensajeError
 */

/**
 * @typedef {Object} PreviewProcesamientoHistoricoResponse
 * @property {number} publicaciones
 * @property {number} imagenes
 * @property {number} imagenesSinSha256
 * @property {number} imagenesSinPhash
 * @property {number} imagenesIlegibles
 * @property {number} paresCandidatosEstimados
 */

/**
 * @typedef {Object} ErrorProcesamientoHistoricoResponse
 * @property {number} idError
 * @property {number|null} idPublicacion
 * @property {number|null} idImagen
 * @property {string|null} nombreArchivo
 * @property {string} mensaje
 * @property {string|null} fechaRegistro
 */

/**
 * @typedef {Object} FiltrosProcesamientoHistoricoRequest
 * @property {ModoProcesamientoHistorico} modo
 * @property {number|null} [idPublicacion]
 * @property {number|null} [idPerfil]
 * @property {string|null} [fechaDesde]
 * @property {string|null} [fechaHasta]
 * @property {number|null} [limitePublicaciones]
 */

/**
 * @typedef {FiltrosProcesamientoHistoricoRequest} ProcesarHistoricoRequest
 * @property {boolean} [notificar]
 * @property {number} [tamanoLote]
 */

const adminColaboracionAutomaticaHistoricaService = {
  /**
   * POST /admin/colaboraciones-automaticas/historicas/previsualizar
   * Calcula el impacto sin crear propuestas ni modificar datos.
   * @param {FiltrosProcesamientoHistoricoRequest} payload
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: PreviewProcesamientoHistoricoResponse}>}
   */
  previsualizar(payload, signal) {
    return http.post(`${BASE_URL}/previsualizar`, payload, {
      ...(signal ? { signal } : {}),
    });
  },

  /**
   * POST /admin/colaboraciones-automaticas/historicas/procesar
   * Crea el job asíncrono y responde 202 Accepted.
   * @param {ProcesarHistoricoRequest} payload
   * @returns {Promise<{data: ProcesamientoHistoricoResponse}>}
   */
  procesar(payload) {
    return http.post(`${BASE_URL}/procesar`, payload);
  },

  /**
   * GET /admin/colaboraciones-automaticas/historicas
   * Listado paginado de jobs con filtros por estado y rango de fechas.
   * @param {{estado?: string, fechaDesde?: string, fechaHasta?: string,
   *          page?: number, size?: number}} [params]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: object}>}
   */
  listar(params = {}, signal) {
    return http.get(BASE_URL, { params, signal });
  },

  /**
   * GET /admin/colaboraciones-automaticas/historicas/{id}
   * @param {number|string} idProcesamiento
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ProcesamientoHistoricoResponse}>}
   */
  obtener(idProcesamiento, signal) {
    return http.get(`${BASE_URL}/${idProcesamiento}`, { signal });
  },

  /**
   * GET /admin/colaboraciones-automaticas/historicas/{id}/errores
   * @param {number|string} idProcesamiento
   * @param {{page?: number, size?: number}} [params]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: object}>}
   */
  listarErrores(idProcesamiento, params = {}, signal) {
    return http.get(`${BASE_URL}/${idProcesamiento}/errores`, {
      params,
      signal,
    });
  },

  /**
   * POST /admin/colaboraciones-automaticas/historicas/{id}/cancelar
   * @param {number|string} idProcesamiento
   * @returns {Promise<{data: ProcesamientoHistoricoResponse}|object>}
   */
  cancelar(idProcesamiento) {
    return http.post(`${BASE_URL}/${idProcesamiento}/cancelar`);
  },
};

export default adminColaboracionAutomaticaHistoricaService;
