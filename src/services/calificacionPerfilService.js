import http from "./http";

/**
 * Reseñas recibidas por un perfil.
 *
 * La escritura de reseñas vive en el flujo de finalización de proyecto
 * (UC-37). Este servicio solo consume los endpoints de lectura.
 */

/**
 * @typedef {Object} AutorResenaResponse
 * @property {number} idPerfil
 * @property {string} nombreArtistico
 * @property {string} profesion
 * @property {string|null} fotoUrl
 */

/**
 * @typedef {Object} ProyectoResenaResponse
 * @property {number} idProyecto
 * @property {string} nombre
 */

/**
 * @typedef {Object} ResenaPerfilResponse
 * @property {number} idCalificacion
 * @property {number} valoracion 1 a 5
 * @property {string} resenia máximo 200 caracteres
 * @property {string} fechaRegistro ISO-8601 local
 * @property {AutorResenaResponse} emisor
 * @property {ProyectoResenaResponse} proyecto
 */

/**
 * @typedef {Object} DistribucionResenasResponse
 * @property {number} valoracion
 * @property {number} cantidad
 */

/**
 * @typedef {Object} ResumenResenasResponse
 * @property {number} promedio
 * @property {number} total
 * @property {DistribucionResenasResponse[]} distribucion orden 5 a 1
 */

/**
 * @typedef {Object} PaginaResenasResponse
 * @property {ResenaPerfilResponse[]} contenido
 * @property {number} paginaActual
 * @property {number} tamanoPagina
 * @property {number} totalElementos
 * @property {number} totalPaginas
 * @property {boolean} primera
 * @property {boolean} ultima
 */

/**
 * @typedef {Object} ResenasPerfilResponse
 * @property {number} idPerfil
 * @property {ResumenResenasResponse} resumen
 * @property {PaginaResenasResponse} calificaciones
 */

const calificacionPerfilService = {
  /**
   * GET /perfiles/{idPerfil}/calificaciones
   *
   * Devuelve el resumen agregado y una página de reseñas ordenadas por fecha
   * descendente. La tarjeta lateral del perfil usa `size=2`.
   *
   * Errores:
   * - 401 sesión vencida (lo maneja http.js)
   * - 403 el rol Administrador no opera el área de usuario
   * - 404 perfil inexistente o no visible
   *
   * @param {number|string} idPerfil
   * @param {{page?: number, size?: number, signal?: AbortSignal}} [opciones]
   * @returns {Promise<{data: ResenasPerfilResponse}>}
   */
  listar(idPerfil, { page = 0, size = 10, signal } = {}) {
    return http.get(`/perfiles/${idPerfil}/calificaciones`, {
      params: { page, size },
      signal,
    });
  },

  /**
   * GET /perfiles/{idPerfil}/calificaciones/{idCalificacion}
   *
   * Devuelve el detalle de una reseña validando que pertenezca al perfil.
   * Si no existe o es de otro perfil responde 404.
   *
   * @param {number|string} idPerfil
   * @param {number|string} idCalificacion
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ResenaPerfilResponse}>}
   */
  obtener(idPerfil, idCalificacion, signal) {
    return http.get(
      `/perfiles/${idPerfil}/calificaciones/${idCalificacion}`,
      { signal }
    );
  },
};

export default calificacionPerfilService;
