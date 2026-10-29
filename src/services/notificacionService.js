import http from "./http";

/*
 * Contrato de notificaciones
 * (docs/backend/ficha-tecnica-notificaciones-navegacion.md).
 * El sistema agrega `idProyecto` (nullable) al final de la respuesta; es un
 * dato derivado en lectura a partir de `entidadTipo + entidadId`, no una
 * columna persistida. No debe inferirse desde `entidadId`.
 */

/**
 * @typedef {Object} NotificacionResponse
 * @property {number} idNotificacion
 * @property {string} tipo
 * @property {string} [titulo] título listo para UI (puede faltar en tipos viejos)
 * @property {string} mensaje
 * @property {string|null} entidadTipo
 * @property {number|null} entidadId en postulaciones es el id de la postulación
 * @property {boolean} leida
 * @property {string|null} fechaLeida
 * @property {string} origen
 * @property {string} fechaGenerada
 * @property {number|null} idPerfilContexto
 * @property {number|null} idProyecto proyecto asociado, derivado; puede ser null
 */

/**
 * @typedef {Object} PaginaNotificacionesResponse
 * @property {NotificacionResponse[]} contenido
 * @property {number} paginaActual base 0
 * @property {number} tamanoPagina
 * @property {number} totalElementos
 * @property {number} totalPaginas
 * @property {boolean} primera
 * @property {boolean} ultima
 */

const notificacionService = {
  /**
   * GET /notificaciones — listado paginado.
   * @param {{idPerfilContexto?: number|null, page?: number, size?: number}} [opciones]
   * @returns {Promise<{data: PaginaNotificacionesResponse}>}
   */
  listar({ idPerfilContexto = null, page = 0, size = 20 } = {}) {
    return http.get("/notificaciones", {
      params: {
        page,
        size,
        ...(idPerfilContexto != null ? { idPerfilContexto } : {}),
      },
    });
  },

  resumen(idPerfilContexto = null) {
    return http.get("/notificaciones/resumen", {
      params: idPerfilContexto != null ? { idPerfilContexto } : {},
    });
  },

  /**
   * PATCH /notificaciones/{idNotificacion}/leida
   * Devuelve el mismo NotificacionResponse actualizado, incluido `idProyecto`.
   * @param {number|string} idNotificacion
   * @returns {Promise<{data: NotificacionResponse}>}
   */
  marcarLeida(idNotificacion) {
    return http.patch(`/notificaciones/${idNotificacion}/leida`, {});
  },

  marcarTodas(idPerfilContexto = null) {
    return http.patch("/notificaciones/leidas", {}, {
      params: idPerfilContexto != null ? { idPerfilContexto } : {},
    });
  },
};

export default notificacionService;
