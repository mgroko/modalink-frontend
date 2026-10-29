import http from "./http";

/**
 * Servicio de reportes de perfiles (UC-15).
 *
 * Nota: el alta no devuelve body (`204 No Content`). El resto de la gestión
 * vive en `adminService` (`/admin/reportes-perfil`).
 */
const reporteService = {
  /**
   * POST /perfiles/{idPerfil}/reportes — UC-15.
   * Requiere sesión y perfil activo. El `idPerfil` del path es el perfil
   * reportado (no el autor).
   *
   * Reglas:
   * - `motivo`: SPAM | CONTENIDO_OFENSIVO | SUPLANTACION | PERFIL_FALSO | OTRO
   * - `descripcion`: opcional, máx. 200; obligatoria y no vacía si OTRO.
   * - No se puede reportar el perfil propio ni un perfil inactivo.
   * - Un administrador no puede reportar.
   * - Un mismo autor no puede tener dos reportes PENDIENTE sobre el mismo perfil.
   *
   * Errores: 400, 401, 403, 404, 409, 500.
   * @param {number|string} idPerfil perfil reportado
   * @param {{motivo: string, descripcion?: string|null}} reporte
   * @returns {Promise<{data: string}>} 204 No Content
   */
  reportar(idPerfil, { motivo, descripcion } = {}) {
    const texto = String(descripcion ?? "").trim();
    return http.post(`/perfiles/${idPerfil}/reportes`, {
      motivo,
      descripcion: texto || null,
    });
  },
};

export default reporteService;
