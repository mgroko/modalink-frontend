import http from "./http";

const adminService = {
  listarUsuarios() {
    return http.get("/admin/usuarios");
  },

  habilitarUsuario(idUsuario) {
    return http.patch(`/admin/usuarios/${idUsuario}/habilitar`);
  },

  deshabilitarUsuario(idUsuario) {
    return http.patch(`/admin/usuarios/${idUsuario}/deshabilitar`);
  },
};

export default adminService;