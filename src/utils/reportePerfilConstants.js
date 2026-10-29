/*
 * UC-15 Reportar perfil (docs/backend/ficha-tecnica-reportar-perfil.md).
 * Constantes compartidas entre el modal de reporte y la bandeja administrativa.
 */

export const MOTIVOS_REPORTE_PERFIL = {
  SPAM: "SPAM",
  CONTENIDO_OFENSIVO: "CONTENIDO_OFENSIVO",
  SUPLANTACION: "SUPLANTACION",
  PERFIL_FALSO: "PERFIL_FALSO",
  OTRO: "OTRO",
};

export const ETIQUETAS_MOTIVO_REPORTE_PERFIL = {
  [MOTIVOS_REPORTE_PERFIL.SPAM]: "Spam o publicidad engañosa",
  [MOTIVOS_REPORTE_PERFIL.CONTENIDO_OFENSIVO]:
    "Contenido ofensivo o inapropiado",
  [MOTIVOS_REPORTE_PERFIL.SUPLANTACION]: "Suplantación de identidad",
  [MOTIVOS_REPORTE_PERFIL.PERFIL_FALSO]: "Perfil falso o fraudulento",
  [MOTIVOS_REPORTE_PERFIL.OTRO]: "Otro",
};

export const OPCIONES_MOTIVO_REPORTE_PERFIL = Object.entries(
  ETIQUETAS_MOTIVO_REPORTE_PERFIL
).map(([value, text]) => ({ value, text }));

export const OPCIONES_MOTIVO_FILTRO_REPORTE_PERFIL = [
  { text: "Todos los motivos", value: "" },
  ...OPCIONES_MOTIVO_REPORTE_PERFIL,
];

export const ESTADOS_REPORTE_PERFIL = {
  PENDIENTE: "PENDIENTE",
  RESUELTO: "RESUELTO",
  DESCARTADO: "DESCARTADO",
};

export const ETIQUETAS_ESTADO_REPORTE_PERFIL = {
  [ESTADOS_REPORTE_PERFIL.PENDIENTE]: "Pendiente",
  [ESTADOS_REPORTE_PERFIL.RESUELTO]: "Resuelto",
  [ESTADOS_REPORTE_PERFIL.DESCARTADO]: "Descartado",
};

export const COLORES_ESTADO_REPORTE_PERFIL = {
  [ESTADOS_REPORTE_PERFIL.PENDIENTE]: "warning",
  [ESTADOS_REPORTE_PERFIL.RESUELTO]: "success",
  [ESTADOS_REPORTE_PERFIL.DESCARTADO]: "info",
};

export const OPCIONES_ESTADO_REPORTE_PERFIL = [
  { text: "Todos los estados", value: "" },
  { text: "Pendiente", value: ESTADOS_REPORTE_PERFIL.PENDIENTE },
  { text: "Resuelto", value: ESTADOS_REPORTE_PERFIL.RESUELTO },
  { text: "Descartado", value: ESTADOS_REPORTE_PERFIL.DESCARTADO },
];

export const ESTADO_REPORTE_POR_DEFECTO = ESTADOS_REPORTE_PERFIL.PENDIENTE;

export const LIMITE_DESCRIPCION_REPORTE_PERFIL = 200;

export const TAMANO_REPORTES_POR_DEFECTO = 20;

export const OPCIONES_TAMANO_REPORTES = [
  { text: "20 por página", value: 20 },
  { text: "50 por página", value: 50 },
  { text: "Ver todos", value: 0 },
];

/**
 * @param {string|null|undefined} motivo
 * @returns {string}
 */
export function etiquetaMotivoReportePerfil(motivo) {
  if (!motivo) return "—";
  return ETIQUETAS_MOTIVO_REPORTE_PERFIL[motivo] || String(motivo);
}

/**
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function etiquetaEstadoReportePerfil(estado) {
  if (!estado) return "—";
  return ETIQUETAS_ESTADO_REPORTE_PERFIL[estado] || String(estado);
}

/**
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function colorEstadoReportePerfil(estado) {
  return COLORES_ESTADO_REPORTE_PERFIL[estado] || "info";
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
export function construirParamsReportesPerfil(filtros = {}) {
  const {
    estado,
    motivo,
    fechaDesde,
    fechaHasta,
    pagina = 0,
    tamano = TAMANO_REPORTES_POR_DEFECTO,
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
    cantidad > 0 ? cantidad : TAMANO_REPORTES_POR_DEFECTO;
  return params;
}
