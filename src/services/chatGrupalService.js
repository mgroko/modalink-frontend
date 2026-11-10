import http from "./http";

/*
 * Contrato del chat grupal por proyecto (UC-41).
 * docs/backend/ficha-tecnica-chat-grupal.md
 *
 * Cada proyecto tiene un único chat implícito. Todos los endpoints requieren
 * sesión USUARIO y perfil activo.
 */

/**
 * @typedef {Object} PerfilParticipanteChatResponse
 * @property {number} idPerfil
 * @property {string} nombreArtistico
 * @property {string} nombre
 * @property {string} apellido
 * @property {number|null} idProfesion
 * @property {string|null} nombreProfesion
 * @property {string|null} fotoUrl
 */

/**
 * @typedef {Object} ParticipanteChatResponse
 * @property {PerfilParticipanteChatResponse} perfil
 * @property {string} rol DIRECTOR | MIEMBRO
 */

/**
 * @typedef {Object} ChatProyectoResponse
 * @property {number} idProyecto
 * @property {string} nombreProyecto
 * @property {string} estadoProyecto
 * @property {boolean} puedeEnviar
 * @property {ParticipanteChatResponse[]} participantes
 */

/**
 * @typedef {Object} MensajeGrupalResponse
 * @property {number} idMensajeProyecto
 * @property {number} idProyecto
 * @property {string} contenido
 * @property {string} fechaEnvio
 * @property {number} idPerfilEmisor
 * @property {PerfilParticipanteChatResponse} perfilEmisor
 * @property {boolean} esMio
 */

/**
 * @typedef {Object} PaginaMensajesGrupalesResponse
 * @property {MensajeGrupalResponse[]} contenido
 * @property {number} paginaActual
 * @property {number} tamanoPagina
 * @property {number} totalElementos
 * @property {number} totalPaginas
 * @property {boolean} primera
 * @property {boolean} ultima
 */

const chatGrupalService = {
  /**
   * GET /proyectos/{idProyecto}/chat
   * @param {number|string} idProyecto
   * @param {{signal?: AbortSignal}} [opciones]
   * @returns {Promise<{data: ChatProyectoResponse}>}
   */
  obtenerChat(idProyecto, { signal } = {}) {
    return http.get(`/proyectos/${idProyecto}/chat`, {
      ...(signal ? { signal } : {}),
    });
  },

  /**
   * GET /proyectos/{idProyecto}/chat/mensajes?page=0&size=50
   * El backend devuelve del mensaje más nuevo al más viejo.
   * @param {number|string} idProyecto
   * @param {{page?: number, size?: number, signal?: AbortSignal}} [opciones]
   * @returns {Promise<{data: PaginaMensajesGrupalesResponse}>}
   */
  listarMensajes(idProyecto, { page = 0, size = 50, signal } = {}) {
    return http.get(`/proyectos/${idProyecto}/chat/mensajes`, {
      params: { page, size },
      ...(signal ? { signal } : {}),
    });
  },

  /**
   * POST /proyectos/{idProyecto}/chat/mensajes
   * @param {number|string} idProyecto
   * @param {string} contenido
   * @returns {Promise<{data: MensajeGrupalResponse}>}
   */
  enviarMensaje(idProyecto, contenido) {
    return http.post(`/proyectos/${idProyecto}/chat/mensajes`, {
      contenido,
    });
  },

  /**
   * PATCH /proyectos/{idProyecto}/chat/leido
   * Marca como leídas las notificaciones MENSAJE_GRUPAL_RECIBIDO del proyecto.
   * @param {number|string} idProyecto
   * @returns {Promise<{data: null}>} 204 No Content
   */
  marcarLeido(idProyecto) {
    return http.patch(`/proyectos/${idProyecto}/chat/leido`, {});
  },
};

export default chatGrupalService;
