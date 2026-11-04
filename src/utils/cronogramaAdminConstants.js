import { mensajeErrorApi } from "./apiError.js";

/*
 * Contrato de la pantalla administrativa de cronogramas
 * (docs/backend/ficha-tecnica-asignacion-provisional-y-conflictos.md §7).
 *
 * Los fallos de reparación llegan dentro de `errores` con HTTP 200: no son
 * errores de la petición. Sólo 400/403/500 se tratan como error.
 */

export const LIMITE_PROYECTOS_DEFAULT = 50;

function numero(valor, porDefecto = 0) {
  const total = Number(valor);
  return Number.isFinite(total) ? total : porDefecto;
}

/**
 * @param {unknown} item
 * @returns {{
 *   idProyecto: number|string|null,
 *   nombreProyecto: string,
 *   idActividad: number|string|null,
 *   nombreActividad: string,
 *   tipo: string,
 *   detalle: string,
 *   inicioActual: string|null,
 *   finMaximoPredecesoras: string|null
 * }}
 */
export function normalizarInconsistencia(item) {
  const dato = item && typeof item === "object" ? item : {};
  return {
    idProyecto: dato.idProyecto ?? null,
    nombreProyecto: String(dato.nombreProyecto || "").trim(),
    idActividad: dato.idActividad ?? null,
    nombreActividad: String(dato.nombreActividad || "").trim(),
    tipo: String(dato.tipo || "").trim(),
    detalle: String(dato.detalle || "").trim(),
    inicioActual: dato.inicioActual ?? null,
    finMaximoPredecesoras: dato.finMaximoPredecesoras ?? null,
  };
}

/**
 * @param {unknown} lista
 * @returns {Array<ReturnType<typeof normalizarInconsistencia>>}
 */
export function normalizarInconsistencias(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .map(normalizarInconsistencia)
    .filter(
      (item) =>
        item.idProyecto != null ||
        item.idActividad != null ||
        item.tipo ||
        item.detalle
    );
}

/**
 * @param {unknown} data
 * @returns {{
 *   dryRun: boolean,
 *   totalDetectadas: number,
 *   totalReparadas: number,
 *   totalFallidas: number,
 *   inconsistencias: Array<object>,
 *   errores: string[]
 * }}
 */
export function normalizarRespuestaReparacion(data) {
  const dato = data && typeof data === "object" ? data : {};
  const errores = Array.isArray(dato.errores)
    ? dato.errores.map((error) => String(error || "").trim()).filter(Boolean)
    : [];

  return {
    dryRun: dato.dryRun === true,
    totalDetectadas: numero(dato.totalDetectadas),
    totalReparadas: numero(dato.totalReparadas),
    totalFallidas: numero(dato.totalFallidas),
    inconsistencias: normalizarInconsistencias(dato.inconsistencias),
    errores,
  };
}

/**
 * Etiqueta legible para `tipo`. El backend no documenta un enum cerrado, por
 * eso se muestra el valor recibido en lugar de traducirlo a ciegas.
 * @param {string|null|undefined} tipo
 * @returns {string}
 */
export function etiquetaTipoInconsistencia(tipo) {
  const texto = String(tipo || "").trim();
  if (!texto) return "—";
  const legible = texto.replace(/_/g, " ").toLowerCase();
  return legible.charAt(0).toUpperCase() + legible.slice(1);
}

/**
 * @param {ReturnType<typeof normalizarRespuestaReparacion>|null} resultado
 * @returns {string}
 */
export function mensajeResultadoReparacion(resultado) {
  if (!resultado) return "";
  const { dryRun, totalDetectadas, totalReparadas, totalFallidas } = resultado;

  if (dryRun) {
    if (!totalDetectadas) return "No se detectaron inconsistencias para reparar.";
    return `Simulación: ${totalDetectadas} inconsistencia(s) detectada(s), ${totalReparadas} se repararían y ${totalFallidas} quedarían pendientes.`;
  }

  if (!totalDetectadas) return "No había inconsistencias para reparar.";
  if (totalFallidas > 0) {
    return `Se repararon ${totalReparadas} de ${totalDetectadas} inconsistencias. ${totalFallidas} requieren intervención manual.`;
  }
  return `Se repararon las ${totalReparadas} inconsistencias detectadas.`;
}

/**
 * @param {object} error error Axios
 * @param {string} [fallback]
 * @returns {string}
 */
export function mensajeErrorCronograma(
  error,
  fallback = "No se pudieron procesar los cronogramas."
) {
  const status = error?.response?.status;

  if (status === 403) {
    return "No tenés permiso para administrar los cronogramas del sistema.";
  }

  if (status === 400) {
    return "La solicitud de reparación no es válida. Revisá los filtros.";
  }

  if (!status || status >= 500) {
    return "Ocurrió un error al procesar los cronogramas. Inténtalo nuevamente.";
  }

  return mensajeErrorApi(error, fallback);
}
