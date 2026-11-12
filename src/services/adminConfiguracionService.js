import http from "./http";

const BASE_URL = "/admin/configuracion/schedulers/deshabilitacion";
const BASE_URL_BAJA = "/admin/configuracion/schedulers/baja";
const BASE_URL_LIMPIEZA_IMAGENES = "/admin/configuracion/schedulers/limpieza-imagenes";

/**
 * @typedef {Object} ConfiguracionLimpiezaImagenes
 * @property {number} intervaloHoras
 * @property {number} graciaMinutos
 * @property {string|null} proximaEjecucion
 * @property {string|null} ultimaEjecucion
 */

/**
 * @typedef {Object} EjecutarLimpiezaImagenesResponse
 * @property {number} registrosAfectados
 * @property {number} archivosHuerfanos
 * @property {number} imagenesHuerfanas
 * @property {number} imagenesPerfilesBaja
 * @property {number} errores
 * @property {string} ejecutadoEn
 * @property {string} mensaje
 */

const adminConfiguracionService = {
  obtenerConfiguracion() {
    return http.get(BASE_URL);
  },

  actualizarConfiguracion(payload) {
    return http.post(BASE_URL, payload);
  },

  ejecutarAhora() {
    return http.post(`${BASE_URL}/ejecutar-ahora`);
  },

  obtenerBaja() {
    return http.get(BASE_URL_BAJA);
  },

  actualizarBaja(payload) {
    return http.post(BASE_URL_BAJA, payload);
  },

  ejecutarBajaAhora() {
    return http.post(`${BASE_URL_BAJA}/ejecutar-ahora`);
  },

  /**
   * @returns {Promise<{data: ConfiguracionLimpiezaImagenes}>}
   */
  obtenerLimpiezaImagenes() {
    return http.get(BASE_URL_LIMPIEZA_IMAGENES);
  },

  /**
   * @param {{ intervaloHoras: number }} payload
   * @returns {Promise<{data: ConfiguracionLimpiezaImagenes}>}
   */
  actualizarLimpiezaImagenes(payload) {
    return http.post(BASE_URL_LIMPIEZA_IMAGENES, payload);
  },

  /**
   * @returns {Promise<{data: EjecutarLimpiezaImagenesResponse}>}
   */
  ejecutarLimpiezaImagenesAhora() {
    return http.post(`${BASE_URL_LIMPIEZA_IMAGENES}/ejecutar-ahora`);
  },
};

export default adminConfiguracionService;
