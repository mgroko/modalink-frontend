/*
 * Utilidades CPM y disponibilidad de lectura
 * (docs/backend/ficha-tecnica-cpm-disponibilidad-fase-3.md).
 *
 * El front no calcula CPM, holguras ni márgenes: sólo interpreta los flags y
 * los minutos que entrega el sistema. Los booleanos pueden venir `null`, por
 * eso todas las comprobaciones son estrictas (`=== true`).
 */

import { parseFechaLocal } from "./actividadConstants.js";
import { formatearFechaCorta } from "./fechas.js";

export const ESTADOS_CRONOGRAMA = {
  NORMAL: "NORMAL",
  ALERTA_DESBORDE: "ALERTA_DESBORDE",
  SIN_FECHA_ENTREGA: "SIN_FECHA_ENTREGA",
};

/** Código del 400 cuando el proyecto no tiene fecha de entrega (ficha v2 §2). */
export const CODIGO_SIN_FECHA_ENTREGA = "SIN_FECHA_ENTREGA";

/**
 * Detecta el 400 de cronograma/disponibilidad por falta de fecha de entrega.
 * El `codigo` es la fuente de verdad; el mensaje queda como compatibilidad.
 * @param {object} error error Axios
 * @returns {boolean}
 */
export function esErrorSinFechaEntrega(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  if (status !== 400) return false;
  if (data?.codigo === CODIGO_SIN_FECHA_ENTREGA) return true;
  return /no tiene fecha de entrega|complete la fecha de entrega/i.test(
    data?.message || ""
  );
}

export const ETIQUETAS_ESTADO_CRONOGRAMA = {
  [ESTADOS_CRONOGRAMA.NORMAL]: "Normal",
  [ESTADOS_CRONOGRAMA.ALERTA_DESBORDE]: "Alerta por desborde",
  [ESTADOS_CRONOGRAMA.SIN_FECHA_ENTREGA]: "Sin fecha de entrega",
};

export const COLORES_ESTADO_CRONOGRAMA = {
  [ESTADOS_CRONOGRAMA.NORMAL]: {
    fondo: "var(--color-success-soft)",
    texto: "var(--color-success-text)",
    borde: "var(--color-success-border)",
  },
  [ESTADOS_CRONOGRAMA.ALERTA_DESBORDE]: {
    fondo: "var(--color-danger-soft)",
    texto: "var(--color-danger-text)",
    borde: "var(--color-danger-border)",
  },
  [ESTADOS_CRONOGRAMA.SIN_FECHA_ENTREGA]: {
    fondo: "var(--color-warning-soft)",
    texto: "var(--color-warning-text)",
    borde: "var(--color-warning-border)",
  },
};

const COLOR_ESTADO_POR_DEFECTO = {
  fondo: "var(--color-surface-muted)",
  texto: "var(--color-text-muted)",
  borde: "var(--color-border)",
};

/**
 * Etiqueta del estado del cronograma. Un valor desconocido se muestra crudo,
 * nunca como "—", para no ocultar información nueva del sistema.
 * @param {string|null|undefined} valor
 * @returns {string}
 */
export function etiquetaEstadoCronograma(valor) {
  if (!valor) return "—";
  return ETIQUETAS_ESTADO_CRONOGRAMA[valor] || String(valor);
}

/**
 * @param {string|null|undefined} valor
 * @returns {{fondo: string, texto: string, borde: string}}
 */
export function coloresEstadoCronograma(valor) {
  return COLORES_ESTADO_CRONOGRAMA[valor] || COLOR_ESTADO_POR_DEFECTO;
}

/** @param {object|null|undefined} actividad */
export function esProyectada(actividad) {
  return !actividad?.fechaHoraInicio && !!actividad?.inicioProyectado;
}

/**
 * `tentativo` manda. `tentative` sólo se acepta como compatibilidad histórica.
 * @param {object|null|undefined} actividad
 * @returns {boolean}
 */
export function esTentativa(actividad) {
  if (!actividad) return false;
  if (actividad.tentativo === true) return true;
  return actividad.tentative === true || actividad.tentative === "true";
}

/** @param {object|null|undefined} actividad */
export function esCritica(actividad) {
  return actividad?.critica === true;
}

