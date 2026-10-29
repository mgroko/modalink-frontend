/*
 * Utilidades de UC-60 Confirmar proyecto
 * (docs/backend/ficha-tecnica-confirmar-proyecto.md).
 *
 * El sistema es la fuente de verdad: `puedeConfirmar`, `bloqueos`,
 * `cubiertos`/`faltantes` y `satisfecho` se muestran tal como llegan. El front
 * no recalcula cupos, CPM ni horarios.
 *
 * El preview siempre responde 200: los problemas de negocio o planificación
 * llegan en `bloqueos`. Sólo 403/404 son errores HTTP.
 */

import { formatearFecha, formatearFechaCorta } from "./fechas.js";

export const CODIGOS_CONFIRMACION = {
  ACCESO_DENEGADO: "ACCESO_DENEGADO",
  PROYECTO_NO_ENCONTRADO: "PROYECTO_NO_ENCONTRADO",
  PERFIL_ACTIVO_NO_SELECCIONADO: "PERFIL_ACTIVO_NO_SELECCIONADO",
  PROYECTO_YA_CONFIRMADO: "PROYECTO_YA_CONFIRMADO",
  ESTADO_PROYECTO_INVALIDO: "ESTADO_PROYECTO_INVALIDO",
  SIN_ACTIVIDADES: "SIN_ACTIVIDADES",
  REQUERIMIENTOS_INCOMPLETOS: "REQUERIMIENTOS_INCOMPLETOS",
  ACTIVIDADES_SIN_ASIGNACION: "ACTIVIDADES_SIN_ASIGNACION",
  FECHA_ENTREGA_INVALIDA: "FECHA_ENTREGA_INVALIDA",
  CRONOGRAMA_NO_VIABLE: "CRONOGRAMA_NO_VIABLE",
  SIN_DISPONIBILIDAD: "SIN_DISPONIBILIDAD",
  DATOS_INCONSISTENTES: "DATOS_INCONSISTENTES",
};

/** Texto de respaldo cuando el sistema no envía `message`. */
export const MENSAJES_CODIGO_CONFIRMACION = {
  [CODIGOS_CONFIRMACION.ACCESO_DENEGADO]:
    "No tenés permiso para confirmar este proyecto.",
  [CODIGOS_CONFIRMACION.PROYECTO_NO_ENCONTRADO]: "El proyecto no existe.",
  [CODIGOS_CONFIRMACION.PERFIL_ACTIVO_NO_SELECCIONADO]:
    "No hay un perfil activo seleccionado.",
  [CODIGOS_CONFIRMACION.PROYECTO_YA_CONFIRMADO]: "El proyecto ya está confirmado.",
  [CODIGOS_CONFIRMACION.ESTADO_PROYECTO_INVALIDO]:
    "El proyecto no está en un estado que permita confirmarlo.",
  [CODIGOS_CONFIRMACION.SIN_ACTIVIDADES]:
    "El proyecto no tiene actividades para planificar.",
  [CODIGOS_CONFIRMACION.REQUERIMIENTOS_INCOMPLETOS]:
    "Faltan integrantes en algunos requerimientos.",
  [CODIGOS_CONFIRMACION.ACTIVIDADES_SIN_ASIGNACION]:
    "Hay actividades sin integrantes activos asignados.",
  [CODIGOS_CONFIRMACION.FECHA_ENTREGA_INVALIDA]:
    "La fecha de entrega no es válida.",
  [CODIGOS_CONFIRMACION.CRONOGRAMA_NO_VIABLE]:
    "El cronograma no es viable con la fecha de entrega actual.",
  [CODIGOS_CONFIRMACION.SIN_DISPONIBILIDAD]:
    "No hay disponibilidad común para agendar una actividad.",
  [CODIGOS_CONFIRMACION.DATOS_INCONSISTENTES]:
    "Hay datos inconsistentes en la planificación del proyecto.",
};

/**
 * Códigos que indican que el proyecto cambió de estado: ya no tiene sentido
 * mantener el modal abierto. El resto de los 409 son bloqueos que el usuario
 * puede corregir y se muestran dentro del modal.
 * @param {string|null|undefined} codigo
 * @returns {boolean}
 */
export function esBloqueoDeEstado(codigo) {
  return (
    codigo === CODIGOS_CONFIRMACION.PROYECTO_YA_CONFIRMADO ||
    codigo === CODIGOS_CONFIRMACION.ESTADO_PROYECTO_INVALIDO
  );
}

/**
 * Texto de respaldo por código (el `message` del sistema tiene prioridad).
 * @param {string|null|undefined} codigo
 * @returns {string}
 */
export function mensajeCodigoConfirmacion(codigo) {
  if (!codigo) return "";
  return MENSAJES_CODIGO_CONFIRMACION[codigo] || "";
}

/**
 * Fecha y hora para `fechaInicioPropuesta` / `fechaInicioConfirmada`. Si el
 * valor es sólo fecha, no inventa una hora.
 * @param {string|null|undefined} valor
 * @returns {string}
 */
