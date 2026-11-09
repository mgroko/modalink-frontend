import http from "./http";

/*
 * Administración del catálogo de tipos de contrato (UC-76).
 *
 * El código se genera automáticamente en el backend y no se envía en el
 * alta ni en la modificación. La plantilla se valida antes de guardar.
 */

/**
 * @typedef {Object} AdminTipoContratoResumen
 * @property {number} idTipoAcuerdo
 * @property {string} codigo
 * @property {string} nombre
 * @property {string|null} descripcion
 * @property {boolean} activo
 * @property {number} contratosAsociados
 * @property {number} contratosVivos
 * @property {number} contratosPendientes
 * @property {boolean} puedeEditar
 * @property {boolean} puedeDesactivar
 * @property {boolean} puedeEliminar
 * @property {string|null} motivoNoEditable
 * @property {string|null} motivoNoDesactivable
 * @property {string|null} motivoNoEliminable
 */

/**
 * @typedef {Object} AdminTipoContratoDetalle
 * @property {number} idTipoAcuerdo
 * @property {string} codigo
 * @property {string} nombre
 * @property {string|null} descripcion
 * @property {string|null} plantilla
 * @property {boolean} activo
 * @property {number} contratosAsociados
 * @property {number} contratosVivos
 * @property {number} contratosPendientes
 * @property {boolean} puedeEditar
 * @property {boolean} puedeDesactivar
 * @property {boolean} puedeEliminar
 * @property {string|null} motivoNoEditable
 * @property {string|null} motivoNoDesactivable
 * @property {string|null} motivoNoEliminable
 */

/**
 * @typedef {Object} AdminTipoContratoRequest
 * @property {string} nombre obligatorio, máximo 100
 * @property {string|null} [descripcion] opcional, máximo 200
 * @property {string} plantilla obligatoria, máximo 100.000
 * @property {boolean} [activo] solo en el alta
 */

/**
 * @typedef {Object} ValidacionPlantilla
 * @property {boolean} valido
 * @property {number} longitud
 * @property {string[]} placeholdersDesconocidos
 * @property {string[]} placeholdersConFormatoInvalido
 * @property {string[]} advertencias
 * @property {boolean} tieneClausulasAdicionales
 */

const adminTiposContratoService = {
  /**
   * GET /admin/tipos-contrato
   * @param {{nombre?: string, incluirInactivos?: boolean}} [params]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: AdminTipoContratoResumen[]}>} 200 OK
   */
  listar({ nombre = "", incluirInactivos = true } = {}, signal) {
    const texto = String(nombre || "").trim();
    return http.get("/admin/tipos-contrato", {
      params: {
        ...(texto ? { nombre: texto } : {}),
        incluirInactivos,
      },
      ...(signal ? { signal } : {}),
    });
  },

  /**
   * GET /admin/tipos-contrato/{id}
   * @param {number|string} idTipoAcuerdo
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: AdminTipoContratoDetalle}>} 200 OK
   */
  obtener(idTipoAcuerdo, signal) {
    return http.get(`/admin/tipos-contrato/${idTipoAcuerdo}`, {
      ...(signal ? { signal } : {}),
    });
  },

  /**
   * POST /admin/tipos-contrato
   * @param {AdminTipoContratoRequest} request
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: AdminTipoContratoDetalle}>} 201 Created
   */
  crear({ nombre, descripcion, plantilla, activo }, signal) {
    return http.post(
      "/admin/tipos-contrato",
      { nombre, descripcion, plantilla, activo },
      { ...(signal ? { signal } : {}) }
    );
  },

  /**
   * PUT /admin/tipos-contrato/{id}
   * @param {number|string} idTipoAcuerdo
   * @param {{nombre: string, descripcion?: string|null, plantilla: string}} request
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: AdminTipoContratoDetalle}>} 200 OK
   */
  actualizar(idTipoAcuerdo, { nombre, descripcion, plantilla }, signal) {
    return http.put(
      `/admin/tipos-contrato/${idTipoAcuerdo}`,
      { nombre, descripcion, plantilla },
      { ...(signal ? { signal } : {}) }
    );
  },

  /**
   * PATCH /admin/tipos-contrato/{id}/estado
   * @param {number|string} idTipoAcuerdo
   * @param {boolean} activo
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: AdminTipoContratoDetalle}>} 200 OK
   */
  cambiarEstado(idTipoAcuerdo, activo, signal) {
    return http.patch(
      `/admin/tipos-contrato/${idTipoAcuerdo}/estado`,
      { activo },
      { ...(signal ? { signal } : {}) }
    );
  },

  /**
   * DELETE /admin/tipos-contrato/{id}
   * Responde 409 si el tipo tiene contratos asociados o es el último activo.
   * @param {number|string} idTipoAcuerdo
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: null}>} 204 No Content
   */
  eliminar(idTipoAcuerdo, signal) {
    return http.delete(`/admin/tipos-contrato/${idTipoAcuerdo}`, {
      ...(signal ? { signal } : {}),
    });
  },

  /**
   * POST /admin/tipos-contrato/validar-plantilla
   * @param {string} plantilla
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ValidacionPlantilla}>} 200 OK
   */
  validarPlantilla(plantilla, signal) {
    return http.post(
      "/admin/tipos-contrato/validar-plantilla",
      { plantilla },
      { ...(signal ? { signal } : {}) }
    );
  },
};

export default adminTiposContratoService;
