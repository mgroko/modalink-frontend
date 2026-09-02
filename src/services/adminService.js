import http from "./http";

const adminService = {
  listarUsuarios() {
    return http.get("/admin/usuarios");
  },

  detalleUsuario(idUsuario) {
    return http.get(`/admin/usuarios/${idUsuario}`);
  },

  perfilesUsuario(idUsuario) {
    return http.get(`/admin/usuarios/${idUsuario}/perfiles`);
  },

  habilitarUsuario(idUsuario) {
    return http.patch(`/admin/usuarios/${idUsuario}/habilitar`);
  },

  deshabilitarUsuario(idUsuario, datos) {
    return http.patch(`/admin/usuarios/${idUsuario}/deshabilitar`, datos);
  },
};

export default adminService;
