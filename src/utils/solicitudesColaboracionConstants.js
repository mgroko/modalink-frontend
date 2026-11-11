/*
 * Constantes y normalización de solicitudes de colaboración (UC-61/62/63/65).
 * Funciones puras: las vistas y servicios aportan el estado.
 */

export const DIRECCIONES_SOLICITUD_COLABORACION = {
  RECIBIDA: "RECIBIDA",
  ENVIADA: "ENVIADA",
};

export const ESTADOS_SOLICITUD_COLABORACION = {
  PENDIENTE: "PENDIENTE",
  ACEPTADA: "ACEPTADA",
  RECHAZADA: "RECHAZADA",
};

export const ETIQUETAS_ESTADO_SOLICITUD_COLABORACION = {
  [ESTADOS_SOLICITUD_COLABORACION.PENDIENTE]: "Pendiente",
  [ESTADOS_SOLICITUD_COLABORACION.ACEPTADA]: "Aceptada",
  [ESTADOS_SOLICITUD_COLABORACION.RECHAZADA]: "Rechazada",
};

export const COLORES_ESTADO_SOLICITUD_COLABORACION = {
  [ESTADOS_SOLICITUD_COLABORACION.PENDIENTE]: {
    fondo: "var(--color-warning-soft)",
    texto: "var(--color-warning-text)",
    borde: "var(--color-warning-border)",
  },
  [ESTADOS_SOLICITUD_COLABORACION.ACEPTADA]: {
    fondo: "var(--color-success-soft)",
    texto: "var(--color-success-text)",
    borde: "var(--color-success-border)",
  },
  [ESTADOS_SOLICITUD_COLABORACION.RECHAZADA]: {
    fondo: "var(--color-danger-soft)",
    texto: "var(--color-danger-text)",
    borde: "var(--color-danger-border)",
  },
};

export const TAMANO_PAGINA_SOLICITUDES = 20;

export const OPCIONES_TAMANO_SOLICITUDES = [
  { text: "20 por página", value: 20 },
  { text: "50 por página", value: 50 },
];

const MENSAJES_ERROR = {
  PUBLICACION_NO_DISPONIBLE:
    "La publicación ya no está disponible para colaborar.",
  AUTOINVITACION: "No podés invitarte a colaborar en tu propia publicación.",
  MISMO_USUARIO: "No podés invitar a otro perfil del mismo usuario.",
  DESTINATARIO_FUERA_DE_RED:
    "El perfil debe pertenecer a tu red de contactos.",
  DESTINATARIO_YA_ES_COLABORADOR:
    "Ese perfil ya colabora en esta publicación.",
  SOLICITUD_COLABORACION_PENDIENTE:
    "Ya existe una solicitud pendiente para esa publicación y perfil.",
  SOLICITUD_COLABORACION_NO_PERMITIDA:
    "No tenés permiso para gestionar esta solicitud.",
  SOLICITUD_COLABORACION_NO_PENDIENTE:
    "La solicitud ya fue aceptada o rechazada.",
};

/**
 * Traduce un error de la API a un mensaje legible. Prioriza el código de
 * negocio y, si no existe, usa el mensaje del backend.
 * @param {object|null|undefined} error
 * @param {string} [fallback]
 * @returns {string}
 */
export function mensajeErrorSolicitudColaboracion(
  error,
  fallback = "No se pudo completar la operación."
) {
  const codigo = error?.response?.data?.codigo;
  if (codigo && MENSAJES_ERROR[codigo]) return MENSAJES_ERROR[codigo];
  return error?.response?.data?.message || fallback;
}

/**
 * @param {string|null|undefined} estado
 * @returns {"PENDIENTE"|"ACEPTADA"|"RECHAZADA"|null}
 */
export function normalizarEstadoSolicitudColaboracion(estado) {
  return (
    ESTADOS_SOLICITUD_COLABORACION[String(estado || "").toUpperCase()] || null
  );
}

/**
 * Garantiza los flags y el estado en formato canónico.
 * @param {object|null|undefined} solicitud
 * @returns {object|null}
 */
export function normalizarSolicitudColaboracion(solicitud) {
  if (!solicitud) return null;

  return {
    ...solicitud,
    estado:
      normalizarEstadoSolicitudColaboracion(solicitud.estado) ||
      solicitud.estado,
    puedeAceptar: solicitud.puedeAceptar === true,
    puedeRechazar: solicitud.puedeRechazar === true,
    puedeEliminar: solicitud.puedeEliminar === true,
  };
}

export function paginacionSolicitudesInicial() {
  return {
    paginaActual: 0,
    tamanoPagina: TAMANO_PAGINA_SOLICITUDES,
    totalElementos: 0,
    totalPaginas: 0,
    primera: true,
    ultima: true,
  };
}

/**
 * @param {object|null|undefined} data
 * @returns {{paginaActual:number,tamanoPagina:number,totalElementos:number,totalPaginas:number,primera:boolean,ultima:boolean}}
 */
export function normalizarPaginaSolicitudes(data) {
  return {
    paginaActual: Number(data?.paginaActual) || 0,
    tamanoPagina:
      Number(data?.tamanoPagina) || TAMANO_PAGINA_SOLICITUDES,
    totalElementos: Number(data?.totalElementos) || 0,
    totalPaginas: Number(data?.totalPaginas) || 0,
    primera: data?.primera !== false,
    ultima: data?.ultima !== false,
  };
}
