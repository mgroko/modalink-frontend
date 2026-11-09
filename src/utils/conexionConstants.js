import { mensajeErrorApi } from "./apiError";

/*
 * Estados y errores del módulo de conexiones (ficha UC-43).
 */

export const ESTADOS_CONEXION = Object.freeze({
  NINGUNA: "NINGUNA",
  SOLICITUD_ENVIADA: "SOLICITUD_ENVIADA",
  SOLICITUD_RECIBIDA: "SOLICITUD_RECIBIDA",
  CONECTADO: "CONECTADO",
});

export const CODIGOS_ERROR_CONEXION = Object.freeze({
  SOLICITUD_CONEXION_INVALIDA: "SOLICITUD_CONEXION_INVALIDA",
  SOLICITUD_CONEXION_PENDIENTE: "SOLICITUD_CONEXION_PENDIENTE",
  CONEXION_YA_EXISTENTE: "CONEXION_YA_EXISTENTE",
  SOLICITUD_CONEXION_NO_PERMITIDA: "SOLICITUD_CONEXION_NO_PERMITIDA",
  SOLICITUD_CONEXION_NO_PENDIENTE: "SOLICITUD_CONEXION_NO_PENDIENTE",
});

/**
 * Normaliza el estado que llega del backend. Si el campo falta o trae un
 * valor desconocido, se trata como NINGUNA.
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function normalizarEstadoConexion(estado) {
  return Object.values(ESTADOS_CONEXION).includes(estado)
    ? estado
    : ESTADOS_CONEXION.NINGUNA;
}

/**
 * Texto de la acción/estado visible en el perfil.
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function etiquetaAccionConexion(estado) {
  switch (normalizarEstadoConexion(estado)) {
    case ESTADOS_CONEXION.SOLICITUD_ENVIADA:
      return "Solicitud enviada";
    case ESTADOS_CONEXION.SOLICITUD_RECIBIDA:
      return "Solicitud recibida";
    case ESTADOS_CONEXION.CONECTADO:
      return "Conectado";
    case ESTADOS_CONEXION.NINGUNA:
    default:
      return "Conectar";
  }
}

/**
 * Mensaje de error para los fallos del envío que no son 409 de estado
 * pendiente/conexión existente (esos se resuelven refrescando el perfil).
 * @param {unknown} error
 * @returns {string}
 */
export function mensajeErrorConexion(error) {
  const status = error?.response?.status;
  const data = error?.response?.data || {};
  const codigo = data.codigo;
  const mensaje = data.message;

  if (codigo === CODIGOS_ERROR_CONEXION.SOLICITUD_CONEXION_INVALIDA) {
    return (
      mensaje ||
      "No podés enviar una solicitud de conexión a este perfil."
    );
  }

  if (status === 400) {
    return mensaje || "Revisá los datos e intentá nuevamente.";
  }

  if (status === 403) {
    return (
      mensaje ||
      "No tenés permisos para enviar solicitudes de conexión."
    );
  }

  if (status === 404) {
    return (
      mensaje ||
      "El perfil no está disponible o no tenés un perfil activo."
    );
  }

  return mensajeErrorApi(
    error,
    "No se pudo enviar la solicitud de conexión. Intentá nuevamente."
  );
}

/**
 * Mensaje de error para la cancelación de una solicitud enviada.
 * @param {unknown} error
 * @returns {string}
 */
export function mensajeErrorCancelacionConexion(error) {
  const status = error?.response?.status;
  const data = error?.response?.data || {};
  const codigo = data.codigo;
  const mensaje = data.message;

  if (codigo === CODIGOS_ERROR_CONEXION.SOLICITUD_CONEXION_NO_PERMITIDA) {
    return (
      mensaje ||
      "No podés cancelar una solicitud enviada por otro perfil."
    );
  }

  if (codigo === CODIGOS_ERROR_CONEXION.SOLICITUD_CONEXION_NO_PENDIENTE) {
    return mensaje || "La solicitud ya no está pendiente.";
  }

  if (status === 404) {
    return (
      mensaje ||
      "La solicitud no existe o no tenés un perfil activo."
    );
  }

  return mensajeErrorApi(
    error,
    "No se pudo cancelar la solicitud de conexión. Intentá nuevamente."
  );
}
