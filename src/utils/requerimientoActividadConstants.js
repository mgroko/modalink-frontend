/*
 * Reglas de requerimientos de actividad en proyectos confirmados (UC-50).
 * El backend calcula `protegido`; el frontend sólo decide la presentación.
 */

export const CODIGO_REQUERIMIENTO_CON_VINCULOS =
  "REQUERIMIENTO_CON_VINCULOS";

/**
 * @param {object|null|undefined} requerimiento
 * @returns {boolean}
 */
export function esRequerimientoProtegido(requerimiento) {
  return requerimiento?.protegido === true;
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
 * @returns {number|null}
 */
export function idRequerimientoConVinculos(error) {
  const id = Number(error?.response?.data?.idRequerimiento);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * @param {object} error error Axios
 * @returns {boolean}
 */
export function esErrorRequerimientoConVinculos(error) {
  return (
    codigoErrorRequerimiento(error) === CODIGO_REQUERIMIENTO_CON_VINCULOS
  );
}

export function mensajeProteccionRequerimiento() {
  return "Tiene postulaciones, invitaciones o asignaciones asociadas. No se puede modificar ni eliminar.";
}

/**
 * @param {number|string|null|undefined} idRequerimiento
 * @returns {string}
 */
export function mensajeErrorRequerimientoConVinculos(idRequerimiento) {
  const id = idRequerimiento != null ? ` ${idRequerimiento}` : "";
  return `No se puede modificar ni eliminar el requerimiento${id} porque tiene postulaciones, invitaciones o asignaciones asociadas.`;
}
