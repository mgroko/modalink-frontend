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
 * Relación entre el perfil activo y el perfil consultado (UC-43).
 * @typedef {"NINGUNA"|"SOLICITUD_ENVIADA"|"SOLICITUD_RECIBIDA"|"CONECTADO"} EstadoConexion
 */

/**
 * Términos y condiciones vigentes de un perfil (UC-23).
 * `GET /perfiles/{idPerfil}` incluye siempre este objeto; si el perfil no
 * configuró una versión, llega la plantilla base con idTyc y fechas en null.
 * @typedef {Object} TerminosCondicionesResponse
 * @property {number} idPerfil
 * @property {number|null} idTyc
 * @property {string} descripcion
 * @property {string|null} fechaInicio ISO-8601 local
 * @property {string|null} fechaFin
 * @property {boolean} esPlantilla
 */

/**
 * @typedef {Object} ActualizarTerminosCondicionesRequest
 * @property {string} descripcion obligatoria, no vacía, máximo 5000.
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
 * @property {TerminosCondicionesResponse} terminosCondiciones UC-23. Siempre
 *           viene como objeto; nunca null.
 * @property {EstadoConexion} estadoConexion UC-43. Para el perfil propio
 *           siempre llega "NINGUNA".
 * @property {number|null} idSolicitudConexion ID de la solicitud pendiente,
 *           cuando corresponde.
 * @property {number|null} idConexion ID de la conexión vigente, cuando
 *           corresponde.
 * @property {boolean} enLinea presencia del perfil consultado (extensión
 *           de Mi red).
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
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: PerfilDetalleResponse}>}
   */
  obtener(idPerfil, signal) {
    return http.get(`/perfiles/${idPerfil}`, { signal });
  },

  /**
   * GET /perfiles/{idPerfil}/terminos-condiciones — UC-23.
   * Devuelve la versión vigente o la plantilla base.
   *
   * Acceso: usuario autenticado con rol USUARIO sobre un perfil Activo (200).
   * Perfil PendienteBaja/Baja o dueño inactivo: 404. Administrador: 403.
   * @param {number|string} idPerfil
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: TerminosCondicionesResponse}>} 200 OK
   */
  obtenerTerminos(idPerfil, signal) {
    return http.get(`/perfiles/${idPerfil}/terminos-condiciones`, { signal });
  },

  /**
   * PUT /perfiles/{idPerfil}/terminos-condiciones — UC-23.
   * Crea una versión nueva o persiste la plantilla por primera vez.
   *
   * Reglas:
   * - `descripcion` obligatoria, no vacía, máximo 5000. El backend recorta
   *   espacios al inicio/fin; conviene enviarla ya recortada.
   * - Si ya hay versión vigente y el texto es igual (sin espacios al
   *   inicio/fin), no se crea una versión nueva.
   * - Sólo perfiles Activo: el resto responde 409 con un mensaje genérico,
   *   sin código ni versión vigente.
   * - Perfil ajeno o inexistente: 404.
   *
   * Errores:
   * - 400 `{ message: "Validación fallida", errores: { descripcion } }`
   * - 401 sesión vencida (lo maneja http.js)
   * - 403 el perfil no pertenece al usuario
   * - 404 perfil inexistente o no visible
   * - 409 perfil no activo
   * @param {number|string} idPerfil
   * @param {ActualizarTerminosCondicionesRequest} request
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: TerminosCondicionesResponse}>} 200 OK
   */
  actualizarTerminos(idPerfil, { descripcion }, signal) {
    return http.put(
      `/perfiles/${idPerfil}/terminos-condiciones`,
      { descripcion },
      { signal }
    );
  },

  editar(idPerfil, request) {
    return http.put(`/perfiles/${idPerfil}`, request);
  },

  /**
   * Solicita la baja de un perfil (estado PendienteBaja).
   * @returns {Promise<{data: {mensaje: string, fechaLimite: string}}>} fechaLimite
   * calculada por el sistema con el diasBaja vigente.
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

  /**
   * GET /perfiles/{idPerfil}/habilidades — UC-47.
   * Solo el dueño del perfil puede consultar y gestionar sus habilidades.
   * @param {number|string} idPerfil
   * @returns {Promise<{data: import("./habilidadService.js").HabilidadResponse[]}>}
   *          200 OK
   */
  listarHabilidades(idPerfil) {
    return http.get(`/perfiles/${idPerfil}/habilidades`);
  },

  /**
   * POST /perfiles/{idPerfil}/habilidades — UC-47.
   * Asocia una habilidad existente al perfil. No se envían nombres.
   *
   * Errores:
   * - 400 idHabilidad ausente o inválido
   * - 403 el perfil no pertenece al usuario
   * - 404 perfil o habilidad inexistente
   * - 409 habilidad ya asociada o perfil en estado Baja
   * @param {number|string} idPerfil
   * @param {number|string} idHabilidad
   * @returns {Promise<{data: import("./habilidadService.js").HabilidadResponse}>}
   *          201 Created
   */
  agregarHabilidad(idPerfil, idHabilidad) {
    return http.post(`/perfiles/${idPerfil}/habilidades`, { idHabilidad });
  },

  /**
   * DELETE /perfiles/{idPerfil}/habilidades/{idHabilidad} — UC-47.
   * Quita una habilidad del perfil. No emite notificaciones.
   *
   * Errores:
   * - 403 el perfil no pertenece al usuario
   * - 404 perfil o habilidad inexistente
   * - 409 la habilidad no está asociada al perfil o el perfil está en Baja
   * @param {number|string} idPerfil
   * @param {number|string} idHabilidad
   * @returns {Promise<{data: null}>} 204 No Content
   */
  quitarHabilidad(idPerfil, idHabilidad) {
    return http.delete(`/perfiles/${idPerfil}/habilidades/${idHabilidad}`);
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
