import {
  ESTADOS_ACTIVIDAD,
  normalizarEstadoActividad,
} from "./actividadConstants.js";
import {
  ESTADOS_PROYECTO,
  ROLES_PROYECTO,
  normalizarEstadoProyecto,
} from "./proyectoConstants.js";

/*
 * Reglas y textos de UC-26 (docs/backend/ficha-tecnica-postular-a-proyecto.md).
 * Se centralizan acá para no repetir la matriz de habilitación en la vista y
 * poder probarlas de forma aislada.
 *
 * El backend es la fuente de verdad:
 * - `elegibleParaPostularse` ya contempla estado Publicado|Confirmado, no ser
 *   miembro, `aceptaPostulacionGral` y la profesión. NO evalúa cupo.
 * - El cupo se lee de `satisfecho`/`faltantes` (definición §11 de la ficha:
 *   `satisfecho = cubiertos >= cantidad`). El front no lo deriva de `cantidad`
 *   ni de asignaciones.
 */

export const TIPOS_POSTULACION = {
  GENERAL: "GENERAL",
  ACTIVIDAD: "ACTIVIDAD",
};

/** Acciones de UC-34 sobre una postulación. */
export const ACCIONES_GESTION = {
  ACEPTAR: "ACEPTAR",
  RECHAZAR: "RECHAZAR",
};

export const ESTADOS_POSTULACION = {
  PENDIENTE: "PENDIENTE",
  ACEPTADA: "ACEPTADA",
  RECHAZADA: "RECHAZADA",
};

export const ETIQUETAS_ESTADO_POSTULACION = {
  [ESTADOS_POSTULACION.PENDIENTE]: "Pendiente",
  [ESTADOS_POSTULACION.ACEPTADA]: "Aceptada",
  [ESTADOS_POSTULACION.RECHAZADA]: "Rechazada",
};

export const COLORES_ESTADO_POSTULACION = {
  [ESTADOS_POSTULACION.PENDIENTE]: {
    fondo: "var(--color-warning-soft)",
    texto: "var(--color-warning-text)",
    borde: "var(--color-warning-border)",
  },
  [ESTADOS_POSTULACION.ACEPTADA]: {
    fondo: "var(--color-success-soft)",
    texto: "var(--color-success-text)",
    borde: "var(--color-success-border)",
  },
  [ESTADOS_POSTULACION.RECHAZADA]: {
    fondo: "var(--color-danger-soft)",
    texto: "var(--color-danger-text)",
    borde: "var(--color-danger-border)",
  },
};

export const ETIQUETAS_TIPO_POSTULACION = {
  [TIPOS_POSTULACION.GENERAL]: "General",
  [TIPOS_POSTULACION.ACTIVIDAD]: "Actividad",
};

export const AVISO_DISPONIBILIDAD_PROVISORIA =
  "Tu disponibilidad fue verificada de forma provisoria. Se confirmará cuando el proyecto defina su fecha de inicio.";

/** Estados de proyecto que aceptan postulaciones a actividades. */
const ESTADOS_CON_POSTULACION = [
  ESTADOS_PROYECTO.PUBLICADO,
  ESTADOS_PROYECTO.CONFIRMADO,
];

/**
 * Clave estable para recordar qué requerimientos ya recibieron una postulación
 * durante la sesión de la vista.
 * @param {string} tipo TipoPostulacion
 * @param {number|string|null|undefined} idRequerimiento
 * @returns {string}
 */
export function clavePostulacion(tipo, idRequerimiento) {
  if (!tipo || idRequerimiento == null) return "";
  return `${tipo}:${idRequerimiento}`;
}

/**
 * ¿Queda cupo en el requerimiento? (ficha §4.4 y §11)
 *
 * - `satisfecho === true` → no hay cupo.
 * - `faltantes` numérico → hay cupo si es mayor a 0.
 * - Sin `satisfecho`/`faltantes` (p. ej. actividades hasta que el backend
 *   exponga los campos) → no se bloquea la acción; el `409` es la red de
 *   seguridad.
 * @param {object|null|undefined} requerimiento
 * @returns {boolean}
 */
export function hayCupo(requerimiento) {
  if (!requerimiento) return false;
  if (requerimiento.satisfecho === true) return false;

  if (requerimiento.faltantes != null) {
    const faltantes = Number(requerimiento.faltantes);
    if (Number.isFinite(faltantes)) return faltantes > 0;
  }

  return true;
}

/**
 * Cupo completo según el backend (o marca local tras un 409 de cupo).
 * @param {object|null|undefined} requerimiento
 * @returns {boolean}
 */
export function esCupoCompleto(requerimiento) {
  return !!requerimiento && !hayCupo(requerimiento);
}

/**
 * Postulación general (ficha §4.4): `elegibleParaPostularse` es la fuente de
 * verdad y ya incluye estado Publicado|Confirmado, no ser miembro,
 * `aceptaPostulacionGral` y la profesión. Acá sólo se suma el cupo.
 * @param {object|null|undefined} proyecto ProyectoResponse
 * @param {object|null|undefined} requerimiento RequerimientoGralResponse
 * @returns {boolean}
 */
export function puedePostularGeneral(proyecto, requerimiento) {
  if (!proyecto || !requerimiento) return false;
  return (
    proyecto.elegibleParaPostularse === true && hayCupo(requerimiento)
  );
}

