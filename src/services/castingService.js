import http from "./http";
import { serializarParams } from "../utils/queryParams.js";

/*
 * Contrato del tablero de casting virtual.
 * Todos los cálculos de cupo, cumplimiento y agenda los resuelve el backend.
 */

/**
 * @typedef {Object} CandidatoCasting
 * @property {number} idPostulacion
 * @property {"GENERAL"|"ACTIVIDAD"} tipo
 * @property {"PENDIENTE"|"ACEPTADA"|"RECHAZADA"} estado
 * @property {string} fechaPostulacion
 * @property {number} idPerfil
 * @property {string} nombreArtistico
 * @property {number|null} idProfesion
 * @property {string|null} codigoProfesion
 * @property {string|null} nombreProfesion
 * @property {string|null} fotoUrl
 * @property {string|null} ciudad
 * @property {string|null} provincia
 * @property {boolean} aportaCupo
 * @property {boolean} puedeAceptar
 * @property {boolean} puedeRechazar
 * @property {Array<Object>} caracteristicas
 * @property {Array<Object>} polaroids
 * @property {Object} cumplimiento
 */

/**
 * @typedef {Object} TableroCasting
 * @property {{idProyecto:number,nombre:string}} proyecto
 * @property {Object} requerimiento
 * @property {CandidatoCasting[]} contenido
 * @property {number} paginaActual
 * @property {number} tamanoPagina
 * @property {number} totalElementos
 * @property {number} totalPaginas
 * @property {boolean} primera
 * @property {boolean} ultima
 * @property {{PENDIENTE:number,ACEPTADA:number,RECHAZADA:number,TOTAL:number}} conteosPorEstado
 */

/**
 * @typedef {Object} ObtenerTableroCastingParams
 * @property {"GENERAL"|"ACTIVIDAD"} tipo
 * @property {number|string} idRequerimiento
 * @property {string|string[]} [estado]
 * @property {"CUMPLIMIENTO"|"FECHA"|"NOMBRE"} [orden]
 * @property {number} [page] base 0
 * @property {number|string} [idPostulacionDestacada]
 */

const castingService = {
  /**
   * GET /proyectos/{idProyecto}/postulaciones/casting
   * @param {number|string} idProyecto
   * @param {ObtenerTableroCastingParams} params
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: TableroCasting}>}
   */
  obtenerTablero(idProyecto, params = {}, signal) {
    const query = serializarParams(params);
    const url = `/proyectos/${idProyecto}/postulaciones/casting${
      query ? `?${query}` : ""
    }`;
    return http.get(url, { signal });
  },
};

export default castingService;
