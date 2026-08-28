import http from "./http";

const perfilService = {
  listarMisPerfiles() {
    return http.get("/usuarios/me/perfiles");
  },

  crear(request) {
    return http.post("/perfiles", request);
  },

  listarProfesiones() {
    return http.get("/profesiones");
  },

  caracteristicasPorProfesion(idProfesion) {
    return http.get(`/profesiones/${idProfesion}/caracteristicas-tecnicas`);
  },
};

export default perfilService;
