import {
  ESTADOS_ACTIVIDAD,
  normalizarEstadoActividad,
} from "./actividadConstants.js";
import {
  ESTADOS_PROYECTO,
  normalizarEstadoProyecto,
} from "./proyectoConstants.js";

/*
 * Reglas y textos de UC-26 (docs/backend/ficha-tecnica-postular-a-proyecto.md).
 * Se centralizan acá para no repetir la matriz de habilitación en la vista y
 * poder probarlas de forma aislada.
 */

export const TIPOS_POSTULACION = {
  GENERAL: "GENERAL",
  ACTIVIDAD: "ACTIVIDAD",
};

export const ESTADOS_POSTULACION = {
  PENDIENTE: "PENDIENTE",
  ACEPTADA: "ACEPTADA",
  RECHAZADA: "RECHAZADA",
};

export const AVISO_DISPONIBILIDAD_PROVISORIA =
  "Tu disponibilidad fue verificada de forma provisoria. Se confirmará cuando el proyecto defina su fecha de inicio.";

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
 * Postulación general: la ficha declara `elegibleParaPostularse` como fuente
 * de verdad. Se exige además que el proyecto esté Publicado y que el perfil no
 * sea miembro, para no depender de un dato stale.
 * @param {object|null|undefined} proyecto ProyectoResponse
 * @returns {boolean}
 */
export function puedePostularGeneral(proyecto) {
  if (!proyecto) return false;
  return (
    proyecto.esMiembro !== true &&
    normalizarEstadoProyecto(proyecto.estado) === ESTADOS_PROYECTO.PUBLICADO &&
    proyecto.elegibleParaPostularse === true
  );
}

/**
 * Habilitación de la pestaña de actividades: el proyecto debe estar Publicado
 * y el perfil no debe ser miembro. No depende de aceptaPostulacionGral.
 * @param {object|null|undefined} proyecto ProyectoResponse
 * @returns {boolean}
 */
export function proyectoAdmitePostulacionesActividad(proyecto) {
  if (!proyecto) return false;
  return (
    proyecto.esMiembro !== true &&
    normalizarEstadoProyecto(proyecto.estado) === ESTADOS_PROYECTO.PUBLICADO
  );
}

/**
 * Postulación a una actividad concreta (ficha §4.4): proyecto Publicado,
 * perfil no miembro y actividad PENDIENTE. La profesión, el cupo, el duplicado
 * y la disponibilidad los valida el backend.
 * @param {object|null|undefined} proyecto ProyectoResponse
 * @param {object|null|undefined} actividad ActividadBusquedaResponse
 * @returns {boolean}
 */
export function puedePostularActividad(proyecto, actividad) {
  if (!proyecto || !actividad) return false;
  return (
    proyectoAdmitePostulacionesActividad(proyecto) &&
    normalizarEstadoActividad(actividad.estado) === ESTADOS_ACTIVIDAD.PENDIENTE
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
