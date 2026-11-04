import {
  ESTADOS_ACTIVIDAD,
  normalizarEstadoActividad,
} from "./actividadConstants.js";
import { normalizarBloqueos } from "./confirmacionConstants.js";
import {
  esCuentaNoActiva,
  esSesionExpirada,
  mensajeErrorApi,
} from "./apiError.js";

/*
 * Reglas de UC-50: cambio de estado de actividad mediante
 * PATCH /proyectos/{idProyecto}/actividades/{idActividad}/estado.
 *
 * El backend es la fuente de verdad de la matriz de transiciones. Acá sólo se
 * decide qué botones mostrar, qué tooltip explicar y cómo clasificar errores.
 */

export const ACCIONES_ESTADO = {
  INICIAR: "INICIAR",
  FINALIZAR: "FINALIZAR",
  CANCELAR: "CANCELAR",
};

export const ETIQUETAS_ACCION_ESTADO = {
  [ACCIONES_ESTADO.INICIAR]: "Iniciar",
  [ACCIONES_ESTADO.FINALIZAR]: "Finalizar",
  [ACCIONES_ESTADO.CANCELAR]: "Cancelar",
};

export const ESTADOS_DESTINO_ACCION = {
  [ACCIONES_ESTADO.INICIAR]: ESTADOS_ACTIVIDAD.EN_CURSO,
  [ACCIONES_ESTADO.FINALIZAR]: ESTADOS_ACTIVIDAD.FINALIZADA,
  [ACCIONES_ESTADO.CANCELAR]: ESTADOS_ACTIVIDAD.CANCELADA,
};

export const TIPOS_ERROR_CAMBIO_ESTADO = {
  SESION: "SESION",
  CUENTA: "CUENTA",
  VALIDACION: "VALIDACION",
  PERMISO: "PERMISO",
  NO_ENCONTRADO: "NO_ENCONTRADO",
  TRANSICION: "TRANSICION",
  SIN_AGENDA: "SIN_AGENDA",
  ESTADO_INMUTABLE: "ESTADO_INMUTABLE",
  PROYECTO_ESTADO: "PROYECTO_ESTADO",
  BLOQUEO: "BLOQUEO",
  DESCONOCIDO: "DESCONOCIDO",
};

/**
 * Acciones permitidas por la matriz de estados.
 * @param {string|null|undefined} estado
 * @returns {string[]}
 */
export function accionesEstadoPermitidas(estado) {
  const actual = normalizarEstadoActividad(estado);

  if (actual === ESTADOS_ACTIVIDAD.PENDIENTE) {
    return [ACCIONES_ESTADO.INICIAR, ACCIONES_ESTADO.CANCELAR];
  }

  if (actual === ESTADOS_ACTIVIDAD.EN_CURSO) {
    return [ACCIONES_ESTADO.FINALIZAR, ACCIONES_ESTADO.CANCELAR];
  }

  return [];
}

/**
 * @param {string} accion
 * @returns {string|null}
 */
export function estadoDestinoDeAccion(accion) {
  return ESTADOS_DESTINO_ACCION[accion] || null;
}

/**
 * Motivo por el que una acción no se puede ejecutar. Vacío si está habilitada.
 * @param {string} accion
 * @param {object|null|undefined} actividad
 * @param {{puedeModificar?: boolean}} [opciones]
 * @returns {string}
 */
export function motivoAccionNoDisponible(
  accion,
  actividad,
  { puedeModificar = true } = {}
) {
  if (!puedeModificar) {
    return "No tenés permiso para modificar actividades en este proyecto.";
  }
  if (!actividad) {
    return "No se pudo cargar la actividad.";
  }

  if (!accionesEstadoPermitidas(actividad.estado).includes(accion)) {
    return "La acción no está disponible para el estado actual de la actividad.";
  }

  if (
    [ACCIONES_ESTADO.INICIAR, ACCIONES_ESTADO.FINALIZAR].includes(accion) &&
    !actividad.fechaHoraInicio
  ) {
    return "Primero debe agendarse la actividad.";
  }

  return "";
}

/**
 * @param {string} accion
 * @param {object|null|undefined} actividad
 * @param {{puedeModificar?: boolean}} [opciones]
 * @returns {boolean}
 */
export function puedeEjecutarAccionEstado(accion, actividad, opciones = {}) {
  return !motivoAccionNoDisponible(accion, actividad, opciones);
}

