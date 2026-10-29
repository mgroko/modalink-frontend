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

  /**
   * GET /admin/reportes-perfil — UC-15, bandeja administrativa.
   * Orden: fechaReporte DESC. Si no se envía `estado`, devuelve todos.
   * @param {{estado?: string, motivo?: string, fechaDesde?: string,
   *          fechaHasta?: string, page?: number, size?: number,
   *          todos?: boolean}} [params]
   * @returns {Promise<{data: object}>} PaginaResponse<AdminReportePerfilResumenResponse>
   */
  listarReportesPerfil(params = {}, signal) {
    return http.get("/admin/reportes-perfil", { params, signal });
  },

  /**
   * GET /admin/reportes-perfil/{idReporte} — UC-15, detalle.
   * Los datos del perfil y del usuario son los actuales (sin snapshot).
   * @param {number|string} idReporte
   * @returns {Promise<{data: object}>} AdminReportePerfilDetalleResponse
   */
  obtenerReportePerfil(idReporte, signal) {
    return http.get(`/admin/reportes-perfil/${idReporte}`, { signal });
  },

  /**
   * PATCH /admin/reportes-perfil/{idReporte}/estado — UC-15.
   * Solo PENDIENTE → RESUELTO o PENDIENTE → DESCARTADO.
   * @param {number|string} idReporte
   * @param {"RESUELTO"|"DESCARTADO"} estado
   * @returns {Promise<{data: object}>} detalle actualizado
   */
  cambiarEstadoReportePerfil(idReporte, estado, signal) {
    return http.patch(
      `/admin/reportes-perfil/${idReporte}/estado`,
      { estado },
      { signal }
    );
  },
};

export default adminService;
