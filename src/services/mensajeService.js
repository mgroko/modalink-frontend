import http, { API_BASE_URL } from "./http";

/*
 * Contrato de mensajería privada (UC-42).
 * docs/backend/ficha-tecnica-mensajes-privados.md
 *
 * El chat es entre perfiles, no entre usuarios. Todos los endpoints requieren
 * sesión USUARIO y perfil activo.
 */

/**
 * @typedef {Object} PerfilMensajeResponse
 * @property {number} idPerfil
 * @property {string} nombreArtistico
 * @property {string} nombre
 * @property {string} apellido
 * @property {number|null} idProfesion
 * @property {string|null} nombreProfesion
 * @property {string|null} fotoUrl
 */

/**
 * @typedef {Object} ConversacionResponse
 * @property {number} idConversacion
 * @property {PerfilMensajeResponse} perfil contraparte
 * @property {string|null} fechaCreacion
 * @property {string|null} fechaUltimoMensaje
 * @property {string|null} ultimoMensaje
 * @property {boolean} tieneNoLeidos
 * @property {boolean} puedeEnviar
 */

/**
 * @typedef {Object} MensajeResponse
 * @property {number} idMensaje
 * @property {number} idConversacion
 * @property {string} contenido
 * @property {string} fechaEnvio
 * @property {number} idPerfilEmisor
 * @property {PerfilMensajeResponse} perfilEmisor
 * @property {boolean} esMio
 * @property {boolean} leido
 * @property {string|null} fechaLectura
 */

/**
 * @typedef {Object} PaginaConversacionesResponse
 * @property {ConversacionResponse[]} contenido
 * @property {number} paginaActual
 * @property {number} tamanoPagina
 * @property {number} totalElementos
 * @property {number} totalPaginas
 * @property {boolean} primera
 * @property {boolean} ultima
 */

/**
 * @typedef {Object} PaginaMensajesResponse
 * @property {MensajeResponse[]} contenido
 * @property {number} paginaActual
 * @property {number} tamanoPagina
 * @property {number} totalElementos
 * @property {number} totalPaginas
 * @property {boolean} primera
 * @property {boolean} ultima
 */

/**
 * @typedef {Object} ResumenConversacionesResponse
 * @property {number} totalConversaciones
 * @property {number} conversacionesNoLeidas
 */

const mensajeService = {
  /**
   * GET /conversaciones?page=0&size=20
   * @param {{page?: number, size?: number, signal?: AbortSignal}} [opciones]
   * @returns {Promise<{data: PaginaConversacionesResponse}>}
   */
  listarConversaciones({ page = 0, size = 20, signal } = {}) {
    return http.get("/conversaciones", {
      params: { page, size },
      ...(signal ? { signal } : {}),
    });
  },

  /**
   * GET /conversaciones/resumen — badge de conversaciones no leídas.
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ResumenConversacionesResponse}>}
   */
  resumen(signal) {
    return http.get("/conversaciones/resumen", {
      ...(signal ? { signal } : {}),
    });
  },

  /**
   * POST /conversaciones — obtiene o crea la conversación con un perfil.
   * 200 si existía, 201 si se creó.
   * @param {number|string} idPerfilDestinatario
   * @returns {Promise<{data: ConversacionResponse}>}
   */
  crearOIniciar(idPerfilDestinatario) {
    return http.post("/conversaciones", { idPerfilDestinatario });
  },

  /**
   * GET /conversaciones/{idConversacion}
   * Devuelve la conversación puntual del perfil activo. Se usa para abrir el
   * chat desde el link de una notificación.
   * @param {number|string} idConversacion
   * @param {{signal?: AbortSignal}} [opciones]
   * @returns {Promise<{data: ConversacionResponse}>}
   */
  obtenerConversacion(idConversacion, { signal } = {}) {
    return http.get(`/conversaciones/${idConversacion}`, {
      ...(signal ? { signal } : {}),
    });
  },

  /**
   * POST /conversaciones/{idConversacion}/escribiendo
   * Aviso efímero al backend para reenviar por SSE a la contraparte.
   * @param {number|string} idConversacion
   * @param {boolean} [escribiendo]
   * @returns {Promise<{data: null}>} 204 No Content
   */
  notificarEscribiendo(idConversacion, escribiendo = true) {
    return http.post(`/conversaciones/${idConversacion}/escribiendo`, {
      escribiendo,
    });
  },

  /**
   * GET /conversaciones/{idConversacion}/mensajes?page=0&size=50
   * El backend devuelve del mensaje más nuevo al más viejo.
   * @param {number|string} idConversacion
   * @param {{page?: number, size?: number, signal?: AbortSignal}} [opciones]
   * @returns {Promise<{data: PaginaMensajesResponse}>}
   */
  listarMensajes(idConversacion, { page = 0, size = 50, signal } = {}) {
    return http.get(`/conversaciones/${idConversacion}/mensajes`, {
      params: { page, size },
      ...(signal ? { signal } : {}),
    });
  },

  /**
   * POST /conversaciones/{idConversacion}/mensajes
   * @param {number|string} idConversacion
   * @param {string} contenido
   * @returns {Promise<{data: MensajeResponse}>}
   */
  enviarMensaje(idConversacion, contenido) {
    return http.post(`/conversaciones/${idConversacion}/mensajes`, {
      contenido,
    });
  },

  /**
   * PATCH /conversaciones/{idConversacion}/leido
   * Si se omite hastaIdMensaje, marca todos los no leídos actuales.
   * @param {number|string} idConversacion
   * @param {number|string|null} [hastaIdMensaje]
   * @returns {Promise<{data: null}>} 204 No Content
   */
  marcarLeido(idConversacion, hastaIdMensaje = null) {
    const body = {};
    if (hastaIdMensaje != null) body.hastaIdMensaje = hastaIdMensaje;
    return http.patch(`/conversaciones/${idConversacion}/leido`, body);
  },

  /**
   * URL del stream SSE del perfil activo. El consumo se hace con EventSource.
   * @returns {string}
   */
  streamUrl() {
    return `${API_BASE_URL}/mensajes/stream`;
  },
};

export default mensajeService;
