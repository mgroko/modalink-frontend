/*
 * Contrato de disponibilidad (ficha CPM §6).
 * El front no calcula huecos ni intersecciones: sólo normaliza la respuesta y
 * traduce motivos conocidos. Un motivo desconocido usa un mensaje genérico.
 */

import { formatearHolgura } from "./cpmConstants.js";
import { formatearFecha } from "./fechas.js";

export const MOTIVOS_DISPONIBILIDAD = {
  SIN_MIEMBROS: "SIN_MIEMBROS",
  SIN_JORNADA: "SIN_JORNADA",
  DURACION_EXCEDE_VENTANA: "DURACION_EXCEDE_VENTANA",
  SIN_HUECO: "SIN_HUECO",
  SIN_HUECO_COMUN: "SIN_HUECO_COMUN",
  FUERA_TOLERANCIA_PREFERENCIA: "FUERA_TOLERANCIA_PREFERENCIA",
  CONFLICTO_FIJO: "CONFLICTO_FIJO",
};

export const RESULTADOS_PREFERENCIA = {
  SIN_PREFERENCIA: "SIN_PREFERENCIA",
  EXACTO: "EXACTO",
  DESVIO: "DESVIO",
  SIN_LUGAR: "SIN_LUGAR",
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
    "No se encontró una intersección de disponibilidad entre los profesionales para llevar a cabo la actividad.",
  [MOTIVOS_DISPONIBILIDAD.FUERA_TOLERANCIA_PREFERENCIA]:
    "Hay horario libre, pero no dentro de la tolerancia alrededor del horario de preferencia de la actividad.",
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
 * Duración absoluta de un desvío, sin dirección.
 * @param {number|string|null|undefined} minutos
 * @returns {string} "" si no hay desvío o es 0
 */
export function formatearDuracionDesvio(minutos) {
  if (minutos == null || minutos === "") return "";
  const total = Math.round(Number(minutos));
  if (!Number.isFinite(total) || total === 0) return "";
  return formatearHolgura(Math.abs(total));
}

/**
 * Desvío con dirección. El signo lo entrega el sistema: negativo = antes,
 * positivo = después. El front no lo recalcula.
 * @param {number|string|null|undefined} minutos
 * @returns {string}
 */
export function formatearDesvioMinutos(minutos) {
  if (minutos == null || minutos === "") return "";
  const total = Math.round(Number(minutos));
  if (!Number.isFinite(total)) return "";
  if (total === 0) return "Sin desvío";
  const duracion = formatearHolgura(Math.abs(total));
  return `${duracion} ${total < 0 ? "más temprano" : "más tarde"}`;
}

/**
 * Etiqueta corta para el badge de preferencia.
 * @param {string|null|undefined} resultado
 * @param {number|string|null|undefined} minutos
 * @returns {string}
 */
export function etiquetaResultadoPreferencia(resultado, minutos) {
  if (resultado === RESULTADOS_PREFERENCIA.EXACTO) return "Horario preferido";
  if (resultado === RESULTADOS_PREFERENCIA.DESVIO) {
    const duracion = formatearDuracionDesvio(minutos);
    return duracion ? `Con ajuste de ${duracion}` : "Con ajuste de horario";
  }
  if (resultado === RESULTADOS_PREFERENCIA.SIN_LUGAR) {
    return "Sin disponibilidad dentro de la tolerancia";
  }
  return "";
}

/**
 * Texto de ajuste para la aceptación o el panel de disponibilidad.
 * @param {string|null|undefined} resultado
 * @param {number|string|null|undefined} minutos
 * @returns {string}
 */
export function mensajeAjustePreferencia(resultado, minutos) {
  if (resultado === RESULTADOS_PREFERENCIA.EXACTO) {
    return "Se respetó el horario preferido.";
  }
  if (resultado === RESULTADOS_PREFERENCIA.DESVIO) {
    const desvio = formatearDesvioMinutos(minutos);
    if (!desvio || desvio === "Sin desvío") {
      return "Se asignó un horario con ajuste respecto del preferido.";
    }
    return `Se asignó ${desvio} de lo preferido.`;
  }
  return "";
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
 *   resultadoPreferencia: string|null,
 *   desvioMinutos: number|null,
 *   inicioPreferido: string|null,
 *   miembrosBloqueantes: number[],
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

  const miembrosBloqueantes = Array.isArray(resultado.miembrosBloqueantes)
    ? resultado.miembrosBloqueantes
        .filter((idUsuario) => idUsuario != null && idUsuario !== "")
        .map((idUsuario) => Number(idUsuario))
        .filter((idUsuario) => Number.isFinite(idUsuario))
    : [];

  return {
    disponible: resultado.disponible === true,
    provisional: resultado.provisional === true,
    inicioEvaluado: resultado.inicioEvaluado ?? null,
    finEvaluado: resultado.finEvaluado ?? null,
    inicioSeleccionado: resultado.inicioSeleccionado ?? null,
    finSeleccionado: resultado.finSeleccionado ?? null,
    motivo: resultado.motivo ?? null,
    resultadoPreferencia: resultado.resultadoPreferencia ?? null,
    desvioMinutos: resultado.desvioMinutos ?? null,
    inicioPreferido: resultado.inicioPreferido ?? null,
    miembrosBloqueantes,
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
