import http from "./http";

/*
 * Contratos UC-19 (alta) y UC-22 (búsqueda en portfolio).
 * Tipos JSDoc puro: documentan el shape para el editor, sin tooling TS.
 */

/**
 * @typedef {Object} PublicacionAutorResponse
 * @property {number} idPerfil
 * @property {string} nombreArtistico
 * @property {string} profesion
 * @property {string|null} [fotoUrl]
 */

/**
 * @typedef {Object} PublicacionProyectoResponse
 * @property {number} idProyecto
 * @property {string} nombre
 * @property {boolean} puedeVerProyecto
 */

/**
 * @typedef {Object} PublicacionUbicacionResponse
 * @property {number} idCiudad
 * @property {string} idExterno
 * @property {string} fuenteApi
 * @property {string} nombre
 * @property {Object} provincia
 * @property {number} provincia.idProvincia
 * @property {string} provincia.idExterno
 * @property {string} provincia.nombre
 */

/**
 * @typedef {Object} PublicacionImagenResponse
 * @property {number} idImagen
 * @property {string} url
 * @property {number} orden
 */

/**
 * @typedef {Object} PublicacionResponse
 * @property {number} idPublicacion
 * @property {string} titulo
 * @property {string|null} descripcion
 * @property {string} fechaPublicacion
 * @property {"ACTIVA"|string} estado
 * @property {PublicacionAutorResponse} autor
 * @property {PublicacionProyectoResponse|null} proyecto
 * @property {PublicacionUbicacionResponse|null} ubicacion
 * @property {PublicacionImagenResponse[]} imagenes
 * @property {Array<object>} colaboradores
 * @property {number} cantidadMeGusta
 * @property {number} cantidadComentarios
 */

/**
 * @typedef {Object} CrearPublicacionRequest
 * @property {string} titulo
 * @property {string} [descripcion]
 * @property {number|string|null} [idProyecto]
 * @property {string|null} [localidadId]
 * @property {string|null} [provinciaId]
 * @property {File[]} archivos 1 a 10 imágenes
 */

/**
 * @typedef {Object} BuscarPublicacionesParams
 * @property {number} [page] base 0
 * @property {number} [size] 1 a 50
 * @property {string} [fechaDesde] YYYY-MM-DD
 * @property {string} [fechaHasta] YYYY-MM-DD
 * @property {number|string} [idProyecto]
 * @property {string} [titulo]
 * @property {string} [descripcion]
 */

const publicacionService = {
  /**
   * POST /publicaciones — UC-19.
   * Multipart con `archivos` repetido. El backend usa el perfil activo.
   *
   * Errores:
   * - 400 validación con `errores` por campo, o excepciones de archivo/
   *   procesamiento con sólo `message`
   * - 403 sin rol USUARIO
   * - 404 sin perfil activo / perfil o proyecto inexistente
   * - 409 proyecto no asociable o perfil en baja
   *
   * @param {CrearPublicacionRequest} request
   * @param {(porcentaje: number) => void} [onUploadProgress]
   * @returns {Promise<{data: PublicacionResponse}>} 201 Created
   */
  crear(request, onUploadProgress) {
    const formData = new FormData();
    formData.append("titulo", String(request?.titulo || "").trim());

    const descripcion = String(request?.descripcion || "").trim();
    if (descripcion) formData.append("descripcion", descripcion);

    if (request?.idProyecto != null && request.idProyecto !== "") {
      formData.append("idProyecto", String(request.idProyecto));
    }
    if (request?.localidadId) {
      formData.append("localidadId", String(request.localidadId));
    }
    if (request?.provinciaId) {
      formData.append("provinciaId", String(request.provinciaId));
    }

    for (const archivo of request?.archivos || []) {
      formData.append("archivos", archivo);
    }

    return http.post("/publicaciones", formData, {
      onUploadProgress: (evento) => {
        if (typeof onUploadProgress !== "function") return;
        if (!evento?.total) {
          onUploadProgress(0);
          return;
        }
        onUploadProgress(
          Math.min(100, Math.round((evento.loaded * 100) / evento.total))
        );
      },
    });
  },

  /**
   * GET /perfiles/{idPerfil}/publicaciones — UC-22.
   * Sólo devuelve publicaciones ACTIVA y aplica visibilidad de UC-14.
   *
   * @param {number|string} idPerfil
   * @param {BuscarPublicacionesParams} [params]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: {
   *   contenido: PublicacionResponse[],
   *   paginaActual: number,
   *   tamanoPagina: number,
   *   totalElementos: number,
   *   totalPaginas: number,
   *   primera: boolean,
   *   ultima: boolean
   * }}>} 200 OK
   */
  listarPorPerfil(idPerfil, params = {}, signal) {
    const query = {};
    if (params.page != null) query.page = params.page;
    if (params.size != null) query.size = params.size;
    if (params.fechaDesde) query.fechaDesde = params.fechaDesde;
    if (params.fechaHasta) query.fechaHasta = params.fechaHasta;
    if (params.idProyecto != null && params.idProyecto !== "") {
      query.idProyecto = params.idProyecto;
    }
    if (params.titulo) query.titulo = params.titulo;
    if (params.descripcion) query.descripcion = params.descripcion;

    return http.get(`/perfiles/${idPerfil}/publicaciones`, {
      params: query,
      signal,
    });
  },

  /**
   * GET /perfiles/{idPerfil}/publicaciones/proyectos
   * Proyectos distintos asociados a las publicaciones visibles del perfil.
   * Se usa para poblar el filtro "Proyecto" del portfolio.
   *
   * Contrato acordado: lista de `{ idProyecto, nombre }`. Se tolera también
   * una respuesta paginada con `contenido`.
   *
   * @param {number|string} idPerfil
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: Array<{idProyecto:number,nombre:string}>|{
   *   contenido: Array<{idProyecto:number,nombre:string}>
   * }}>} 200 OK
   */
  listarProyectosFiltro(idPerfil, signal) {
    return http.get(`/perfiles/${idPerfil}/publicaciones/proyectos`, {
      signal,
    });
  },
};

export default publicacionService;
