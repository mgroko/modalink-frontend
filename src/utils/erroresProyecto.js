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
 *           "generico"} tipo
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
    if (/fecha/i.test(mensaje)) {
      return { tipo: "campo", campo: "fechaFinEstipulada", mensaje };
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
    return { tipo: "duplicado", campo: "nombre", mensaje };
  }

  return null;
}