/**
 * Habilitación de la pestaña de actividades (ficha §4.3/§4.4): proyecto
 * Publicado o Confirmado y perfil no director. Un miembro activo `MIEMBRO`
 * puede postularse; los no miembros (`rolUsuario: null`) también.
 * No depende de `aceptaPostulacionGral`.
 * @param {object|null|undefined} proyecto ProyectoResponse
 * @returns {boolean}
 */
export function proyectoAdmitePostulacionesActividad(proyecto) {
  if (!proyecto) return false;
  const estado = normalizarEstadoProyecto(proyecto.estado);
  return (
    ESTADOS_CON_POSTULACION.includes(estado) &&
    (!proyecto.esMiembro || proyecto.rolUsuario === ROLES_PROYECTO.MIEMBRO)
  );
}

/**
 * Postulación a una actividad concreta (ficha §4.4): proyecto Publicado o
 * Confirmado, perfil no director, actividad PENDIENTE y requerimiento con cupo.
 * La profesión, el duplicado y la disponibilidad los valida el backend.
 * @param {object|null|undefined} proyecto ProyectoResponse
 * @param {object|null|undefined} actividad ActividadBusquedaResponse
 * @param {object|null|undefined} requerimiento requerimiento de la actividad
 * @returns {boolean}
 */
export function puedePostularActividad(proyecto, actividad, requerimiento) {
  if (!proyecto || !actividad || !requerimiento) return false;
  return (
    proyectoAdmitePostulacionesActividad(proyecto) &&
    normalizarEstadoActividad(actividad.estado) === ESTADOS_ACTIVIDAD.PENDIENTE &&
    hayCupo(requerimiento)
  );
}

/**
 * Detecta el 409 de postulación duplicada para deshabilitar la acción local.
 * @param {object} error error Axios
 * @returns {boolean}
 */
export function esErrorPostulacionDuplicada(error) {
  const mensaje = error?.response?.data?.message || "";
  return (
    error?.response?.status === 409 &&
    /ya existe una postulaci[oó]n/i.test(mensaje)
  );
}

/**
 * Detecta el 409 de cupo completo. Se registra localmente para ocultar la
 * acción aunque la respuesta del backend todavía no traiga `satisfecho`
 * (caso de actividades).
 * @param {object} error error Axios
 * @returns {boolean}
 */
export function esErrorCupoCompleto(error) {
  const mensaje = error?.response?.data?.message || "";
  return (
    error?.response?.status === 409 &&
    /requerimiento.*ya est[áa] satisfecho/i.test(mensaje)
  );
}

/**
 * Detecta el 409 de disponibilidad insuficiente. Ese error mantiene el modal
 * abierto para que el usuario pueda leerlo y revisar su calendario.
 * @param {object} error error Axios
 * @returns {boolean}
 */
export function esErrorDisponibilidad(error) {
  const mensaje = error?.response?.data?.message || "";
  return (
    error?.response?.status === 409 &&
    /disponibilidad/i.test(mensaje)
  );
}

/**
 * Texto del toast de éxito. En actividad se incluye el nombre cuando existe.
 * @param {string} tipo TipoPostulacion
 * @param {string} [nombreActividad]
 * @returns {string}
 */
export function mensajeExitoPostulacion(tipo, nombreActividad = "") {
  if (tipo === TIPOS_POSTULACION.ACTIVIDAD) {
    const nombre = String(nombreActividad || "").trim();
    return nombre
      ? `Postulación enviada para la actividad '${nombre}'.`
      : "Postulación enviada para la actividad.";
  }
  return "Postulación enviada. El director del proyecto recibirá tu postulación.";
}

/**
 * Texto del cupo para la UI: "1 / 2 cubiertos" cuando hay más de un lugar.
 * Sólo usa datos del backend; devuelve "" si no corresponde mostrarlo.
 * @param {object|null|undefined} requerimiento
 * @returns {string}
 */
export function textoCupo(requerimiento) {
  const cantidad = Number(requerimiento?.cantidad);
  if (!Number.isFinite(cantidad) || cantidad <= 1) return "";

  const cubiertos = Number(requerimiento?.cubiertos);
  if (requerimiento?.cubiertos == null || !Number.isFinite(cubiertos)) {
    return "";
  }

  return `${cubiertos} / ${cantidad} cubiertos`;
}

/**
 * Normaliza el estado de una postulación al enum canónico.
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function normalizarEstadoPostulacion(estado) {
  if (!estado) return ESTADOS_POSTULACION.PENDIENTE;
  const clave = Object.keys(ESTADOS_POSTULACION).find(
    (k) => k.toLowerCase() === String(estado).toLowerCase()
  );
  return clave || String(estado).toUpperCase();
}

/**
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function etiquetaEstadoPostulacion(estado) {
  const clave = normalizarEstadoPostulacion(estado);
  return ETIQUETAS_ESTADO_POSTULACION[clave] || String(estado || "");
}

/**
 * @param {string|null|undefined} estado
 * @returns {{fondo: string, texto: string, borde: string}}
 */
export function coloresEstadoPostulacion(estado) {
  const clave = normalizarEstadoPostulacion(estado);
  return (
    COLORES_ESTADO_POSTULACION[clave] ||
    COLORES_ESTADO_POSTULACION[ESTADOS_POSTULACION.PENDIENTE]
  );
}

/**
 * @param {string|null|undefined} tipo
 * @returns {string}
 */
export function etiquetaTipoPostulacion(tipo) {
  if (!tipo) return "";
  const clave = String(tipo).toUpperCase();
  return ETIQUETAS_TIPO_POSTULACION[clave] || String(tipo);
}
