import http from "./http";

/*
 * Contrato JSON de GET /perfiles/{idPerfil} (ficha UC-14 §3).
 * Tipos JSDoc puro: documentan el shape para el editor, sin tooling TS.
 */

/**
 * @typedef {Object} PaisResponse
 * @property {number} idPais
 * @property {string} idExterno
 * @property {string} fuenteApi
 * @property {string} nombre
 */

/**
 * @typedef {Object} ProvinciaResponse
 * @property {number} idProvincia
 * @property {string} idExterno
 * @property {string} fuenteApi
 * @property {string} nombre
 * @property {PaisResponse} pais
 */

/**
 * @typedef {Object} CiudadResponse
 * @property {number} idCiudad
 * @property {string} idExterno
 * @property {string} fuenteApi
 * @property {string} nombre
 * @property {ProvinciaResponse} provincia
 */

/**
 * @typedef {Object} CaracteristicaResponse
 * @property {number} idCaracteristica
 * @property {string} codigo ej. "ALTURA", "COLOR_OJOS"
 * @property {string|null} valor texto libre; null si el valor es predefinido
 * @property {number|null} idValor id del valor predefinido; null si es texto libre
 * @property {string|null} codigoValor etiqueta visible del valor predefinido (campo
 *           etiqueta de BD, no un código corto); null si es texto libre
 * @property {string|null} colorHex color en formato #RRGGBB; null si no aplica
 */

/**
 * @typedef {"Activo"|"PendienteBaja"|"Deshabilitado"|"Baja"} EstadoPerfil
 *   Solo "Baja" es inaccesible desde esta vista (404).
 */

/**
 * @typedef {Object} PerfilDetalleResponse
 * @property {number} idPerfil
 * @property {string} nombreArtistico
 * @property {string} biografia
 * @property {EstadoPerfil} estado
 * @property {string|null} fechaSolicitudBaja ISO 8601 si estado === "PendienteBaja";
 *           null en caso contrario
 * @property {number} idProfesion
 * @property {string} profesion
 * @property {number|null} idImagen
 * @property {string|null} fotoUrl ruta relativa p. ej. "/uploads/perfiles/foto.jpg"
 *           (resolver con resolverFotoUrl de utils/fotos.js)
 * @property {number} idUsuario
 * @property {string} nombreUsuario
 * @property {string} apellidoUsuario
 * @property {string|null} genero
 * @property {CiudadResponse|null} ciudad null si no hay ubicación registrada;
 *           no existen campos planos localidad/provincia
 * @property {string[]} habilidades
 * @property {CaracteristicaResponse[]} caracteristicas
 * @property {boolean} esPropietario true solo si el perfil pertenece al
 *           usuario autenticado (define los CTAs de la vista)
 */

let cacheProfesiones = null;

const perfilService = {
  listarMisPerfiles() {
    return http.get("/usuarios/me/perfiles");
  },

  crear(request) {
    return http.post("/perfiles", request);
  },

  /**
   * GET /perfiles/{idPerfil} — detalle completo del perfil (UC-14).
   * Acceso (VerPerfilService): 401 si la sesión/cuenta no permite acceso;
   * 404 si el perfil no existe o el estado/propiedad no permite verlo.
   * @param {number} idPerfil
   * @returns {Promise<{data: PerfilDetalleResponse}>}
   */
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
