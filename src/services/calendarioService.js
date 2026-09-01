import http from "./http";

const calendarioService = {
  obtenerCalendario() {
    return http.get("/calendario");
  },

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
