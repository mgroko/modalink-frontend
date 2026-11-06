/*
 * Reglas de protección de requerimientos generales del proyecto
 * (docs/backend/ficha-tecnica-modificar-proyecto-confirmado.md).
 * El backend calcula `protegido`; el frontend sólo decide la presentación
 * y qué requerimientos viajan en el PUT.
 */

export const CODIGO_REQUERIMIENTO_CON_VINCULOS =
  "REQUERIMIENTO_CON_VINCULOS";

/**
 * Un requerimiento está protegido cuando el backend lo marca con
 * `protegido === true`. Si el campo no viene (respuesta vieja o transitoria)
 * se usa `satisfecho` como respaldo para no habilitar una edición que el
 * backend rechazaría.
 * @param {object|null|undefined} requerimiento
 * @returns {boolean}
 */
export function esRequerimientoProtegido(requerimiento) {
  if (!requerimiento) return false;
  if (requerimiento.protegido === true) return true;
  return requerimiento.protegido == null && requerimiento.satisfecho === true;
}

/**
 * @param {object} error error Axios
 * @returns {string}
 */
export function codigoErrorRequerimiento(error) {
  const codigo = error?.response?.data?.codigo;
  return codigo ? String(codigo) : "";
}

/**
 * @param {object} error error Axios
 * @returns {boolean}
 */
export function esErrorRequerimientoVinculos(error) {
  return codigoErrorRequerimiento(error) === CODIGO_REQUERIMIENTO_CON_VINCULOS;
}

/**
 * El contrato nuevo usa `idRequerimientoGral`; se acepta `idRequerimiento`
 * por compatibilidad con el shape de requerimientos de actividad.
 * @param {object} error error Axios
 * @returns {number|null}
 */
export function idRequerimientoGralConflicto(error) {
  const data = error?.response?.data;
  const id = Number(data?.idRequerimientoGral ?? data?.idRequerimiento);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Texto corto para el badge del requerimiento bloqueado.
 * @param {object|null|undefined} requerimiento
 * @returns {string}
 */
export function etiquetaProteccionRequerimiento(requerimiento) {
  if (!esRequerimientoProtegido(requerimiento)) return "";
  return "Protegido";
}

/**
 * Explica por qué el requerimiento está bloqueado, usando los datos del
 * backend (`satisfecho`, `cubiertos`, `cantidad`) sin recalcular nada.
 * @param {object|null|undefined} requerimiento
 * @returns {string}
 */
export function mensajeProteccionRequerimiento(requerimiento) {
  if (!esRequerimientoProtegido(requerimiento)) return "";

  if (requerimiento?.satisfecho === true) {
    return "Tiene el cupo completo: no se puede editar ni eliminar.";
  }

  const cantidad = Number(requerimiento?.cantidad);
  const cubiertos = Number(requerimiento?.cubiertos);
  if (
    Number.isFinite(cantidad) &&
    Number.isFinite(cubiertos) &&
    cubiertos > 0
  ) {
    const personas = cantidad === 1 ? "persona vinculada" : "personas vinculadas";
    return `Tiene ${cubiertos} de ${cantidad} ${personas}: no se puede editar ni eliminar.`;
  }

  return "Tiene personal vinculado, postulaciones o invitaciones pendientes o aceptadas: no se puede editar ni eliminar.";
}

/**
 * Mensaje del 409 `REQUERIMIENTO_CON_VINCULOS`.
 * @param {number|string|null|undefined} idRequerimiento
 * @returns {string}
 */
export function mensajeErrorRequerimientoVinculos(idRequerimiento) {
  const id = idRequerimiento != null ? ` ${idRequerimiento}` : "";
  return `No se puede modificar ni eliminar el requerimiento${id} porque tiene cupo cubierto, miembros vinculados o postulaciones/invitaciones pendientes o aceptadas.`;
}
