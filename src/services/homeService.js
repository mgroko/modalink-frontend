import http from "./http";

const homeService = {
  obtenerResumen() {
    return http.get("/home/resumen");
  },

  obtenerPerfilActivo() {
    return http.get("/perfiles/activo");
  },
};

export default homeService;
