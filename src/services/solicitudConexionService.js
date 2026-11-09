import http from "./http";

/*
 * Contrato de solicitudes de conexión (ficha UC-43).
 * El remitente sale del JWT y del perfil activo; el body sólo indica el
 * perfil destinatario. El CSRF lo agrega http.js en los métodos mutantes.
 */

/**
 * @typedef {Object} PerfilResumenConexionResponse
 * @property {number} idPerfil
 * @property {string} nombreArtistico
 * @property {string} nombre
 * @property {string} apellido
 * @property {number} idProfesion
 * @property {string} nombreProfesion
 */

/**
 * @typedef {Object} SolicitudConexionResponse
 * @property {number} idSolicitudConexion
 * @property {"PENDIENTE"|"ACEPTADA"|"RECHAZADA"} estado
 * @property {string} fechaEnvio ISO-8601 local
 * @property {string|null} fechaRespuesta ISO-8601 local; null si está pendiente
 * @property {PerfilResumenConexionResponse} remitente
 * @property {PerfilResumenConexionResponse} destinatario
 */

/**
 * @typedef {"RECIBIDA"|"ENVIADA"} DireccionSolicitudConexion
 * @typedef {"PENDIENTE"|"ACEPTADA"|"RECHAZADA"} EstadoSolicitudConexion
 */

/**
 * Contraparte de una solicitud en el listado de UC-46.
 * @typedef {Object} PerfilContraparteResponse
 * @property {number} idPerfil
 * @property {string} nombreArtistico
 * @property {string} nombre
 * @property {string} apellido
 * @property {number} idProfesion
 * @property {string} nombreProfesion
 * @property {string|null} fotoUrl
 */

/**
 * Fila del listado de solicitudes de conexión (UC-46).
 * @typedef {Object} SolicitudConexionListadoResponse
 * @property {number} idSolicitudConexion
 * @property {EstadoSolicitudConexion} estado
 * @property {string} fechaEnvio ISO-8601 local
 * @property {string|null} fechaRespuesta ISO-8601 local
 * @property {DireccionSolicitudConexion} direccion
 * @property {number} idPerfilRemitente
 * @property {number} idPerfilDestinatario
 * @property {PerfilContraparteResponse} perfil
 * @property {boolean} puedeAceptar
 * @property {boolean} puedeRechazar
 * @property {boolean} puedeCancelar
 */

/**
 * @typedef {Object} PaginaSolicitudesConexionResponse
 * @property {SolicitudConexionListadoResponse[]} contenido
 * @property {number} paginaActual base 0
 * @property {number} tamanoPagina
 * @property {number} totalElementos
 * @property {number} totalPaginas
 * @property {boolean} primera
 * @property {boolean} ultima
 */

const solicitudConexionService = {
  /**
   * GET /solicitudes-conexion — UC-46.
   * Lista las solicitudes recibidas y/o enviadas del perfil activo.
   *
   * Errores:
   * - 400 RANGO_FECHAS_INVALIDO
   * - 400 dirección, estado, page o size inválidos
   * - 404 no hay perfil activo en la sesión
   *
   * @param {Object} params query params construidos por
   *        `construirParamsSolicitudesConexion`
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: PaginaSolicitudesConexionResponse}>} 200 OK
   */
  buscar(params, signal) {
    return http.get("/solicitudes-conexion", { params, signal });
  },

  /**
   * POST /solicitudes-conexion — UC-43.
   *
   * Errores:
   * - 400 body inválido o falta idPerfilDestinatario
   * - 403 ROL_NO_PERMITIDO
   * - 404 sin perfil activo o destinatario no visible
   * - 409 SOLICITUD_CONEXION_INVALIDA (autorrequest o perfiles del mismo usuario)
   * - 409 SOLICITUD_CONEXION_PENDIENTE
   * - 409 CONEXION_YA_EXISTENTE
   *
   * @param {number|string} idPerfilDestinatario
   * @returns {Promise<{data: SolicitudConexionResponse}>} 201 Created
   */
  enviar(idPerfilDestinatario) {
    return http.post("/solicitudes-conexion", { idPerfilDestinatario });
  },

  /**
   * DELETE /solicitudes-conexion/{idSolicitudConexion} — extensión UC-43.
   * Sólo el perfil remitente puede cancelar una solicitud PENDIENTE.
   *
   * Errores:
   * - 403 SOLICITUD_CONEXION_NO_PERMITIDA (la solicitud pertenece a otro perfil)
   * - 404 la solicitud no existe o no hay perfil activo
   * - 409 SOLICITUD_CONEXION_NO_PENDIENTE (ya fue aceptada o rechazada)
   *
   * @param {number|string} idSolicitudConexion
   * @returns {Promise<{data: null}>} 204 No Content
   */
  cancelar(idSolicitudConexion) {
    return http.delete(`/solicitudes-conexion/${idSolicitudConexion}`);
  },
};

export default solicitudConexionService;
