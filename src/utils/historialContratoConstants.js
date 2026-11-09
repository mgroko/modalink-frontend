/*
 * Historial de contratos de un proyecto.
 *
 * Contrato backend: `GET /proyectos/{idProyecto}/historial/contratos`.
 * El Director ve todos los contratos del proyecto; un miembro ve únicamente
 * los eventos de los contratos donde su perfil es o fue parte firmante.
 */

export const TIPOS_EVENTO_CONTRATO = {
  CREADO: "CREADO",
  EMITIDO: "EMITIDO",
  MODIFICADO: "MODIFICADO",
  FIRMADO: "FIRMADO",
  RECHAZADO: "RECHAZADO",
  ACTIVADO: "ACTIVADO",
  CANCELADO: "CANCELADO",
  ELIMINADO: "ELIMINADO",
  FIRMA_CANCELADA: "FIRMA_CANCELADA",
  FIRMA_INVALIDADA: "FIRMA_INVALIDADA",
  MIEMBRO_BAJA: "MIEMBRO_BAJA",
};

export const ETIQUETAS_TIPO_EVENTO_CONTRATO = {
  [TIPOS_EVENTO_CONTRATO.CREADO]: "Contrato creado",
  [TIPOS_EVENTO_CONTRATO.EMITIDO]: "Contrato emitido",
  [TIPOS_EVENTO_CONTRATO.MODIFICADO]: "Contrato modificado",
  [TIPOS_EVENTO_CONTRATO.FIRMADO]: "Firma registrada",
  [TIPOS_EVENTO_CONTRATO.RECHAZADO]: "Contrato rechazado",
  [TIPOS_EVENTO_CONTRATO.ACTIVADO]: "Contrato activado",
  [TIPOS_EVENTO_CONTRATO.CANCELADO]: "Contrato cancelado",
  [TIPOS_EVENTO_CONTRATO.ELIMINADO]: "Contrato eliminado",
  [TIPOS_EVENTO_CONTRATO.FIRMA_CANCELADA]: "Firma cancelada",
  [TIPOS_EVENTO_CONTRATO.FIRMA_INVALIDADA]: "Firma invalidada",
  [TIPOS_EVENTO_CONTRATO.MIEMBRO_BAJA]: "Baja de miembro firmante",
};

export const OPCIONES_TIPO_EVENTO_CONTRATO = Object.entries(
  ETIQUETAS_TIPO_EVENTO_CONTRATO
).map(([value, text]) => ({ value, text }));

export const COLORES_TIPO_EVENTO_CONTRATO = {
  [TIPOS_EVENTO_CONTRATO.CREADO]: {
    fondo: "var(--color-info-soft)",
    texto: "var(--color-info-text)",
    borde: "var(--color-info-border)",
  },
  [TIPOS_EVENTO_CONTRATO.EMITIDO]: {
    fondo: "var(--color-info-soft)",
    texto: "var(--color-info-text)",
    borde: "var(--color-info-border)",
  },
  [TIPOS_EVENTO_CONTRATO.MODIFICADO]: {
    fondo: "var(--color-warning-soft)",
    texto: "var(--color-warning-text)",
    borde: "var(--color-warning-border)",
  },
  [TIPOS_EVENTO_CONTRATO.FIRMADO]: {
    fondo: "var(--color-success-soft)",
    texto: "var(--color-success-text)",
    borde: "var(--color-success-border)",
  },
  [TIPOS_EVENTO_CONTRATO.RECHAZADO]: {
    fondo: "var(--color-danger-soft)",
    texto: "var(--color-danger-text)",
    borde: "var(--color-danger-border)",
  },
  [TIPOS_EVENTO_CONTRATO.ACTIVADO]: {
    fondo: "var(--color-success-soft)",
    texto: "var(--color-success-text)",
    borde: "var(--color-success-border)",
  },
  [TIPOS_EVENTO_CONTRATO.CANCELADO]: {
    fondo: "var(--color-surface-muted)",
    texto: "var(--color-text-muted)",
    borde: "var(--color-border)",
  },
  [TIPOS_EVENTO_CONTRATO.ELIMINADO]: {
    fondo: "var(--color-danger-soft)",
    texto: "var(--color-danger-text)",
    borde: "var(--color-danger-border)",
  },
  [TIPOS_EVENTO_CONTRATO.FIRMA_CANCELADA]: {
    fondo: "var(--color-surface-muted)",
    texto: "var(--color-text-muted)",
    borde: "var(--color-border)",
  },
  [TIPOS_EVENTO_CONTRATO.FIRMA_INVALIDADA]: {
    fondo: "var(--color-danger-soft)",
    texto: "var(--color-danger-text)",
    borde: "var(--color-danger-border)",
  },
  [TIPOS_EVENTO_CONTRATO.MIEMBRO_BAJA]: {
    fondo: "var(--color-warning-soft)",
    texto: "var(--color-warning-text)",
    borde: "var(--color-warning-border)",
  },
};

