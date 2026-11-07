import http from "./http";

/**
 * UC-67 — Informe de auditoría (solo lectura, rol Administrador).
 * Referencia: docs/backend/ficha-tecnica-auditoria-admin.md
 *
 * - Autenticación por cookie `jwt`; los GET no requieren el header
 *   `X-XSRF-TOKEN` (lo agrega el interceptor solo en métodos mutantes).
 * - La exportación es una descarga binaria: se pide con `responseType: "blob"`
 *   y un error 400 llega igualmente como blob, que la vista debe parsear
 *   para mostrar el código/mensaje del backend.
 */
const auditoriaService = {
  /** GET /admin/auditoria — listado paginado, más reciente primero. */
  listar(params = {}, signal) {
    return http.get("/admin/auditoria", { params, signal });
  },

  /** GET /admin/auditoria/tipos — catálogo activo, agrupable por `modulo`. */
  tipos(signal) {
    return http.get("/admin/auditoria/tipos", { signal });
  },

  /** GET /admin/auditoria/resumen — totales por tipo de evento y por entidad. */
  resumen(params = {}, signal) {
    return http.get("/admin/auditoria/resumen", { params, signal });
  },

  /** GET /admin/auditoria/export?formato=CSV|PDF — descarga binaria. */
  exportar(params = {}, signal) {
    return http.get("/admin/auditoria/export", {
      params,
      signal,
      responseType: "blob",
    });
  },
};

export default auditoriaService;
