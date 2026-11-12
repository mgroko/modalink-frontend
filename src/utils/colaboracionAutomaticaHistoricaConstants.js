/*
 * Constantes y normalización del procesamiento histórico de colaboraciones
 * automáticas (docs/backend/ficha-tecnica-colaboraciones-automaticas-historicas.md).
 *
 * El backend ejecuta el job asíncrono. Este módulo es puro: prepara filtros,
 * normaliza respuestas y traduce estados/errores para la UI.
 */

import { validarRangoFechas } from "./parametrosPostulaciones.js";

export const MODOS_PROCESAMIENTO_HISTORICO = {
  HUELLAS: "HUELLAS",
  DETECCION: "DETECCION",
  AMBOS: "AMBOS",
};

export const ESTADOS_PROCESAMIENTO_HISTORICO = {
  PENDIENTE: "PENDIENTE",
  EN_PROGRESO: "EN_PROGRESO",
  COMPLETADO: "COMPLETADO",
  COMPLETADO_CON_ERRORES: "COMPLETADO_CON_ERRORES",
  CANCELADO: "CANCELADO",
  FALLIDO: "FALLIDO",
  INTERRUMPIDO: "INTERRUMPIDO",
};

export const ETIQUETAS_MODO_PROCESAMIENTO = {
  [MODOS_PROCESAMIENTO_HISTORICO.HUELLAS]: "Solo completar huellas",
  [MODOS_PROCESAMIENTO_HISTORICO.DETECCION]: "Solo detectar coincidencias",
  [MODOS_PROCESAMIENTO_HISTORICO.AMBOS]: "Huellas + detección",
};

export const ETIQUETAS_ESTADO_PROCESAMIENTO = {
  [ESTADOS_PROCESAMIENTO_HISTORICO.PENDIENTE]: "Pendiente",
  [ESTADOS_PROCESAMIENTO_HISTORICO.EN_PROGRESO]: "En progreso",
  [ESTADOS_PROCESAMIENTO_HISTORICO.COMPLETADO]: "Completado",
  [ESTADOS_PROCESAMIENTO_HISTORICO.COMPLETADO_CON_ERRORES]:
    "Completado con errores",
  [ESTADOS_PROCESAMIENTO_HISTORICO.CANCELADO]: "Cancelado",
  [ESTADOS_PROCESAMIENTO_HISTORICO.FALLIDO]: "Fallido",
  [ESTADOS_PROCESAMIENTO_HISTORICO.INTERRUMPIDO]: "Interrumpido",
};

export const COLORES_ESTADO_PROCESAMIENTO = {
  [ESTADOS_PROCESAMIENTO_HISTORICO.PENDIENTE]: "warning",
  [ESTADOS_PROCESAMIENTO_HISTORICO.EN_PROGRESO]: "info",
  [ESTADOS_PROCESAMIENTO_HISTORICO.COMPLETADO]: "success",
  [ESTADOS_PROCESAMIENTO_HISTORICO.COMPLETADO_CON_ERRORES]: "warning",
  [ESTADOS_PROCESAMIENTO_HISTORICO.CANCELADO]: "info",
  [ESTADOS_PROCESAMIENTO_HISTORICO.FALLIDO]: "danger",
  [ESTADOS_PROCESAMIENTO_HISTORICO.INTERRUMPIDO]: "danger",
};

export const OPCIONES_MODO_PROCESAMIENTO = [
  {
    text: "Huellas + detección (recomendado)",
    value: MODOS_PROCESAMIENTO_HISTORICO.AMBOS,
  },
  {
    text: "Solo completar huellas",
    value: MODOS_PROCESAMIENTO_HISTORICO.HUELLAS,
  },
  {
    text: "Solo detectar coincidencias",
    value: MODOS_PROCESAMIENTO_HISTORICO.DETECCION,
  },
];

export const OPCIONES_ESTADO_PROCESAMIENTO = [
  { text: "Todos los estados", value: "" },
  ...Object.values(ESTADOS_PROCESAMIENTO_HISTORICO).map((value) => ({
    text: ETIQUETAS_ESTADO_PROCESAMIENTO[value],
    value,
  })),
];

