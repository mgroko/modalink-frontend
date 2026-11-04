import http from "./http";

/*
 * Administración del catálogo global de habilidades (UC-56).
 * El `codigo` lo genera el backend y no se envía en POST/PUT.
 */

/**
 * @typedef {Object} AdminHabilidadResponse
 * @property {number} idHabilidad
 * @property {string} codigo
 * @property {string} nombre
 * @property {string|null} descripcion
 */

/**
 * @typedef {Object} HabilidadRequest
 * @property {string} nombre obligatorio, máximo 255
 * @property {string|null} [descripcion] opcional, máximo 255
 */

const adminHabilidadesService = {
  /**
   * GET /admin/habilidades — listado administrativo.
   * Acepta búsqueda opcional por nombre. No tiene paginación.
   * @param {{nombre?: string}} [params]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: AdminHabilidadResponse[]}>} 200 OK
   */
  listar({ nombre = "" } = {}, signal) {
    const texto = String(nombre || "").trim();
    return http.get("/admin/habilidades", {
      params: texto ? { nombre: texto } : {},
      ...(signal ? { signal } : {}),
    });
  },

  /**
   * GET /admin/habilidades/{idHabilidad}
   * @param {number|string} idHabilidad
   * @returns {Promise<{data: AdminHabilidadResponse}>} 200 OK
   */
  obtener(idHabilidad) {
    return http.get(`/admin/habilidades/${idHabilidad}`);
  },

  /**
   * POST /admin/habilidades
   * @param {HabilidadRequest} request
   * @returns {Promise<{data: AdminHabilidadResponse}>} 201 Created
   */
  crear({ nombre, descripcion }) {
    return http.post("/admin/habilidades", { nombre, descripcion });
  },

  /**
   * PUT /admin/habilidades/{idHabilidad}
   * @param {number|string} idHabilidad
   * @param {HabilidadRequest} request
   * @returns {Promise<{data: AdminHabilidadResponse}>} 200 OK
   */
  actualizar(idHabilidad, { nombre, descripcion }) {
    return http.put(`/admin/habilidades/${idHabilidad}`, {
      nombre,
      descripcion,
    });
  },

  /**
   * DELETE /admin/habilidades/{idHabilidad}
   * Responde 409 si la habilidad está en uso por requerimientos.
   * @param {number|string} idHabilidad
   * @returns {Promise<{data: null}>} 204 No Content
   */
  eliminar(idHabilidad) {
    return http.delete(`/admin/habilidades/${idHabilidad}`);
  },
};

export default adminHabilidadesService;
