/*
 * Constantes, query params y normalización de publicaciones (UC-19/UC-22).
 * Funciones puras: la vista aporta el estado.
 */

export const LIMITES_PUBLICACION = {
  TITULO: 150,
  DESCRIPCION: 1000,
  COMENTARIO: 1000,
};

export const PUBLICACION_IMAGENES = {
  FORMATOS: ["image/jpeg", "image/png", "image/webp"],
  EXTENSIONES: ["jpg", "jpeg", "png", "webp"],
  MAX_BYTES: 10 * 1024 * 1024,
  MAX_IMAGENES: 10,
  MAX_LADO_PX: 8000,
  MAX_MEGAPIXELES: 24,
};

export const PUBLICACION_QUERY_KEYS = {
  PAGINA: "pubPagina",
  DESDE: "pubDesde",
  HASTA: "pubHasta",
  PROYECTO: "pubProyecto",
  TEXTO: "pubTexto",
  // Claves anteriores, se conservan para leer enlaces viejos.
  TITULO: "pubTitulo",
  DESCRIPCION: "pubDescripcion",
};

export function filtrosPublicacionVacios() {
  return {
    texto: "",
    fechaDesde: "",
    fechaHasta: "",
    idProyecto: null,
  };
}

export function hayFiltrosPublicacion(filtros = {}) {
  return !!(
    String(filtros.texto || "").trim() ||
    filtros.fechaDesde ||
    filtros.fechaHasta ||
    (filtros.idProyecto != null && filtros.idProyecto !== "")
  );
}

function textoQuery(valor) {
  return typeof valor === "string" ? valor : "";
}

/**
 * Lee filtros y página desde el query string de la ruta.
 * @param {Record<string, unknown>} [query]
 * @returns {{filtros: ReturnType<typeof filtrosPublicacionVacios>, pagina: number}}
 */
export function leerFiltrosPublicacionQuery(query = {}) {
  const pagina = Number.parseInt(query[PUBLICACION_QUERY_KEYS.PAGINA], 10);
  const idProyecto = Number.parseInt(
    query[PUBLICACION_QUERY_KEYS.PROYECTO],
    10
  );

  const texto =
    textoQuery(query[PUBLICACION_QUERY_KEYS.TEXTO]) ||
    [
      textoQuery(query[PUBLICACION_QUERY_KEYS.TITULO]),
      textoQuery(query[PUBLICACION_QUERY_KEYS.DESCRIPCION]),
    ]
      .filter(Boolean)
      .join(" ");

  return {
    filtros: {
      texto,
      fechaDesde: textoQuery(query[PUBLICACION_QUERY_KEYS.DESDE]),
      fechaHasta: textoQuery(query[PUBLICACION_QUERY_KEYS.HASTA]),
      idProyecto: Number.isFinite(idProyecto) ? idProyecto : null,
    },
    pagina:
      Number.isInteger(pagina) && pagina >= 0 ? pagina : 0,
  };
}

/**
 * Construye una copia del query actual con los filtros de publicaciones.
 * Conserva las claves ajenas (por ejemplo, las de la sección del perfil).
 * @param {Record<string, unknown>} [queryActual]
 * @param {ReturnType<typeof filtrosPublicacionVacios>} filtros
 * @param {number} pagina
 * @returns {Record<string, string>}
 */
export function construirQueryPublicaciones(
  queryActual = {},
  filtros = {},
  pagina = 0
) {
  const query = { ...queryActual };

  const texto = String(filtros.texto || "").trim();

  if (texto) query[PUBLICACION_QUERY_KEYS.TEXTO] = texto;
  else delete query[PUBLICACION_QUERY_KEYS.TEXTO];

  delete query[PUBLICACION_QUERY_KEYS.TITULO];
  delete query[PUBLICACION_QUERY_KEYS.DESCRIPCION];

  if (filtros.fechaDesde) query[PUBLICACION_QUERY_KEYS.DESDE] = filtros.fechaDesde;
  else delete query[PUBLICACION_QUERY_KEYS.DESDE];

  if (filtros.fechaHasta) query[PUBLICACION_QUERY_KEYS.HASTA] = filtros.fechaHasta;
  else delete query[PUBLICACION_QUERY_KEYS.HASTA];

  if (filtros.idProyecto != null && filtros.idProyecto !== "") {
    query[PUBLICACION_QUERY_KEYS.PROYECTO] = String(filtros.idProyecto);
  } else {
    delete query[PUBLICACION_QUERY_KEYS.PROYECTO];
  }

  if (pagina > 0) query[PUBLICACION_QUERY_KEYS.PAGINA] = String(pagina);
  else delete query[PUBLICACION_QUERY_KEYS.PAGINA];

  return query;
}

/**
 * Firma estable para comparar filtros + página y evitar navegaciones
 * o peticiones duplicadas.
 */
