/*
 * Constantes, query params y normalización de publicaciones (UC-19/UC-22).
 * Funciones puras: la vista aporta el estado.
 */

export const LIMITES_PUBLICACION = {
  TITULO: 150,
  DESCRIPCION: 1000,
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
  TITULO: "pubTitulo",
  DESCRIPCION: "pubDescripcion",
};

export function filtrosPublicacionVacios() {
  return {
    titulo: "",
    descripcion: "",
    fechaDesde: "",
    fechaHasta: "",
    idProyecto: null,
  };
}

export function hayFiltrosPublicacion(filtros = {}) {
  return !!(
    String(filtros.titulo || "").trim() ||
    String(filtros.descripcion || "").trim() ||
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

  return {
    filtros: {
      titulo: textoQuery(query[PUBLICACION_QUERY_KEYS.TITULO]),
      descripcion: textoQuery(query[PUBLICACION_QUERY_KEYS.DESCRIPCION]),
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

  const titulo = String(filtros.titulo || "").trim();
  const descripcion = String(filtros.descripcion || "").trim();

  if (titulo) query[PUBLICACION_QUERY_KEYS.TITULO] = titulo;
  else delete query[PUBLICACION_QUERY_KEYS.TITULO];

  if (descripcion) query[PUBLICACION_QUERY_KEYS.DESCRIPCION] = descripcion;
  else delete query[PUBLICACION_QUERY_KEYS.DESCRIPCION];

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
    titulo: String(filtros.titulo || "").trim(),
    descripcion: String(filtros.descripcion || "").trim(),
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
  };
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
