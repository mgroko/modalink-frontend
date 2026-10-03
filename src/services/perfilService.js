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

  activar(idPerfil) {
    return http.patch(`/perfiles/${idPerfil}/activar`, {});
  },

  listarProfesiones() {
    return http.get("/profesiones");
  },

  buscar(params) {
    return http.get("/perfiles/buscar", { params });
  },

  caracteristicasPorProfesion(idProfesion) {
    return http.get(`/profesiones/${idProfesion}/caracteristicas-tecnicas`);
  },
};

export default perfilService;