/**
 * @param {string} accion
 * @param {object|null|undefined} actividad
 * @returns {string}
 */
export function mensajeExitoCambioEstado(accion, actividad) {
  const nombre = String(actividad?.nombre || "").trim();
  const base = nombre ? `"${nombre}"` : "La actividad";

  if (accion === ACCIONES_ESTADO.INICIAR) {
    return `${base} pasó a EN CURSO.`;
  }
  if (accion === ACCIONES_ESTADO.FINALIZAR) {
    return `${base} quedó FINALIZADA.`;
  }
  if (accion === ACCIONES_ESTADO.CANCELAR) {
    return `${base} quedó CANCELADA.`;
  }
  return "El estado de la actividad se actualizó.";
}

/**
 * @param {object} error error Axios
 * @returns {{tipo:string, status:number|null, codigo:string, mensaje:string, bloqueos:object[]}}
 */
export function clasificarErrorCambioEstado(error) {
  const status = error?.response?.status ?? null;
  const data = error?.response?.data;
  const payload = data && typeof data === "object" ? data : {};
  const mensaje =
    typeof payload.message === "string" ? payload.message.trim() : "";
  const codigo = payload.codigo ? String(payload.codigo) : "";
  const bloqueos = normalizarBloqueos(payload.bloqueos);

  const base = { status, codigo, bloqueos };

  if (esSesionExpirada(error)) {
    return {
      ...base,
      tipo: TIPOS_ERROR_CAMBIO_ESTADO.SESION,
      mensaje: "Tu sesión expiró. Volvé a iniciar sesión.",
    };
  }

  if (esCuentaNoActiva(error)) {
    return {
      ...base,
      tipo: TIPOS_ERROR_CAMBIO_ESTADO.CUENTA,
      mensaje: mensaje || "Tu cuenta no se encuentra activa.",
    };
  }

  if (status === 400) {
    return {
      ...base,
      tipo: TIPOS_ERROR_CAMBIO_ESTADO.VALIDACION,
      mensaje: mensaje || "El estado seleccionado no es válido.",
    };
  }

  if (status === 403) {
    return {
      ...base,
      tipo: TIPOS_ERROR_CAMBIO_ESTADO.PERMISO,
      mensaje:
        mensaje || "No tenés permiso para modificar actividades en este proyecto.",
    };
  }

  if (status === 404) {
    return {
      ...base,
      tipo: TIPOS_ERROR_CAMBIO_ESTADO.NO_ENCONTRADO,
      mensaje: mensaje || "El proyecto o la actividad ya no están disponibles.",
    };
  }

  if (status === 409) {
    if (/proyecto.*(finaliz|cancel)|no permite modificar actividades/i.test(mensaje)) {
      return {
        ...base,
        tipo: TIPOS_ERROR_CAMBIO_ESTADO.PROYECTO_ESTADO,
        mensaje:
          mensaje || "El proyecto ya no admite cambios en sus actividades.",
      };
    }

    if (
      /actividad.*(finaliz|cancel)|no se puede modificar una actividad/i.test(
        mensaje
      )
    ) {
      return {
        ...base,
        tipo: TIPOS_ERROR_CAMBIO_ESTADO.ESTADO_INMUTABLE,
        mensaje: mensaje || "La actividad ya no se puede modificar.",
      };
    }

    if (/fecha.*inicio|agend|sin programar/i.test(mensaje)) {
      return {
        ...base,
        tipo: TIPOS_ERROR_CAMBIO_ESTADO.SIN_AGENDA,
        mensaje:
          mensaje || "La actividad debe tener una fecha de inicio asignada.",
      };
    }

    if (bloqueos.length) {
      return {
        ...base,
        tipo: TIPOS_ERROR_CAMBIO_ESTADO.BLOQUEO,
        mensaje:
          mensaje ||
          "No se pudo cambiar el estado porque el cronograma no tiene un plan viable.",
      };
    }

    return {
      ...base,
      tipo: TIPOS_ERROR_CAMBIO_ESTADO.TRANSICION,
      mensaje:
        mensaje || "La transición de estado no es válida para esta actividad.",
    };
  }

  return {
    ...base,
    tipo: TIPOS_ERROR_CAMBIO_ESTADO.DESCONOCIDO,
    mensaje: mensajeErrorApi(
      error,
      "No se pudo cambiar el estado de la actividad. Inténtalo nuevamente."
    ),
  };
}