const COLOR_POR_DEFECTO = {
  fondo: "var(--color-surface-muted)",
  texto: "var(--color-text-muted)",
  borde: "var(--color-border)",
};

const ETIQUETAS_ESTADO_PROYECTO = {
  BORRADOR: "Borrador",
  PUBLICADO: "Publicado",
  CONFIRMADO: "Confirmado",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

/**
 * @param {string|null|undefined} tipo
 * @returns {string}
 */
export function etiquetaTipoEventoContrato(tipo) {
  const clave = String(tipo || "").toUpperCase();
  if (!clave) return "Evento";
  return (
    ETIQUETAS_TIPO_EVENTO_CONTRATO[clave] ||
    clave
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/^./, (letra) => letra.toUpperCase())
  );
}

/**
 * @param {string|null|undefined} tipo
 * @returns {{fondo: string, texto: string, borde: string}}
 */
export function coloresTipoEventoContrato(tipo) {
  const clave = String(tipo || "").toUpperCase();
  return COLORES_TIPO_EVENTO_CONTRATO[clave] || COLOR_POR_DEFECTO;
}

/**
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function etiquetaEstadoProyectoContrato(estado) {
  const clave = String(estado || "").toUpperCase();
  return ETIQUETAS_ESTADO_PROYECTO[clave] || clave || "—";
}

/**
 * @param {object|null|undefined} evento
 * @param {number} indice
 * @returns {object}
 */
export function normalizarEventoContrato(evento, indice = 0) {
  const dato = evento && typeof evento === "object" ? evento : {};
  const id = Number(dato.idEvento);
  const idContrato = Number(dato.idContrato);
  return {
    clave:
      (Number.isFinite(id) && id > 0 ? `evento-contrato-${id}` : `evento-contrato-${indice}`) +
      `-${indice}`,
    idEvento: Number.isFinite(id) && id > 0 ? id : null,
    idContrato: Number.isFinite(idContrato) && idContrato > 0 ? idContrato : null,
    nombreContrato: dato.nombreContrato || "",
    idProyecto: dato.idProyecto ?? null,
    nombreProyecto: dato.nombreProyecto || "",
    idTipoAcuerdo: dato.idTipoAcuerdo ?? null,
    codigoTipoAcuerdo: dato.codigoTipoAcuerdo || "",
    nombreTipoAcuerdo: dato.nombreTipoAcuerdo || "",
    tipoEvento: String(dato.tipoEvento || "").toUpperCase(),
    fechaHora: dato.fechaHora || null,
    idMiembro: dato.idMiembro ?? null,
    idPerfil: dato.idPerfil ?? null,
    nombreParte: String(dato.nombreParte || "").trim() || null,
    idUsuario: dato.idUsuario ?? null,
    nombreOperador: String(dato.nombreOperador || "").trim() || null,
    version: dato.version ?? null,
    motivo: String(dato.motivo || "").trim() || null,
    estadoContrato: String(dato.estadoContrato || "").toUpperCase(),
    estadoProyecto: String(dato.estadoProyecto || "").toUpperCase(),
    fechaBaja: dato.fechaBaja || null,
  };
}

/**
 * @param {object|null|undefined} data
 * @returns {{contenido: object[], paginaActual: number, tamanoPagina: number, totalElementos: number, totalPaginas: number, primera: boolean, ultima: boolean}}
 */
export function normalizarPaginaHistorialContratos(data) {
  const dato = data && typeof data === "object" ? data : {};
  const contenido = Array.isArray(dato.contenido)
    ? dato.contenido.map((evento, indice) =>
        normalizarEventoContrato(evento, indice)
      )
    : [];

  const totalElementos = Number(dato.totalElementos);
  const tamanoPagina = Number(dato.tamanoPagina);
  const totalPaginas = Number(dato.totalPaginas);
  const paginaActual = Number(dato.paginaActual);

  return {
    contenido,
    paginaActual: Number.isFinite(paginaActual) ? paginaActual : 0,
    tamanoPagina: Number.isFinite(tamanoPagina) ? tamanoPagina : 20,
    totalElementos: Number.isFinite(totalElementos)
      ? totalElementos
      : contenido.length,
    totalPaginas: Number.isFinite(totalPaginas)
      ? totalPaginas
      : contenido.length > 0
        ? 1
        : 0,
    primera: dato.primera !== false,
    ultima: dato.ultima !== false,
  };
}

/**
 * @param {string|null|undefined} valor
 * @returns {string}
 */
export function mensajeErrorHistorialContratos(
  error,
  fallback = "No se pudo cargar el historial de contratos."
) {
  const status = error?.response?.status;
  const mensaje = String(error?.response?.data?.message || "").trim();

  if (status === 403) {
    return mensaje || "No tenés permiso para ver el historial de contratos.";
  }
  if (status === 404) {
    return mensaje || "El proyecto no existe o ya no está disponible.";
  }
  if (status === 401) {
    return "Tu sesión expiró. Volvé a iniciar sesión.";
  }
  return mensaje || fallback;
}