export function firmarFiltrosPublicacion(filtros = {}, pagina = 0) {
  return JSON.stringify({
    texto: String(filtros.texto || "").trim(),
    fechaDesde: filtros.fechaDesde || "",
    fechaHasta: filtros.fechaHasta || "",
    idProyecto:
      filtros.idProyecto != null && filtros.idProyecto !== ""
        ? String(filtros.idProyecto)
        : "",
    pagina: Number(pagina) || 0,
  });
}

/**
 * Valida los datos básicos del formulario de alta.
 * @param {{titulo?:string, descripcion?:string, archivos?:File[], ubicacion?:object|null}} form
 * @returns {Record<string,string>}
 */
export function validarFormularioPublicacion(
  form = {},
  totalImagenes = null
) {
  const errores = {};
  const titulo = String(form.titulo || "").trim();

  if (!titulo) {
    errores.titulo = "El título de la publicación es obligatorio.";
  } else if (titulo.length > LIMITES_PUBLICACION.TITULO) {
    errores.titulo = `El título no puede superar los ${LIMITES_PUBLICACION.TITULO} caracteres.`;
  }

  if (
    String(form.descripcion || "").length >
    LIMITES_PUBLICACION.DESCRIPCION
  ) {
    errores.descripcion = `La descripción no puede superar los ${LIMITES_PUBLICACION.DESCRIPCION} caracteres.`;
  }

  const archivos = Array.isArray(form.archivos) ? form.archivos : [];
  const cantidadImagenes =
    totalImagenes == null ? archivos.length : Number(totalImagenes) || 0;

  if (cantidadImagenes < 1) {
    errores.archivos =
      "Debés conservar o agregar al menos una imagen.";
  } else if (cantidadImagenes > PUBLICACION_IMAGENES.MAX_IMAGENES) {
    errores.archivos = `Podés tener hasta ${PUBLICACION_IMAGENES.MAX_IMAGENES} imágenes.`;
  }

  if (form.ubicacion?.provinciaId && !form.ubicacion?.localidadId) {
    errores.ubicacion = "Seleccioná una ciudad para la ubicación.";
  }

  return errores;
}

/**
 * Normaliza una publicación del backend para que la UI no dependa de nulos.
 * @param {object|null|undefined} publicacion
 * @returns {object|null}
 */
export const ACCIONES_BAJA_PUBLICACION = {
  DUENO: "dueno",
  COLABORADOR: "colaborador",
};

/**
 * @param {object|null|undefined} publicacion
 * @param {number|string|null|undefined} idPerfil
 * @returns {boolean}
 */
export function esDuenoPublicacion(publicacion, idPerfil) {
  const idAutor = publicacion?.autor?.idPerfil ?? null;
  return (
    idPerfil != null &&
    idAutor != null &&
    String(idPerfil) === String(idAutor)
  );
}

/**
 * @param {object|null|undefined} publicacion
 * @param {number|string|null|undefined} idPerfil
 * @returns {boolean}
 */
export function esColaboradorPublicacion(publicacion, idPerfil) {
  if (idPerfil == null) return false;
  const colaboradores = Array.isArray(publicacion?.colaboradores)
    ? publicacion.colaboradores
    : [];

  return colaboradores.some((colaborador) => {
    const id =
      typeof colaborador === "object" && colaborador !== null
        ? colaborador.idPerfil ?? colaborador.perfil?.idPerfil ?? null
        : colaborador;
    return id != null && String(id) === String(idPerfil);
  });
}

/**
 * Indica qué acción de baja corresponde al perfil activo.
 * @param {object|null|undefined} publicacion
 * @param {number|string|null|undefined} idPerfil
 * @returns {"dueno"|"colaborador"|null}
 */
export function accionBajaPublicacion(publicacion, idPerfil) {
  if (esDuenoPublicacion(publicacion, idPerfil)) {
    return ACCIONES_BAJA_PUBLICACION.DUENO;
  }
  if (esColaboradorPublicacion(publicacion, idPerfil)) {
    return ACCIONES_BAJA_PUBLICACION.COLABORADOR;
  }
  return null;
}

/**
 * @param {"dueno"|"colaborador"|null} accion
 * @returns {string}
 */
export function etiquetaAccionBaja(accion) {
  if (accion === ACCIONES_BAJA_PUBLICACION.DUENO) {
    return "Eliminar publicación";
  }
  if (accion === ACCIONES_BAJA_PUBLICACION.COLABORADOR) {
    return "Quitar de mi perfil";
  }
  return "";
}

