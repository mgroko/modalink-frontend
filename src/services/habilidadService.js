import http from "./http";

/*
 * GET /habilidades — PLACEHOLDER (UC-24).
 * El backend aún no implementó el catálogo de habilidades; el endpoint se
 * mantiene como placeholder para no bloquear el multi-select del formulario
 * de crear proyecto. Si responde 404/501, la vista debe degradar el control
 * (ocultarlo o mostrar aviso) en lugar de romper la carga del formulario.
 */

/**
 * @typedef {Object} HabilidadResponse
 * @property {number} idHabilidad
 * @property {string} nombre
 */

let cacheHabilidades = null;

const habilidadService = {
  /**
   * GET /habilidades — catálogo de habilidades para
   * `requerimientosGral[].habilidades[]` (ficha UC-24).
   * Placeholder: aún sin implementar en el backend.
   * @param {{ forzarRecarga?: boolean }} [opciones]
   * @returns {Promise<{data: HabilidadResponse[]}>}
   */
  listar({ forzarRecarga = false } = {}) {
    if (cacheHabilidades && !forzarRecarga) {
      return Promise.resolve(cacheHabilidades);
    }
    return http.get("/habilidades").then((response) => {
      cacheHabilidades = response;
      return response;
    });
  },
};

export default habilidadService;
