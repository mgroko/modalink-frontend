import http from "./http";

/*
 * Contrato de notificaciones
 * (docs/backend/ficha-tecnica-notificaciones-modal.md).
 * El backend envía `titulo` y los IDs explícitos de cada entidad. `idProyecto`
 * puede ser `null` en notificaciones históricas: no debe inferirse desde
 * `entidadId` en postulaciones.
 */

/**
 * @typedef {Object} NotificacionResponse
 * @property {number} idNotificacion
 * @property {string} tipo
 * @property {string|null} titulo título legible derivado de `tipo`
 * @property {string} mensaje
 * @property {string|null} entidadTipo
 * @property {number|null} entidadId en postulaciones es el id de la postulación
 * @property {boolean} leida
 * @property {string|null} fechaLeida
 * @property {string} origen
 * @property {string} fechaGenerada
 * @property {number|null} idPerfilContexto perfil a activar antes de navegar
 * @property {number|null} idProyecto proyecto asociado; puede ser null
 * @property {number|null} idActividad actividad asociada, si corresponde
 * @property {number|null} idHito hito asociado, si corresponde
 * @property {number|null} idInvitacion invitación asociada, si corresponde
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
   * @param {{idPerfilContexto?: number|null, page?: number, size?: number, signal?: AbortSignal}} [opciones]
   * @returns {Promise<{data: PaginaNotificacionesResponse}>}
   */
  listar({ idPerfilContexto = null, page = 0, size = 20, signal } = {}) {
    return http.get("/notificaciones", {
      params: {
        page,
        size,
        ...(idPerfilContexto != null ? { idPerfilContexto } : {}),
      },
      ...(signal ? { signal } : {}),
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
