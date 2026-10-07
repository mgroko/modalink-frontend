import http from "./http";

let cacheProfesiones = null;

const perfilService = {
  listarMisPerfiles() {
    return http.get("/usuarios/me/perfiles");
  },

  crear(request) {
    return http.post("/perfiles", request);
  },

  obtener(idPerfil) {
    return http.get(`/perfiles/${idPerfil}`);
  },

  editar(idPerfil, request) {
    return http.put(`/perfiles/${idPerfil}`, request);
  },

  /**
   * Solicita la baja de un perfil (estado PendienteBaja).
   * @returns {Promise<{data: {mensaje: string, fechaLimite: string}}>} fechaLimite
   * calculada por el backend con el diasBaja vigente.
   */
  eliminar(idPerfil) {
    return http.delete(`/perfiles/${idPerfil}`);
  },

  /**
   * Reactiva un perfil en PendienteBaja.
   * Responde 409 si el plazo ya venció (el scheduler lo marcó como Baja).
   * @returns {Promise<{data: object}>} PerfilResponse con estado "Activo" y fechaLimite null
   */
  reactivar(idPerfil) {
    return http.post(`/perfiles/${idPerfil}/reactivar`);
  },

  activar(idPerfil) {
    return http.patch(`/perfiles/${idPerfil}/activar`, {});
  },

  subirFoto(idPerfil, archivo) {
    const formData = new FormData();
    formData.append("archivo", archivo);
    return http.post(`/perfiles/${idPerfil}/foto`, formData);
  },

  eliminarFoto(idPerfil) {
    return http.delete(`/perfiles/${idPerfil}/foto`);
  },

  listarProfesiones({ forzarRecarga = false } = {}) {
    if (cacheProfesiones && !forzarRecarga) {
      return Promise.resolve(cacheProfesiones);
    }
    return http.get("/profesiones").then((response) => {
      cacheProfesiones = response;
      return response;
    });
  },

  /**
   * GET /perfiles/buscar — todos los parámetros son opcionales y combinables.
   * Paginación: page (0-indexed, default 0), size (default 20), todos (default false).
   * Filtros: nombreArtistico, nombre, apellido,
   *   idProfesion (prioridad sobre profesion), profesion,
   *   idGenero (prioridad sobre genero), genero (código exacto, ej. "MUJER"),
   *   idUbicacion = ciudad.idCiudad (Long) — NO es ubicacion.idUbicacion,
   *   localidad (contains sobre ciudad.nombre, case-insensitive),
   *   provincia (contains sobre provincia.nombre, case-insensitive),
   *   idsHabilidades (array: idsHabilidades=1&idsHabilidades=3),
   *   idCaracteristica (requerido para valorCaracteristica / idValorCaracteristica),
   *   valorCaracteristica, idValorCaracteristica (prioridad sobre valorCaracteristica).
   * Respuesta: PaginaResponse { contenido, paginaActual, tamanoPagina,
   *   totalElementos, totalPaginas, primera, ultima }.
   * @param {object} params query params de la búsqueda
   * @param {AbortSignal} [signal] señal opcional para cancelar la petición
   */
  buscar(params, signal) {
    return http.get("/perfiles/buscar", { params, signal });
  },

  caracteristicasPorProfesion(idProfesion) {
    return http.get(`/profesiones/${idProfesion}/caracteristicas-tecnicas`);
  },
};

export default perfilService;
