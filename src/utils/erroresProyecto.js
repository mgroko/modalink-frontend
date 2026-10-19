/*
 * Clasificación de errores del endpoint POST /proyectos (matriz UC-24 §5).
 * El backend sólo envía { message, httpStatus, timestamp } (o { errores } en
 * MethodArgumentNotValidException): no incluye el nombre de la excepción, así
 * que la clasificación por palabra clave sobre `message` es una heurística
 * conservadora — ante la duda se devuelve "generico"/null y la vista usa un
 * mensaje seguro.
 */

/**
 * @typedef {Object} ErrorProyectoClasificado
 * @property {"campos"|"campo"|"seccion"|"duplicado"|"perfil-activo"|
 *           "perfil-no-encontrado"|"perfil-baja"|"habilidad"|"profesion"|
 *           "informacion-basica"|"requerimiento-satisfecho"|
 *           "estado-inmutable"|"estado-no-cancelable"|"generico"} tipo
 * @property {object} [errores] body.errores original (sólo tipo "campos")
 * @property {string} [campo] campo a resaltar (sólo tipo "campo")
 * @property {string} [mensaje] message del backend
 */

/**
 * @param {object} error error Axios
 * @returns {ErrorProyectoClasificado|null} null = dejar que mensajeErrorApi
 *          maneje el error (sesión, CSRF, permisos, 500, etc.)
 */
export function clasificarErrorProyecto(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const mensaje = data?.message || "";

  if (status === 400) {
    if (data?.errores && Object.keys(data.errores).length > 0) {
      return { tipo: "campos", errores: data.errores };
    }
    // El mensaje de información básica enumera faltantes (puede contener
    // "ubicación", "fecha" o "requerimiento"): va antes que esos matches.
    if (/informaci[oó]n b[áa]sica incompleta/i.test(mensaje)) {
      return { tipo: "informacion-basica", mensaje };
    }
    if (/ubicaci[oó]n es obligatoria/i.test(mensaje)) {
      return { tipo: "campo", campo: "ubicacion", mensaje };
    }
    if (/fecha/i.test(mensaje)) {
      return { tipo: "campo", campo: "fechaEntregaEstipulada", mensaje };
    }
    if (/requerimiento|caracter|rango|numer|enumer|cantidad|habilidad|valores/i.test(mensaje)) {
      return { tipo: "seccion", seccion: "requerimientosGral", mensaje };
    }
    return { tipo: "generico", mensaje };
  }

  if (status === 403) {
    if (/perfil/i.test(mensaje)) {
      return { tipo: "perfil-baja", mensaje };
    }
    return null;
  }

  if (status === 404) {
    if (/perfil\s*activo/i.test(mensaje)) {
      return { tipo: "perfil-activo", mensaje };
    }
    if (/habilidad/i.test(mensaje)) {
      return { tipo: "habilidad", mensaje };
    }
    if (/profesi/i.test(mensaje)) {
      return { tipo: "profesion", mensaje };
    }
    if (/perfil/i.test(mensaje)) {
      return { tipo: "perfil-no-encontrado", mensaje };
    }
    return null;
  }

  if (status === 409) {
    // UC-36: estados inmutables y requerimientos con postulaciones aceptadas.
    // UC-35: estado no cancelable ("Estado actual: ...").
    // El 409 de creación sigue siendo unicidad de nombre.
    if (/postulaciones aceptadas|requerimiento .*satisfech|satisfecho/i.test(mensaje)) {
      return { tipo: "requerimiento-satisfecho", mensaje };
    }
    if (/cancelar.*publicado o confirmado|estado actual/i.test(mensaje)) {
      return { tipo: "estado-no-cancelable", mensaje };
    }
    if (/no se puede modificar un proyecto en estado/i.test(mensaje)) {
      return { tipo: "estado-inmutable", mensaje };
    }
    return { tipo: "duplicado", campo: "nombre", mensaje };
  }

  return null;
}

/**
 * @typedef {Object} ErrorImagenesMoodboardClasificado
 * @property {"limite"|"formato"|"vacio"|"tamano-peticion"|"dimensiones"|
 *           "permiso"|"proyecto-no-encontrado"|"perfil-activo"|
 *           "generico"} tipo
 * @property {string} [mensaje] message del backend
 */

/*
 * Clasificación de errores de POST /proyectos/{id}/moodboard/imagenes
 * (matriz UC-24 §7.4). Misma heurística conservadora que
 * clasificarErrorProyecto: el backend sólo envía { message }, sin el nombre
 * de la excepción, así que se clasifica por palabras clave del mensaje y
 * ante la duda se devuelve "generico".
 */
export function clasificarErrorImagenesMoodboard(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const mensaje = data?.message || "";

  if (status === 400) {
    // El orden importa: "110 MB" contiene el substring "10 MB", así que el
    // límite de la petición se chequea antes que el formato/peso por archivo.
    if (/dimensi|8000|megap[ií]xel|p[ií]xel/i.test(mensaje)) {
      return { tipo: "dimensiones", mensaje };
    }
    if (/110|tama[ñn]o (?:m[áa]ximo de la )?petici[óo]n|demasiado grande/i.test(mensaje)) {
      return { tipo: "tamano-peticion", mensaje };
    }
    if (/formato|jpg|jpeg|png|webp|10\s*MB|contenido/i.test(mensaje)) {
      return { tipo: "formato", mensaje };
    }
    if (/vac[ií]o|sin archivos|no (?:se )?(?:recibieron|enviaron)/i.test(mensaje)) {
      return { tipo: "vacio", mensaje };
    }
    if (/l[íi]mite|excedid|10 (?:im[áa]genes|archivos)|m[áa]ximo de 10/i.test(mensaje)) {
      return { tipo: "limite", mensaje };
    }
    return { tipo: "generico", mensaje };
  }

  if (status === 403) {
    return { tipo: "permiso", mensaje };
  }

  if (status === 404) {
    if (/perfil\s*activo/i.test(mensaje)) {
      return { tipo: "perfil-activo", mensaje };
    }
    if (/proyecto/i.test(mensaje)) {
      return { tipo: "proyecto-no-encontrado", mensaje };
    }
    return null;
  }

  return null;
}
