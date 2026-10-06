import http from "./http";

const BASE_URL = "/admin/configuracion/schedulers/deshabilitacion";
const BASE_URL_BAJA = "/admin/configuracion/schedulers/baja";

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
};

export default adminConfiguracionService;
