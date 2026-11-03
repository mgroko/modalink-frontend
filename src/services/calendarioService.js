import http from "./http";

/**
 * @typedef {Object} ActividadReprogramadaJornada
 * @property {number} idActividad
 * @property {string} nombre
 * @property {string} estado
 * @property {string|null} inicioAnterior
 * @property {string|null} inicioNuevo
 */

/**
 * @typedef {Object} BloqueoReprogramacionJornada
 * @property {string} codigo
 * @property {string} mensaje
 * @property {string} [entidad]
 * @property {number} [idEntidad]
 */

/**
 * @typedef {Object} ExitoReprogramacionJornada
 * @property {number} idProyecto
 * @property {string} nombreProyecto
 * @property {string} motivo ej. "CAMBIO_JORNADA"
 * @property {string|null} fechaEntrega
 * @property {ActividadReprogramadaJornada[]} actividades
 * @property {BloqueoReprogramacionJornada[]} conflictosFijos
 */

/**
 * @typedef {Object} FallidoReprogramacionJornada
 * @property {number} idProyecto
 * @property {string} nombreProyecto
 * @property {string} codigo
 * @property {string} mensaje
 * @property {BloqueoReprogramacionJornada[]} bloqueos
 */

/**
 * @typedef {Object} ReprogramacionJornadaResponse
 * @property {number} totalProyectos
 * @property {ExitoReprogramacionJornada[]} exitosos
 * @property {FallidoReprogramacionJornada[]} fallidos
 */

/**
 * @typedef {Object} ConfigJornadaResponse
 * @property {number} margenActividadMinutos margen total entre actividades
 * @property {object[]} dias
 * @property {ReprogramacionJornadaResponse} [reprogramacion] resumen de la
 *           reprogramación automática de proyectos confirmados
 */

const calendarioService = {
  obtenerCalendario() {
    return http.get("/calendario");
  },

  obtenerCalendarioPerfil(idPerfil) {
    return http.get(`/calendario/perfil/${idPerfil}`);
  },

  /**
   * PUT /calendario/jornada — guarda la jornada y dispara la reprogramación
   * automática de proyectos confirmados.
   * @param {{margenActividadMinutos:number, dias:object[]}} request
   * @returns {Promise<{data: ConfigJornadaResponse}>} 200 OK
   */
  configurarJornada(request) {
    return http.put("/calendario/jornada", request);
  },

  crearBloqueo(request) {
    return http.post("/calendario/bloqueos", request);
  },

  eliminarBloqueo(idBloqueo) {
    return http.delete(`/calendario/bloqueos/${idBloqueo}`);
  },
};

export default calendarioService;
