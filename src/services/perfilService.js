import http from "./http";

const perfilService = {
  listarMisPerfiles() {
    return http.get("/usuarios/me/perfiles");
  },

  crear(request) {
    return http.post("/perfiles", request);
  },

  obtener(idPerfil) {
    return http.get(`/perfiles/${idPerfil}`);
  },

  editar(idPerfil, request) {
    return http.put(`/perfiles/${idPerfil}`, request);
  },

  eliminar(idPerfil) {
    return http.delete(`/perfiles/${idPerfil}`);
  },

  reactivar(idPerfil) {
    return http.post(`/perfiles/${idPerfil}/reactivar`);
  },

  listarProfesiones() {
    return http.get("/profesiones");
  },

  caracteristicasPorProfesion(idProfesion) {
    return http.get(`/profesiones/${idProfesion}/caracteristicas-tecnicas`);
  },
};

export default perfilService;
