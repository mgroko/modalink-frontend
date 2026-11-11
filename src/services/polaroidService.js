import http from "./http";

/*
 * Contratos de polaroids de perfil (UC-10/11/14):
 * catálogo fijo, listado por perfil, alta, modificación, reordenamiento y baja.
 */

let cacheTipos = null;

const polaroidService = {
  /**
   * GET /polaroids/tipos — catálogo agrupado por tipo de plano.
   * @param {AbortSignal} [signal]
   */
  listarTipos(signal) {
    if (cacheTipos) return Promise.resolve(cacheTipos);
    return http.get("/polaroids/tipos", { signal }).then((response) => {
      cacheTipos = response;
      return response;
    });
  },

  /**
   * GET /perfiles/{idPerfil}/polaroids
   * @param {number|string} idPerfil
   * @param {AbortSignal} [signal]
   */
  listar(idPerfil, signal) {
    return http.get(`/perfiles/${idPerfil}/polaroids`, { signal });
  },

  /**
   * POST /perfiles/{idPerfil}/polaroids — multipart.
   * @param {number|string} idPerfil
   * @param {{archivo: File, idTipoPolaroid: number|string}} request
   */
  crear(idPerfil, { archivo, idTipoPolaroid }) {
    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("idTipoPolaroid", String(idTipoPolaroid));
    return http.post(`/perfiles/${idPerfil}/polaroids`, formData);
  },

  /**
   * PUT /perfiles/{idPerfil}/polaroids/{idPolaroid} — multipart.
   * Debe enviarse al menos uno de los dos campos.
   * @param {number|string} idPerfil
   * @param {number|string} idPolaroid
   * @param {{archivo?: File|null, idTipoPolaroid?: number|string|null}} request
   */
  modificar(idPerfil, idPolaroid, { archivo, idTipoPolaroid } = {}) {
    const formData = new FormData();
    if (archivo) formData.append("archivo", archivo);
    if (idTipoPolaroid != null && idTipoPolaroid !== "") {
      formData.append("idTipoPolaroid", String(idTipoPolaroid));
    }
    return http.put(
      `/perfiles/${idPerfil}/polaroids/${idPolaroid}`,
      formData
    );
  },

  /**
   * PUT /perfiles/{idPerfil}/polaroids/orden
   * @param {number|string} idPerfil
   * @param {Array<number|string>} idsPolaroid
   */
  reordenar(idPerfil, idsPolaroid) {
    return http.put(`/perfiles/${idPerfil}/polaroids/orden`, {
      idsPolaroid,
    });
  },

  /**
   * DELETE /perfiles/{idPerfil}/polaroids/{idPolaroid}
   * @param {number|string} idPerfil
   * @param {number|string} idPolaroid
   */
  eliminar(idPerfil, idPolaroid) {
    return http.delete(`/perfiles/${idPerfil}/polaroids/${idPolaroid}`);
  },
};

export default polaroidService;
