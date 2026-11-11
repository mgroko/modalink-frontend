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

  /**
   * GET /admin/reportes-publicacion — UC-69, bandeja administrativa.
   * Orden: fechaReporte DESC. Si no se envía `estado`, devuelve todos.
   * @param {{estado?: string, motivo?: string, fechaDesde?: string,
   *          fechaHasta?: string, page?: number, size?: number,
   *          todos?: boolean}} [params]
   * @returns {Promise<{data: object}>} PaginaResponse<AdminReportePublicacionResumen>
   */
  listarReportesPublicacion(params = {}, signal) {
    return http.get("/admin/reportes-publicacion", { params, signal });
  },

  /**
   * GET /admin/reportes-publicacion/{idReporte} — UC-69, detalle.
   * Incluye publicación y autor embebidos; no requiere consultar el endpoint
   * de publicación del área usuario.
   * @param {number|string} idReporte
   * @returns {Promise<{data: object}>} AdminReportePublicacionDetalle
   */
  obtenerReportePublicacion(idReporte, signal) {
    return http.get(`/admin/reportes-publicacion/${idReporte}`, { signal });
  },

  /**
   * PATCH /admin/reportes-publicacion/{idReporte}/estado — UC-69.
   * Solo PENDIENTE → RESUELTO o PENDIENTE → DESCARTADO.
   * @param {number|string} idReporte
   * @param {"RESUELTO"|"DESCARTADO"} estado
   * @returns {Promise<{data: object}>} detalle actualizado
   */
  cambiarEstadoReportePublicacion(idReporte, estado, signal) {
    return http.patch(
      `/admin/reportes-publicacion/${idReporte}/estado`,
      { estado },
      { signal }
    );
  },

  /**
   * GET /admin/cronograma/inconsistencias — ficha §7.1.
   * `limite` limita la cantidad de proyectos procesados. Sin paginación.
   * @param {{idProyecto?: number, idActividad?: number, limite?: number}} [params]
   * @returns {Promise<{data: object[]}>} lista de inconsistencias
   */
  listarInconsistenciasCronograma(params = {}, signal) {
    return http.get("/admin/cronograma/inconsistencias", { params, signal });
  },

  /**
   * POST /admin/cronograma/reparar — ficha §7.2.
   * `dryRun` viene en `true` por defecto. Responde 200 incluso con fallos
   * parciales: los fallos van en `errores`.
   * @param {{dryRun?: boolean, idProyecto?: number|null,
   *          idActividad?: number|null, limite?: number}} [payload]
   * @returns {Promise<{data: object}>} totales, inconsistencias y errores
   */
  repararCronograma(payload = {}, signal) {
    return http.post("/admin/cronograma/reparar", payload, { signal });
  },
};

export default adminService;
