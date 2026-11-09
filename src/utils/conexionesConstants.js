import { mensajeErrorApi } from "./apiError";

/*
 * Constantes y errores de la red de contactos (UC-44 / UC-44 bis).
 */

export const ESTADOS_PRESENCIA = Object.freeze({
  EN_LINEA: "EN_LINEA",
  DESCONECTADO: "DESCONECTADO",
});

export const OPCIONES_PRESENCIA = Object.freeze([
  { value: "", text: "Todos" },
  { value: ESTADOS_PRESENCIA.EN_LINEA, text: "En línea" },
  { value: ESTADOS_PRESENCIA.DESCONECTADO, text: "Desconectados" },
]);

export const CODIGOS_ERROR_CONEXIONES = Object.freeze({
  CONEXION_NO_ACTIVA: "CONEXION_NO_ACTIVA",
});

/**
 * @param {boolean} enLinea
 * @returns {string}
 */
export function etiquetaPresencia(enLinea) {
  return enLinea ? "En línea" : "Desconectado";
}

/**
 * Mensaje de error para el listado de conexiones.
 * @param {unknown} error
 * @returns {string}
 */
export function mensajeErrorConexiones(error) {
  const status = error?.response?.status;
  const mensaje = error?.response?.data?.message;

  if (status === 400) {
    return mensaje || "Revisá los filtros e intentá nuevamente.";
  }

  if (status === 404) {
    return (
      mensaje ||
      "No hay un perfil activo seleccionado en la sesión."
    );
  }

  return mensajeErrorApi(
    error,
    "No se pudieron cargar tus conexiones. Intentá nuevamente."
  );
}

/**
 * Mensaje de error para eliminar una conexión.
 * @param {unknown} error
 * @returns {string}
 */
export function mensajeErrorEliminarConexion(error) {
  const status = error?.response?.status;
  const data = error?.response?.data || {};

  if (data.codigo === CODIGOS_ERROR_CONEXIONES.CONEXION_NO_ACTIVA) {
    return data.message || "La conexión ya fue eliminada.";
  }

  if (status === 404) {
    return (
      data.message ||
      "La conexión no existe o tu perfil no participa de ella."
    );
  }

  return mensajeErrorApi(
    error,
    "No se pudo eliminar la conexión. Intentá nuevamente."
  );
}