export function normalizarPublicacion(publicacion) {
  if (!publicacion) return null;

  const imagenes = (Array.isArray(publicacion.imagenes)
    ? publicacion.imagenes
    : []
  )
    .filter((imagen) => imagen?.url)
    .map((imagen) => ({
      ...imagen,
      orden: Number(imagen.orden) || 0,
    }))
    .sort((a, b) => a.orden - b.orden);

  return {
    ...publicacion,
    titulo: String(publicacion.titulo || ""),
    descripcion: String(publicacion.descripcion || ""),
    fechaPublicacion: publicacion.fechaPublicacion || null,
    autor: publicacion.autor || null,
    proyecto: publicacion.proyecto || null,
    ubicacion: publicacion.ubicacion || null,
    imagenes,
    colaboradores: Array.isArray(publicacion.colaboradores)
      ? publicacion.colaboradores
      : [],
    cantidadMeGusta: Number(publicacion.cantidadMeGusta) || 0,
    cantidadComentarios: Number(publicacion.cantidadComentarios) || 0,
    meGusta: publicacion.meGusta === true,
  };
}

/**
 * Valida el texto de un comentario antes de enviarlo.
 * El backend también valida; esto evita requests innecesarias.
 * @param {string|null|undefined} texto
 * @returns {boolean}
 */
export function textoComentarioValido(texto) {
  const limpio = String(texto || "").trim();
  return (
    limpio.length > 0 &&
    limpio.length <= LIMITES_PUBLICACION.COMENTARIO
  );
}

/**
 * Normaliza un comentario para que la UI no dependa de nulos.
 * @param {object|null|undefined} comentario
 * @returns {object|null}
 */
export function normalizarComentario(comentario) {
  if (!comentario) return null;

  const idComentario = Number(comentario.idComentario);
  if (!Number.isFinite(idComentario)) return null;

  return {
    ...comentario,
    idComentario,
    idPublicacion: Number(comentario.idPublicacion) || null,
    autor: comentario.autor || null,
    texto: String(comentario.texto || ""),
    fechaComentario: comentario.fechaComentario || null,
  };
}

/**
 * Normaliza la respuesta paginada de comentarios.
 * @param {object|null|undefined} data
 * @returns {{
 *   contenido: object[],
 *   paginaActual: number,
 *   tamanoPagina: number,
 *   totalElementos: number,
 *   totalPaginas: number,
 *   primera: boolean,
 *   ultima: boolean
 * }}
 */
export function normalizarPaginaComentarios(data) {
  const contenido = (Array.isArray(data?.contenido) ? data.contenido : [])
    .map(normalizarComentario)
    .filter(Boolean);

  return {
    contenido,
    paginaActual: Number(data?.paginaActual) || 0,
    tamanoPagina: Number(data?.tamanoPagina) || contenido.length || 10,
    totalElementos: Number(data?.totalElementos) || contenido.length,
    totalPaginas: Number(data?.totalPaginas) || 0,
    primera: data?.primera !== false,
    ultima: data?.ultima !== false,
  };
}

/**
 * Fusiona comentarios sin duplicar por idComentario.
 * Respeta el orden en que llegan (el backend ya devuelve ASC) y no reordena
 * el listado en el frontend.
 * @param {object[]} existentes
 * @param {object[]} nuevos
 * @returns {object[]}
 */
export function fusionarComentarios(existentes = [], nuevos = []) {
  const resultado = [];
  const posicionPorId = new Map();

  for (const comentario of [...existentes, ...nuevos]) {
    const normalizado = normalizarComentario(comentario);
    if (!normalizado) continue;

    const posicion = posicionPorId.get(normalizado.idComentario);
    if (posicion == null) {
      posicionPorId.set(normalizado.idComentario, resultado.length);
      resultado.push(normalizado);
    } else {
      resultado[posicion] = normalizado;
    }
  }

  return resultado;
}

/**
 * Indica si el comentario pertenece al perfil activo.
 * @param {object|null|undefined} comentario
 * @param {number|string|null|undefined} idPerfil
 * @returns {boolean}
 */
export function esComentarioPropio(comentario, idPerfil) {
  const idAutor = comentario?.autor?.idPerfil ?? null;
  return (
    idPerfil != null &&
    idAutor != null &&
    String(idPerfil) === String(idAutor)
  );
}

/**
 * Normaliza una opción del filtro de proyecto.
 * @param {object|null|undefined} proyecto
 * @returns {{idProyecto:number|string, nombre:string}|null}
 */
export function normalizarProyectoFiltro(proyecto) {
  if (!proyecto) return null;
  const idOriginal =
    proyecto.idProyecto ?? proyecto.id ?? proyecto.value ?? null;
  if (idOriginal == null || idOriginal === "") return null;

  const idNumerico = Number(idOriginal);
  const idProyecto = Number.isFinite(idNumerico) ? idNumerico : idOriginal;

  return {
    idProyecto,
    nombre:
      proyecto.nombre ||
      proyecto.titulo ||
      proyecto.text ||
      `Proyecto ${idProyecto}`,
  };
}
