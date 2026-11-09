import { mensajeErrorApi } from "./apiError";

/*
 * Constantes y textos del listado de solicitudes de conexión (UC-46).
 */

export const DIRECCIONES_SOLICITUD = Object.freeze({
  RECIBIDA: "RECIBIDA",
  ENVIADA: "ENVIADA",
});

export const ESTADOS_SOLICITUD_CONEXION = Object.freeze({
  PENDIENTE: "PENDIENTE",
  ACEPTADA: "ACEPTADA",
  RECHAZADA: "RECHAZADA",
});

export const OPCIONES_DIRECCION = Object.freeze([
  { value: DIRECCIONES_SOLICITUD.RECIBIDA, text: "Recibidas" },
  { value: DIRECCIONES_SOLICITUD.ENVIADA, text: "Enviadas" },
  { value: "", text: "Todas" },
]);

export const OPCIONES_ESTADO = Object.freeze([
  { value: ESTADOS_SOLICITUD_CONEXION.PENDIENTE, text: "Pendientes" },
  { value: ESTADOS_SOLICITUD_CONEXION.ACEPTADA, text: "Aceptadas" },
  { value: ESTADOS_SOLICITUD_CONEXION.RECHAZADA, text: "Rechazadas" },
]);

export const OPCIONES_ESTADO_FILTRO = Object.freeze([
  { value: "", text: "Todas", clave: "TODAS" },
  { value: ESTADOS_SOLICITUD_CONEXION.PENDIENTE, text: "Pendientes", clave: "PENDIENTE" },
  { value: ESTADOS_SOLICITUD_CONEXION.ACEPTADA, text: "Aceptadas", clave: "ACEPTADA" },
  { value: ESTADOS_SOLICITUD_CONEXION.RECHAZADA, text: "Rechazadas", clave: "RECHAZADA" },
]);

export const OPCIONES_TAMANO = Object.freeze([
  { value: 20, text: "20 por página" },
  { value: 50, text: "50 por página" },
  { value: 100, text: "100 por página" },
]);

/**
 * Etiqueta visible de la dirección.
 * @param {string|null|undefined} direccion
 * @returns {string}
 */
export function etiquetaDireccion(direccion) {
  if (direccion === DIRECCIONES_SOLICITUD.RECIBIDA) return "Recibida";
  if (direccion === DIRECCIONES_SOLICITUD.ENVIADA) return "Enviada";
  return "";
}

/**
 * Etiqueta visible del estado.
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function etiquetaEstado(estado) {
  if (estado === ESTADOS_SOLICITUD_CONEXION.PENDIENTE) return "Pendiente";
  if (estado === ESTADOS_SOLICITUD_CONEXION.ACEPTADA) return "Aceptada";
  if (estado === ESTADOS_SOLICITUD_CONEXION.RECHAZADA) return "Rechazada";
  return "";
}

/**
 * Clase de color del badge de estado.
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function claseEstadoSolicitud(estado) {
  if (estado === ESTADOS_SOLICITUD_CONEXION.ACEPTADA) {
    return "solicitud-badge--aceptada";
  }
  if (estado === ESTADOS_SOLICITUD_CONEXION.RECHAZADA) {
    return "solicitud-badge--rechazada";
  }
  return "solicitud-badge--pendiente";
}

/**
 * Mensaje de error de la búsqueda de solicitudes.
 * @param {unknown} error
 * @returns {string}
 */
export function mensajeErrorSolicitudesConexion(error) {
  const status = error?.response?.status;
  const data = error?.response?.data || {};
  const codigo = data.codigo;
  const mensaje = data.message;

  if (codigo === "RANGO_FECHAS_INVALIDO") {
    return mensaje || "La fecha desde no puede ser posterior a la fecha hasta.";
  }

  if (status === 400) {
    return mensaje || "Revisá los filtros e intentá nuevamente.";
  }

  if (status === 404) {
    return (
      mensaje ||
      "No hay un perfil activo seleccionado en la sesión. Elegí un perfil para ver las solicitudes."
    );
  }

  return mensajeErrorApi(
    error,
    "No se pudieron cargar las solicitudes de conexión. Intentá nuevamente."
  );
}