export const OPCIONES_TAMANO_PAGINA_PROCESAMIENTOS = [
  { text: "10 por página", value: 10 },
  { text: "20 por página", value: 20 },
  { text: "50 por página", value: 50 },
];

export const TAMANO_PAGINA_PROCESAMIENTOS_DEFAULT = 10;
export const TAMANO_PAGINA_ERRORES_DEFAULT = 20;
export const TAMANO_LOTE_DEFAULT = 50;
export const INTERVALO_POLLING_MS = 5000;

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function numeroNullable(valor) {
  if (valor == null || valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function texto(valor) {
  return String(valor || "").trim();
}

/**
 * @param {string|null|undefined} estado
 * @returns {string|null}
 */
export function normalizarEstadoProcesamiento(estado) {
  return (
    ESTADOS_PROCESAMIENTO_HISTORICO[
      String(estado || "").toUpperCase()
    ] || null
  );
}

/**
 * @param {string|null|undefined} modo
 * @returns {string|null}
 */
export function normalizarModoProcesamiento(modo) {
  return (
    MODOS_PROCESAMIENTO_HISTORICO[String(modo || "").toUpperCase()] || null
  );
}

/**
 * @param {string|null|undefined} estado
 * @returns {boolean}
 */
export function esProcesamientoActivo(estado) {
  const normalizado = normalizarEstadoProcesamiento(estado);
  return [
    ESTADOS_PROCESAMIENTO_HISTORICO.PENDIENTE,
    ESTADOS_PROCESAMIENTO_HISTORICO.EN_PROGRESO,
  ].includes(normalizado);
}

/**
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function etiquetaEstadoProcesamiento(estado) {
  const normalizado = normalizarEstadoProcesamiento(estado);
  return normalizado ? ETIQUETAS_ESTADO_PROCESAMIENTO[normalizado] : "—";
}

/**
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function colorEstadoProcesamiento(estado) {
  const normalizado = normalizarEstadoProcesamiento(estado);
  return normalizado ? COLORES_ESTADO_PROCESAMIENTO[normalizado] : "info";
}

/**
 * @param {string|null|undefined} modo
 * @returns {string}
 */
export function etiquetaModoProcesamiento(modo) {
  const normalizado = normalizarModoProcesamiento(modo);
  return normalizado ? ETIQUETAS_MODO_PROCESAMIENTO[normalizado] : "—";
}

/**
 * @param {object|null|undefined} data
 * @returns {object|null}
 */
export function normalizarProcesamientoHistorico(data) {
  if (!data) return null;

  const idProcesamiento = Number(data.idProcesamiento);
  if (!Number.isFinite(idProcesamiento) || idProcesamiento <= 0) return null;

  const estado =
    normalizarEstadoProcesamiento(data.estado) || texto(data.estado) || null;
  const modo = normalizarModoProcesamiento(data.modo) || texto(data.modo) || null;

  return {
    ...data,
    idProcesamiento,
    estado,
    modo,
    filtroIdPublicacion: numeroNullable(
      data.filtroIdPublicacion ?? data.idPublicacion
    ),
    filtroIdPerfil: numeroNullable(data.filtroIdPerfil ?? data.idPerfil),
    filtroFechaDesde: data.filtroFechaDesde ?? data.fechaDesde ?? null,
    filtroFechaHasta: data.filtroFechaHasta ?? data.fechaHasta ?? null,
    notificar: data.notificar === true,
    tamanoLote: numero(data.tamanoLote) || TAMANO_LOTE_DEFAULT,
    limitePublicaciones: numeroNullable(data.limitePublicaciones),
    totalPublicaciones: numero(data.totalPublicaciones),
    publicacionesProcesadas: numero(data.publicacionesProcesadas),
    totalImagenes: numero(data.totalImagenes),
    imagenesProcesadas: numero(data.imagenesProcesadas),
    hashesCalculados: numero(data.hashesCalculados),
    propuestasCreadas: numero(data.propuestasCreadas),
    propuestasOmitidas: numero(data.propuestasOmitidas),
    errores: numero(data.errores),
    ultimoIdPublicacion: numeroNullable(data.ultimoIdPublicacion),
    idUsuarioAdmin: numeroNullable(data.idUsuarioAdmin),
    fechaInicio: data.fechaInicio || null,
    fechaFin: data.fechaFin || null,
    mensajeError: texto(data.mensajeError),
  };
}

/**
 * @param {object|Array|null|undefined} data
 * @returns {{contenido: object[], paginaActual: number, tamanoPagina: number,
 *   totalElementos: number, totalPaginas: number, primera: boolean,
 *   ultima: boolean}}
 */
export function normalizarPaginaProcesamientosHistoricos(data) {
  if (Array.isArray(data)) {
    const contenido = data
      .map(normalizarProcesamientoHistorico)
      .filter(Boolean);
    return {
      contenido,
      paginaActual: 0,
      tamanoPagina: contenido.length || TAMANO_PAGINA_PROCESAMIENTOS_DEFAULT,
      totalElementos: contenido.length,
      totalPaginas: contenido.length > 0 ? 1 : 0,
      primera: true,
      ultima: true,
    };
  }

  const contenido = (
    Array.isArray(data?.contenido) ? data.contenido : []
  )
    .map(normalizarProcesamientoHistorico)
    .filter(Boolean);

  return {
    contenido,
    paginaActual: Number(data?.paginaActual) || 0,
    tamanoPagina:
      Number(data?.tamanoPagina) || TAMANO_PAGINA_PROCESAMIENTOS_DEFAULT,
    totalElementos: Number.isFinite(Number(data?.totalElementos))
      ? Number(data.totalElementos)
      : contenido.length,
    totalPaginas:
      Number(data?.totalPaginas) || (contenido.length > 0 ? 1 : 0),
    primera: data?.primera !== false,
    ultima: data?.ultima !== false,
  };
}

/**
 * @param {object|null|undefined} data
 * @returns {object|null}
 */
export function normalizarPreviewHistorica(data) {
  if (!data) return null;

  return {
    publicaciones: numero(data.publicaciones),
    imagenes: numero(data.imagenes),
    imagenesSinSha256: numero(data.imagenesSinSha256),
    imagenesSinPhash: numero(data.imagenesSinPhash),
    imagenesIlegibles: numero(data.imagenesIlegibles),
    paresCandidatosEstimados: numero(data.paresCandidatosEstimados),
  };
}

/**
 * @param {object|null|undefined} data
 * @returns {object|null}
 */
export function normalizarErrorProcesamientoHistorico(data) {
  if (!data) return null;

  const idError = Number(data.idError);
  if (!Number.isFinite(idError) || idError <= 0) return null;

  return {
    ...data,
    idError,
    idPublicacion: numeroNullable(data.idPublicacion),
    idImagen: numeroNullable(data.idImagen),
    nombreArchivo: texto(data.nombreArchivo) || null,
    mensaje: texto(data.mensaje) || "Error sin detalle.",
    fechaRegistro: data.fechaRegistro || null,
  };
}

/**
 * @param {object|Array|null|undefined} data
 * @returns {{contenido: object[], paginaActual: number, tamanoPagina: number,
 *   totalElementos: number, totalPaginas: number, primera: boolean,
 *   ultima: boolean}}
 */
export function normalizarPaginaErroresHistoricos(data) {
  if (Array.isArray(data)) {
    const contenido = data
      .map(normalizarErrorProcesamientoHistorico)
      .filter(Boolean);
    return {
      contenido,
      paginaActual: 0,
      tamanoPagina: contenido.length || TAMANO_PAGINA_ERRORES_DEFAULT,
      totalElementos: contenido.length,
      totalPaginas: contenido.length > 0 ? 1 : 0,
      primera: true,
      ultima: true,
    };
  }

  const contenido = (
    Array.isArray(data?.contenido) ? data.contenido : []
  )
    .map(normalizarErrorProcesamientoHistorico)
    .filter(Boolean);

  return {
    contenido,
    paginaActual: Number(data?.paginaActual) || 0,
    tamanoPagina: Number(data?.tamanoPagina) || TAMANO_PAGINA_ERRORES_DEFAULT,
    totalElementos: Number.isFinite(Number(data?.totalElementos))
      ? Number(data.totalElementos)
      : contenido.length,
    totalPaginas:
      Number(data?.totalPaginas) || (contenido.length > 0 ? 1 : 0),
    primera: data?.primera !== false,
    ultima: data?.ultima !== false,
  };
}

/**
 * @param {number} [tamano]
 * @returns {{paginaActual: number, tamanoPagina: number, totalElementos: number,
 *   totalPaginas: number, primera: boolean, ultima: boolean}}
 */
export function paginacionProcesamientosInicial(
  tamano = TAMANO_PAGINA_PROCESAMIENTOS_DEFAULT
) {
  return {
    paginaActual: 0,
    tamanoPagina: tamano,
    totalElementos: 0,
    totalPaginas: 0,
    primera: true,
    ultima: true,
  };
}

/**
 * @param {object} filtros
 * @returns {object}
 */
export function construirPayloadPreviewHistorica(filtros = {}) {
  return {
    modo:
      normalizarModoProcesamiento(filtros.modo) ||
      MODOS_PROCESAMIENTO_HISTORICO.AMBOS,
    idPublicacion: numeroNullable(filtros.idPublicacion),
    idPerfil: numeroNullable(filtros.idPerfil),
    fechaDesde: filtros.fechaDesde || null,
    fechaHasta: filtros.fechaHasta || null,
    limitePublicaciones: numeroNullable(filtros.limitePublicaciones),
  };
}

/**
 * @param {object} filtros
 * @returns {object}
 */
export function construirPayloadProcesamientoHistorico(filtros = {}) {
  return {
    ...construirPayloadPreviewHistorica(filtros),
    notificar: filtros.notificar === true,
    tamanoLote: Number(filtros.tamanoLote) || TAMANO_LOTE_DEFAULT,
  };
}

/**
 * @param {object} filtros
 * @returns {string} mensaje de error o "" si es válido
 */
export function validarFiltrosProcesamientoHistorico(filtros = {}) {
  if (!normalizarModoProcesamiento(filtros.modo)) {
    return "Seleccioná un modo de procesamiento.";
  }

  const errorFechas = validarRangoFechas(
    filtros.fechaDesde,
    filtros.fechaHasta
  );
  if (errorFechas) return errorFechas;

  const tamanoLote = Number(filtros.tamanoLote);
  if (!Number.isInteger(tamanoLote) || tamanoLote < 1) {
    return "El tamaño de lote debe ser un entero mayor a 0.";
  }

  if (
    filtros.limitePublicaciones != null &&
    filtros.limitePublicaciones !== ""
  ) {
    const limite = Number(filtros.limitePublicaciones);
    if (!Number.isInteger(limite) || limite < 1) {
      return "El límite de publicaciones debe ser un entero mayor a 0.";
    }
  }

  return "";
}

/**
 * @param {unknown} error
 * @param {string} [fallback]
 * @returns {string}
 */
export function mensajeErrorProcesamientoHistorico(
  error,
  fallback = "No se pudo completar la operación. Intentá nuevamente."
) {
  const status = error?.response?.status;
  const mensaje = texto(error?.response?.data?.message);

  if (status === 400) {
    return mensaje || "Revisá los filtros ingresados.";
  }
  if (status === 403) {
    return mensaje || "No tenés permisos para administrar este procesamiento.";
  }
  if (status === 404) {
    return mensaje || "El procesamiento no existe o ya no está disponible.";
  }
  if (status === 409) {
    return mensaje || fallback;
  }
  if (status === 422) {
    return mensaje || "No hay publicaciones que cumplan los filtros.";
  }
  if (!status || status >= 500) {
    return mensaje || fallback;
  }
  return mensaje || fallback;
}

/**
 * @param {number} procesadas
 * @param {number} total
 * @returns {number} porcentaje 0..100
 */
export function porcentajeProgreso(procesadas, total) {
  const totalNumero = Number(total);
  if (!Number.isFinite(totalNumero) || totalNumero <= 0) return 0;
  const procesadasNumero = Number(procesadas) || 0;
  return Math.min(
    100,
    Math.max(0, Math.round((procesadasNumero / totalNumero) * 100))
  );
}
