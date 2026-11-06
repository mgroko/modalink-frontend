import http from "./http";

/*
 * Contrato del catálogo global de habilidades (UC-48).
 * Las habilidades no tienen profesión asociada y se buscan por nombre.
 */

/**
 * @typedef {Object} HabilidadResponse
 * @property {number} idHabilidad
 * @property {string} codigo código generado por el backend
 * @property {string} nombre
 * @property {string|null} descripcion
 */

let cacheHabilidades = null;

const habilidadService = {
  /**
   * GET /habilidades — catálogo global de habilidades.
   * Sin `nombre` devuelve todas; con `nombre` hace búsqueda parcial
   * case-insensitive. No tiene paginación.
   *
   * La lista completa se cachea para no repetir llamadas en los formularios.
   * Las búsquedas por nombre no se cachean.
   * @param {{nombre?: string, forzarRecarga?: boolean}} [opciones]
   * @returns {Promise<{data: HabilidadResponse[]}>}
   */
  listar({ nombre = "", forzarRecarga = false } = {}) {
    const texto = String(nombre || "").trim();
    const query = texto ? `?nombre=${encodeURIComponent(texto)}` : "";

    if (!texto && cacheHabilidades && !forzarRecarga) {
      return Promise.resolve(cacheHabilidades);
    }

    return http.get(`/habilidades${query}`).then((response) => {
      if (!texto) cacheHabilidades = response;
      return response;
    });
  },

  /**
   * Invalida la caché del catálogo completo. Se usa después de crear,
   * modificar o eliminar una habilidad desde administración.
   */
  invalidarCache() {
    cacheHabilidades = null;
  },
};

export default habilidadService;