/** @param {object|null|undefined} actividad */
export function esConflictiva(actividad) {
  return actividad?.conflicto === true;
}

/** @param {object|null|undefined} actividad */
export function esParcial(actividad) {
  return actividad?.parcial === true;
}

/**
 * Formatea minutos de holgura sin recalcular nada.
 * `null`/`undefined`/vacío → ""; negativo → "−2 h 15 min"; 0 → "0 min".
 * @param {number|string|null|undefined} minutos
 * @returns {string}
 */
export function formatearHolgura(minutos) {
  if (minutos == null || minutos === "") return "";
  const total = Math.round(Number(minutos));
  if (!Number.isFinite(total)) return "";

  const signo = total < 0 ? "−" : "";
  const absoluto = Math.abs(total);
  if (absoluto === 0) return "0 min";

  const dias = Math.floor(absoluto / 1440);
  const resto = absoluto % 1440;
  const horas = Math.floor(resto / 60);
  const mins = resto % 60;

  const partes = [];
  if (dias) partes.push(`${dias} d`);
  if (horas) partes.push(`${horas} h`);
  if (mins) partes.push(`${mins} min`);
  return `${signo}${partes.join(" ")}`;
}

/**
 * Tooltip único para una fecha proyectada.
 * @param {object|null|undefined} actividad
 * @returns {string}
 */
export function textoProyeccion(actividad) {
  if (esTentativa(actividad)) {
    return "Proyección provisional hasta confirmar el proyecto.";
  }
  return "Fecha proyectada por CPM; no está persistida.";
}

/**
 * Chips CPM en orden estable: Proyectada, Estimada, Crítica, Conflicto,
 * Parcial. `critica` y `conflicto` son independientes.
 * @param {object|null|undefined} actividad
 * @returns {{tipo: string, etiqueta: string, detalle: string}[]}
 */
export function describirCpm(actividad) {
  const chips = [];
  if (!actividad) return chips;

  if (esProyectada(actividad)) {
    chips.push({
      tipo: "proyectada",
      etiqueta: "Proyectada",
      detalle: textoProyeccion(actividad),
    });
  }

  if (esTentativa(actividad)) {
    chips.push({
      tipo: "estimada",
      etiqueta: "Estimada",
      detalle: "Proyección provisional hasta confirmar el proyecto.",
    });
  }

  if (esCritica(actividad)) {
    chips.push({
      tipo: "critica",
      etiqueta: "Crítica",
      detalle: "Holgura de makespan igual a cero.",
    });
  }

  if (esConflictiva(actividad)) {
    chips.push({
      tipo: "conflicto",
      etiqueta: "Conflicto",
      detalle:
        actividad.motivoConflicto ||
        "La ventana CPM de la actividad no es factible.",
    });
  }

  if (esParcial(actividad)) {
    chips.push({
      tipo: "parcial",
      etiqueta: "Cálculo parcial",
      detalle: "El cálculo no tiene una ventana de entrega completa.",
    });
  }

  return chips;
}

/**
 * El sistema entrega `finProyectado` como fin exclusivo. Para mostrar el día
 * inclusive se resta un día sólo cuando el fin cae exactamente a las 00:00.
 * @param {string|Date|null|undefined} valor
 * @returns {Date|null}
 */
export function fechaFinInclusiva(valor) {
  const fecha = parseFechaLocal(valor);
  if (!fecha) return null;
  if (
    fecha.getHours() === 0 &&
    fecha.getMinutes() === 0 &&
    fecha.getSeconds() === 0
  ) {
    const anterior = new Date(fecha);
    anterior.setDate(anterior.getDate() - 1);
    return anterior;
  }
  return fecha;
}

/**
 * Rango visual "dd/mm/aaaa – dd/mm/aaaa" usando fechas absolutas ya calculadas
 * por el sistema, con el fin mostrado como día inclusive.
 * @param {string|null|undefined} inicio
 * @param {string|null|undefined} fin
 * @returns {string}
 */
export function formatearRangoCpm(inicio, fin) {
  const inicioTexto = formatearFechaCorta(inicio);
  const finTexto = formatearFechaCorta(fechaFinInclusiva(fin));
  if (inicioTexto === "—" && finTexto === "—") return "—";
  return `${inicioTexto} – ${finTexto}`;
}
