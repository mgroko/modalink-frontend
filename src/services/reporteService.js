/**
 * Servicio de reportes de perfiles (UC-15).
 */
const reporteService = {
  /**
   * Reporta un perfil visto desde la búsqueda (UC-15).
   *
   * TODO(UC-15): el backend aún no expone el endpoint de reportes. Reemplazar
   * esta simulación por la llamada real cuando exista la ficha técnica
   * (método, ruta y cuerpo a confirmar con el equipo de backend), p. ej.:
   *   return http.post(`/perfiles/${idPerfil}/reportes`, reporte);
   *
   * @param {number} idPerfil perfil a reportar
   * @param {{categoria: string, detalle: string|null}} reporte motivo normalizado
   *        y detalle opcional (máx. 500 caracteres)
   * @returns {Promise<{data: object}>}
   */
  reportar(idPerfil, reporte) {
    console.warn("[UC-15] reporteService.reportar pendiente de backend:", idPerfil, reporte);
    return Promise.resolve({ data: { pendiente: true } });
  },
};

export default reporteService;
