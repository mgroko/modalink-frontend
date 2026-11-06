import { ESTADOS_ACTIVIDAD, normalizarEstadoActividad } from "./actividadConstants.js";

/*
 * Origen del inicio de una actividad
 * (docs/backend/ficha-tecnica-origen-inicio-disponibilidad-y-reprogramacion.md §2).
 *
 * El backend lo calcula en cada consulta. El front sólo lo presenta: no lo
 * persiste, no lo usa para habilitar acciones y no lo infiere desde fechas,
 * `tentativo` ni `provisional`.
 */

export const ORIGENES_INICIO = {
  PROYECTADA: "PROYECTADA",
  CONFIRMADA: "CONFIRMADA",
  REAL: "REAL",
};

export const ETIQUETAS_ORIGEN_INICIO = {
  [ORIGENES_INICIO.PROYECTADA]: "Provisional",
  [ORIGENES_INICIO.CONFIRMADA]: "Confirmada",
  [ORIGENES_INICIO.REAL]: "Real",
};

export const DETALLES_ORIGEN_INICIO = {
  [ORIGENES_INICIO.PROYECTADA]:
    "Inicio estimado; puede cambiar.",
  [ORIGENES_INICIO.CONFIRMADA]:
    "Inicio persistido; sigue siendo reprogramable mientras la actividad esté pendiente.",
  [ORIGENES_INICIO.REAL]:
    "Inicio real; no se reprograma.",
};

export const COLORES_ORIGEN_INICIO = {
  [ORIGENES_INICIO.PROYECTADA]: {
    fondo: "var(--color-warning-soft)",
    texto: "var(--color-warning-text)",
    borde: "var(--color-warning-border)",
  },
  [ORIGENES_INICIO.CONFIRMADA]: {
    fondo: "var(--color-info-soft)",
    texto: "var(--color-info-text)",
    borde: "var(--color-info-border)",
  },
  [ORIGENES_INICIO.REAL]: {
    fondo: "var(--color-success-soft)",
    texto: "var(--color-success-text)",
    borde: "var(--color-success-border)",
  },
};

const COLOR_POR_DEFECTO = {
  fondo: "var(--color-surface-muted)",
  texto: "var(--color-text-muted)",
  borde: "var(--color-border)",
};

/**
 * Normaliza el valor recibido. Un valor ausente o desconocido devuelve `null`
 * para que la UI no muestre ningún chip.
 * @param {string|null|undefined} valor
 * @returns {"PROYECTADA"|"CONFIRMADA"|"REAL"|null}
 */
export function normalizarOrigenInicio(valor) {
  if (!valor) return null;
  const clave = String(valor).toUpperCase();
  return ORIGENES_INICIO[clave] || null;
}

/**
 * @param {object|null|undefined} actividad
 * @returns {boolean}
 */
export function esInicioProvisional(actividad) {
  return (
    normalizarOrigenInicio(actividad?.origenInicio) ===
    ORIGENES_INICIO.PROYECTADA
  );
}

/**
 * @param {string|null|undefined} valor
 * @returns {string} vacío si no corresponde mostrar chip
 */
export function etiquetaOrigenInicio(valor) {
  const origen = normalizarOrigenInicio(valor);
  return origen ? ETIQUETAS_ORIGEN_INICIO[origen] : "";
}

/**
 * @param {string|null|undefined} valor
 * @returns {string}
 */
export function detalleOrigenInicio(valor) {
  const origen = normalizarOrigenInicio(valor);
  return origen ? DETALLES_ORIGEN_INICIO[origen] : "";
}

/**
 * @param {string|null|undefined} valor
 * @returns {{fondo: string, texto: string, borde: string}}
 */
export function coloresOrigenInicio(valor) {
  const origen = normalizarOrigenInicio(valor);
  return origen ? COLORES_ORIGEN_INICIO[origen] : COLOR_POR_DEFECTO;
}

/**
 * Estilo para `:style`: fondo, texto y borde juntos.
 * @param {string|null|undefined} valor
 * @returns {{backgroundColor: string, color: string, borderColor: string}}
 */
export function estiloOrigenInicio(valor) {
  const colores = coloresOrigenInicio(valor);
  return {
    backgroundColor: colores.fondo,
    color: colores.texto,
    borderColor: colores.borde,
  };
}

/**
 * `true` si la actividad está en un estado que admite reprogramación.
 * La decisión depende del estado, nunca del origen (ficha §3).
 * @param {object|null|undefined} actividad
 * @returns {boolean}
 */
export function esReprogramable(actividad) {
  return (
    normalizarEstadoActividad(actividad?.estado) ===
    ESTADOS_ACTIVIDAD.PENDIENTE
  );
}
