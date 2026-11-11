/*
 * UC-69 Reportar publicación
 * (docs/backend/ficha-tecnica-reportar-publicacion.md).
 * Constantes compartidas por el modal de reporte y la bandeja administrativa.
 */

export const MOTIVOS_REPORTE_PUBLICACION = {
  SPAM: "SPAM",
  CONTENIDO_INAPROPIADO: "CONTENIDO_INAPROPIADO",
  IDENTIDAD_FALSA: "IDENTIDAD_FALSA",
  OTRO: "OTRO",
};

export const ETIQUETAS_MOTIVO_REPORTE_PUBLICACION = {
  [MOTIVOS_REPORTE_PUBLICACION.SPAM]: "Spam o publicidad engañosa",
  [MOTIVOS_REPORTE_PUBLICACION.CONTENIDO_INAPROPIADO]: "Contenido inapropiado",
  [MOTIVOS_REPORTE_PUBLICACION.IDENTIDAD_FALSA]: "Identidad falsa",
  [MOTIVOS_REPORTE_PUBLICACION.OTRO]: "Otro",
};

export const OPCIONES_MOTIVO_REPORTE_PUBLICACION = Object.entries(
  ETIQUETAS_MOTIVO_REPORTE_PUBLICACION
).map(([value, text]) => ({ value, text }));

export const OPCIONES_MOTIVO_FILTRO_REPORTE_PUBLICACION = [
  { text: "Todos los motivos", value: "" },
  ...OPCIONES_MOTIVO_REPORTE_PUBLICACION,
];

export const ESTADOS_REPORTE_PUBLICACION = {
  PENDIENTE: "PENDIENTE",
  RESUELTO: "RESUELTO",
  DESCARTADO: "DESCARTADO",
};

export const ETIQUETAS_ESTADO_REPORTE_PUBLICACION = {
  [ESTADOS_REPORTE_PUBLICACION.PENDIENTE]: "Pendiente de revisión",
  [ESTADOS_REPORTE_PUBLICACION.RESUELTO]: "Resuelto",
  [ESTADOS_REPORTE_PUBLICACION.DESCARTADO]: "Descartado",
};

export const COLORES_ESTADO_REPORTE_PUBLICACION = {
  [ESTADOS_REPORTE_PUBLICACION.PENDIENTE]: "warning",
  [ESTADOS_REPORTE_PUBLICACION.RESUELTO]: "success",
  [ESTADOS_REPORTE_PUBLICACION.DESCARTADO]: "info",
};

export const OPCIONES_ESTADO_REPORTE_PUBLICACION = [
  { text: "Todos los estados", value: "" },
  {
    text: ETIQUETAS_ESTADO_REPORTE_PUBLICACION[
      ESTADOS_REPORTE_PUBLICACION.PENDIENTE
    ],
    value: ESTADOS_REPORTE_PUBLICACION.PENDIENTE,
  },
  {
    text: ETIQUETAS_ESTADO_REPORTE_PUBLICACION[
      ESTADOS_REPORTE_PUBLICACION.RESUELTO
    ],
    value: ESTADOS_REPORTE_PUBLICACION.RESUELTO,
  },
  {
    text: ETIQUETAS_ESTADO_REPORTE_PUBLICACION[
      ESTADOS_REPORTE_PUBLICACION.DESCARTADO
    ],
    value: ESTADOS_REPORTE_PUBLICACION.DESCARTADO,
  },
];

export const ESTADO_REPORTE_PUBLICACION_POR_DEFECTO =
  ESTADOS_REPORTE_PUBLICACION.PENDIENTE;

export const LIMITE_DESCRIPCION_REPORTE_PUBLICACION = 200;

export const TAMANO_REPORTES_PUBLICACION_POR_DEFECTO = 20;

export const OPCIONES_TAMANO_REPORTES_PUBLICACION = [
  { text: "20 por página", value: 20 },
  { text: "50 por página", value: 50 },
  { text: "Ver todos", value: 0 },
];

/**
 * @param {string|null|undefined} motivo
 * @returns {boolean}
 */
export function requiereDescripcionReportePublicacion(motivo) {
  return motivo === MOTIVOS_REPORTE_PUBLICACION.OTRO;
}

/**
 * @param {string|null|undefined} motivo
 * @returns {string}
 */
export function etiquetaMotivoReportePublicacion(motivo) {
  if (!motivo) return "—";
  return ETIQUETAS_MOTIVO_REPORTE_PUBLICACION[motivo] || String(motivo);
}

/**
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function etiquetaEstadoReportePublicacion(estado) {
  if (!estado) return "—";
  return ETIQUETAS_ESTADO_REPORTE_PUBLICACION[estado] || String(estado);
}

/**
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function colorEstadoReportePublicacion(estado) {
  return COLORES_ESTADO_REPORTE_PUBLICACION[estado] || "info";
}

/**
 * @param {object} [filtros]
 * @param {string} [filtros.estado]
 * @param {string} [filtros.motivo]
 * @param {string} [filtros.fechaDesde] YYYY-MM-DD
 * @param {string} [filtros.fechaHasta] YYYY-MM-DD
 * @param {number} [filtros.pagina] base 0
 * @param {number} [filtros.tamano] 0 = todos
 * @returns {Record<string, unknown>}
 */
export function construirParamsReportesPublicacion(filtros = {}) {
  const {
    estado,
    motivo,
    fechaDesde,
    fechaHasta,
    pagina = 0,
    tamano = TAMANO_REPORTES_PUBLICACION_POR_DEFECTO,
  } = filtros;

  const params = {};
  if (estado) params.estado = estado;
  if (motivo) params.motivo = motivo;
  if (fechaDesde) params.fechaDesde = fechaDesde;
  if (fechaHasta) params.fechaHasta = fechaHasta;

  const cantidad = Number(tamano);
  if (cantidad === 0) {
    params.todos = true;
    return params;
  }

  params.page = Math.max(0, Number(pagina) || 0);
  params.size =
    cantidad > 0 ? cantidad : TAMANO_REPORTES_PUBLICACION_POR_DEFECTO;
  return params;
}
