import http from "./http";

/*
 * Contrato de conexiones activas (UC-44 y UC-44 bis).
 * `GET /conexiones` devuelve la red vigente del perfil activo; las conexiones
 * eliminadas no aparecen.
 */

/**
 * @typedef {Object} PerfilConexionResponse
 * @property {number} idPerfil
 * @property {string} nombreArtistico
 * @property {string} nombre
 * @property {string} apellido
 * @property {number} idProfesion
 * @property {string} nombreProfesion
 * @property {string|null} fotoUrl
 * @property {Object|null} ciudad
 * @property {boolean} [enLinea]
 */

/**
 * @typedef {Object} ConexionResponse
 * @property {number} idConexion
 * @property {string} fechaInicioConexion
 * @property {number} idPerfil1
 * @property {number} idPerfil2
 * @property {PerfilConexionResponse} perfil contraparte
 * @property {boolean} [enLinea]
 */

/**
 * @typedef {Object} PaginaConexionesResponse
 * @property {ConexionResponse[]} contenido
 * @property {number} paginaActual base 0
 * @property {number} tamanoPagina
 * @property {number} totalElementos
 * @property {number} totalPaginas
 * @property {boolean} primera
 * @property {boolean} ultima
 */

/**
 * @typedef {Object} ProfesionResumenConexion
 * @property {number} idProfesion
 * @property {string} nombre
 * @property {number} cantidad
 */

/**
 * @typedef {Object} ResumenConexionesResponse
 * @property {number} totalConexiones
 * @property {number} totalEnLinea
 * @property {ProfesionResumenConexion[]} profesiones
 */

const conexionService = {
  /**
   * GET /conexiones — UC-44 bis.
   * Filtros: texto, nombre, apellido, nombreArtistico, idProfesion,
   * estadoPresencia, page y size.
   * @param {Object} params
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: PaginaConexionesResponse}>}
   */
  listar(params, signal) {
    return http.get("/conexiones", { params, signal });
  },

  /**
   * GET /conexiones/resumen — UC-44 bis.
   * Devuelve totales y profesiones para el hero y los chips.
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ResumenConexionesResponse}>}
   */
  resumen(signal) {
    return http.get("/conexiones/resumen", { signal });
  },

  /**
   * DELETE /conexiones/{idConexion} — UC-44.
   * Errores: 404 conexión inexistente/no participa; 409 CONEXION_NO_ACTIVA.
   * @param {number|string} idConexion
   * @returns {Promise<{data: null}>} 204 No Content
   */
  eliminar(idConexion) {
    return http.delete(`/conexiones/${idConexion}`);
  },
};

export default conexionService;