export function formatearFechaHoraConfirmacion(valor) {
  if (valor == null || valor === "") return "—";
  const texto = String(valor);
  return texto.includes("T") ? formatearFecha(texto) : formatearFechaCorta(texto);
}

/**
 * @typedef {Object} BloqueoConfirmacion
 * @property {string} codigo
 * @property {string} mensaje
 * @property {string|null} entidadTipo
 * @property {number|null} entidadId
 */

/**
 * Normaliza la lista de bloqueos y tolera `message` como alias.
 * @param {unknown} lista
 * @returns {BloqueoConfirmacion[]}
 */
export function normalizarBloqueos(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .filter((bloqueo) => bloqueo && typeof bloqueo === "object")
    .map((bloqueo) => ({
      codigo: bloqueo.codigo ? String(bloqueo.codigo) : "",
      mensaje: bloqueo.mensaje || bloqueo.message || "",
      entidadTipo: bloqueo.entidadTipo ?? null,
      entidadId: bloqueo.entidadId ?? null,
    }))
    .filter((bloqueo) => bloqueo.mensaje || bloqueo.codigo);
}

/**
 * @typedef {Object} RequerimientoConfirmacion
 * @property {number|null} idRequerimiento
 * @property {number|null} idActividad
 * @property {string|null} nombreActividad
 * @property {number|null} idProfesion
 * @property {string} nombreProfesion
 * @property {number} cantidad
 * @property {number} cubiertos
 * @property {number} faltantes
 * @property {boolean|null} satisfecho
 */

function aNumero(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

/**
 * @param {unknown} requerimiento
 * @returns {RequerimientoConfirmacion}
 */
export function normalizarRequerimientoConfirmacion(requerimiento) {
  const dato =
    requerimiento && typeof requerimiento === "object" ? requerimiento : {};

  return {
    idRequerimiento:
      dato.idRequerimiento != null ? Number(dato.idRequerimiento) : null,
    idActividad: dato.idActividad != null ? Number(dato.idActividad) : null,
    nombreActividad: dato.nombreActividad || null,
    idProfesion: dato.idProfesion != null ? Number(dato.idProfesion) : null,
    nombreProfesion: dato.nombreProfesion || "Profesión sin nombre",
    cantidad: aNumero(dato.cantidad),
    cubiertos: aNumero(dato.cubiertos),
    faltantes: aNumero(dato.faltantes),
    satisfecho:
      typeof dato.satisfecho === "boolean" ? dato.satisfecho : null,
  };
}

/**
 * @param {unknown} lista
 * @returns {RequerimientoConfirmacion[]}
 */
function normalizarRequerimientos(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.map(normalizarRequerimientoConfirmacion);
}

/**
 * Normaliza el preview con defaults seguros: si el sistema omite un array o un
 * booleano, la UI no rompe y nunca habilita la confirmación por accidente.
 * @param {unknown} data
 * @returns {{
 *   puedeConfirmar: boolean,
 *   estado: string,
 *   fechaInicioPropuesta: string|null,
 *   fechaEntrega: string|null,
 *   bloqueos: BloqueoConfirmacion[],
 *   requerimientosGenerales: RequerimientoConfirmacion[],
 *   requerimientosActividad: RequerimientoConfirmacion[],
 *   propuestaHorarios: object[]
 * }}
 */
export function normalizarPreview(data) {
  const preview = data && typeof data === "object" ? data : {};

  return {
    puedeConfirmar: preview.puedeConfirmar === true,
    estado: preview.estado || "",
    fechaInicioPropuesta: preview.fechaInicioPropuesta || null,
    fechaEntrega: preview.fechaEntrega || null,
    bloqueos: normalizarBloqueos(preview.bloqueos),
    requerimientosGenerales: normalizarRequerimientos(
      preview.requerimientosGenerales
    ),
    requerimientosActividad: normalizarRequerimientos(
      preview.requerimientosActividad
    ),
    propuestaHorarios: Array.isArray(preview.propuestaHorarios)
      ? preview.propuestaHorarios
      : [],
  };
}

/**
 * @typedef {Object} ErrorConfirmacionClasificado
 * @property {number|undefined} status
 * @property {string} codigo
 * @property {string} mensaje
 * @property {BloqueoConfirmacion[]} bloqueos
 * @property {boolean} esEstado el proyecto cambió de estado
 */

/**
 * Clasifica un error de UC-60 por `codigo` (contrato de la ficha §4). No usa la
 * heurística por `message` de `erroresProyecto.js`.
 * @param {object} error error Axios
 * @returns {ErrorConfirmacionClasificado}
 */
export function clasificarErrorConfirmacion(error) {
  const data = error?.response?.data;
  const codigo = data?.codigo ? String(data.codigo) : "";

  return {
    status: error?.response?.status,
    codigo,
    mensaje: data?.message || data?.mensaje || mensajeCodigoConfirmacion(codigo),
    bloqueos: normalizarBloqueos(data?.bloqueos),
    esEstado: esBloqueoDeEstado(codigo),
  };
}
