import http from "./http";

const adminService = {
  obtenerDashboardResumen(size = 10) {
    return http.get("/admin/dashboard/resumen", { params: { size } });
  },

  listarProyectos(params = {}) {
    return http.get("/admin/proyectos", { params });
  },

  listarUsuarios() {
    return http.get("/admin/usuarios");
  },

  buscarUsuarios(params) {
    return http.get("/admin/usuarios/buscar", { params });
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
