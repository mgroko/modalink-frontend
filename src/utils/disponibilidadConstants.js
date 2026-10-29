/*
 * Contrato de disponibilidad (ficha CPM §6).
 * El front no calcula huecos ni intersecciones: sólo normaliza la respuesta y
 * traduce motivos conocidos. Un motivo desconocido usa un mensaje genérico.
 */

import { formatearFecha } from "./fechas.js";

export const MOTIVOS_DISPONIBILIDAD = {
  SIN_MIEMBROS: "SIN_MIEMBROS",
  SIN_JORNADA: "SIN_JORNADA",
  DURACION_EXCEDE_VENTANA: "DURACION_EXCEDE_VENTANA",
  SIN_HUECO: "SIN_HUECO",
  SIN_HUECO_COMUN: "SIN_HUECO_COMUN",
  CONFLICTO_FIJO: "CONFLICTO_FIJO",
};

export const ETIQUETAS_MOTIVO_DISPONIBILIDAD = {
  [MOTIVOS_DISPONIBILIDAD.SIN_MIEMBROS]:
    "No se recibió ningún miembro para evaluar.",
  [MOTIVOS_DISPONIBILIDAD.SIN_JORNADA]:
    "El perfil no tiene jornada configurada dentro del rango.",
  [MOTIVOS_DISPONIBILIDAD.DURACION_EXCEDE_VENTANA]:
    "La duración supera la ventana laboral disponible.",
  [MOTIVOS_DISPONIBILIDAD.SIN_HUECO]:
    "Los bloqueos del perfil impiden encontrar un hueco.",
  [MOTIVOS_DISPONIBILIDAD.SIN_HUECO_COMUN]:
    "No hay un horario común disponible para todos los miembros.",
  [MOTIVOS_DISPONIBILIDAD.CONFLICTO_FIJO]:
    "El CPM detecta un conflicto con una actividad fija.",
};

export const MENSAJE_DISPONIBILIDAD_GENERICO =
  "No hay disponibilidad suficiente para la actividad.";

/**
 * @param {string|null|undefined} motivo
 * @returns {string}
 */
export function mensajeMotivo(motivo) {
  if (!motivo) return MENSAJE_DISPONIBILIDAD_GENERICO;
  return ETIQUETAS_MOTIVO_DISPONIBILIDAD[motivo] || MENSAJE_DISPONIBILIDAD_GENERICO;
}

/**
 * Normaliza `ResultadoDisponibilidad` con defaults seguros.
 * @param {object|null|undefined} data
 * @returns {{
 *   disponible: boolean,
 *   provisional: boolean,
 *   inicioEvaluado: string|null,
 *   finEvaluado: string|null,
 *   inicioSeleccionado: string|null,
 *   finSeleccionado: string|null,
 *   motivo: string|null,
 *   miembros: Array<{
 *     idUsuario: number|null,
 *     inicioEvaluado: string|null,
 *     finEvaluado: string|null,
 *     huecos: Array<{inicio: string|null, fin: string|null}>,
 *     disponible: boolean,
 *     motivo: string|null
 *   }>
 * }}
 */
export function normalizarResultado(data) {
  const resultado = data && typeof data === "object" ? data : {};
  const miembros = Array.isArray(resultado.miembros)
    ? resultado.miembros.map((miembro) => ({
        idUsuario: miembro?.idUsuario ?? null,
        inicioEvaluado: miembro?.inicioEvaluado ?? null,
        finEvaluado: miembro?.finEvaluado ?? null,
        huecos: Array.isArray(miembro?.huecos)
          ? miembro.huecos.map((hueco) => ({
              inicio: hueco?.inicio ?? null,
              fin: hueco?.fin ?? null,
            }))
          : [],
        disponible: miembro?.disponible === true,
        motivo: miembro?.motivo ?? null,
      }))
    : [];

  return {
    disponible: resultado.disponible === true,
    provisional: resultado.provisional === true,
    inicioEvaluado: resultado.inicioEvaluado ?? null,
    finEvaluado: resultado.finEvaluado ?? null,
    inicioSeleccionado: resultado.inicioSeleccionado ?? null,
    finSeleccionado: resultado.finSeleccionado ?? null,
    motivo: resultado.motivo ?? null,
    miembros,
  };
}

/**
 * @param {string|null|undefined} inicio
 * @param {string|null|undefined} fin
 * @returns {string}
 */
export function formatearVentana(inicio, fin) {
  const inicioTexto = formatearFecha(inicio);
  const finTexto = formatearFecha(fin);
  if (inicioTexto === "—" && finTexto === "—") return "—";
  return `${inicioTexto} – ${finTexto}`;
}

/**
 * @param {Array<{inicio?: string|null, fin?: string|null}>|null|undefined} huecos
 * @returns {Array<{inicio: string|null, fin: string|null, texto: string}>}
 */
export function formatearHuecos(huecos) {
  const lista = Array.isArray(huecos) ? huecos : [];
  return lista.map((hueco) => ({
    inicio: hueco?.inicio ?? null,
    fin: hueco?.fin ?? null,
    texto: formatearVentana(hueco?.inicio, hueco?.fin),
  }));
}
