import http from "./http";

const BASE_URL = "/admin/configuracion/schedulers/deshabilitacion";

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
};

export default adminConfiguracionService;