/*
 * Constantes y normalización de colaboraciones automáticas
 * (docs/backend/ficha-tecnica-colaboraciones-automaticas.md).
 *
 * El backend propone una colaboración recíproca cuando dos publicaciones
 * comparten una imagen. La propuesta solo se activa cuando ambos dueños
 * confirman. Este módulo es puro: no depende de Vue ni del router.
 */

export const ESTADOS_COLABORACION_AUTOMATICA = {
  PENDIENTE: "PENDIENTE",
  CONFIRMADA: "CONFIRMADA",
  RECHAZADA: "RECHAZADA",
  CANCELADA: "CANCELADA",
  DISUELTA: "DISUELTA",
};

export const ESTADO_PUBLICACION_ELIMINADA = "ELIMINADA";

export const ACCIONES_COLABORACION_AUTOMATICA = {
  CONFIRMAR: "confirmar",
  RECHAZAR: "rechazar",
};

export const ETIQUETAS_ESTADO_COLABORACION_AUTOMATICA = {
  [ESTADOS_COLABORACION_AUTOMATICA.PENDIENTE]: "Pendiente",
  [ESTADOS_COLABORACION_AUTOMATICA.CONFIRMADA]: "Confirmada",
  [ESTADOS_COLABORACION_AUTOMATICA.RECHAZADA]: "Rechazada",
  [ESTADOS_COLABORACION_AUTOMATICA.CANCELADA]: "Cancelada",
  [ESTADOS_COLABORACION_AUTOMATICA.DISUELTA]: "Disuelta",
};

export const COLORES_ESTADO_COLABORACION_AUTOMATICA = {
  [ESTADOS_COLABORACION_AUTOMATICA.PENDIENTE]: {
    fondo: "var(--color-warning-soft)",
    texto: "var(--color-warning-text)",
    borde: "var(--color-warning-border)",
  },
  [ESTADOS_COLABORACION_AUTOMATICA.CONFIRMADA]: {
    fondo: "var(--color-success-soft)",
    texto: "var(--color-success-text)",
    borde: "var(--color-success-border)",
  },
  [ESTADOS_COLABORACION_AUTOMATICA.RECHAZADA]: {
    fondo: "var(--color-danger-soft)",
    texto: "var(--color-danger-text)",
    borde: "var(--color-danger-border)",
  },
  [ESTADOS_COLABORACION_AUTOMATICA.CANCELADA]: {
    fondo: "var(--color-surface-muted)",
    texto: "var(--color-text-muted)",
    borde: "var(--color-border-strong)",
  },
  [ESTADOS_COLABORACION_AUTOMATICA.DISUELTA]: {
    fondo: "var(--color-info-soft)",
    texto: "var(--color-info-text)",
    borde: "var(--color-info-border)",
  },
};

export const TAMANO_PAGINA_COLABORACIONES_AUTOMATICAS = 20;

export const OPCIONES_TAMANO_COLABORACIONES_AUTOMATICAS = [
  { text: "20 por página", value: 20 },
  { text: "50 por página", value: 50 },
];

const MENSAJES_ERROR_POR_ESTADO = {
  400: "Revisá los filtros ingresados.",
  403: "El perfil activo no participa de esta propuesta.",
  404: "La propuesta no existe o ya no está disponible.",
  409: "La propuesta ya fue respondida, ya no está pendiente o la publicación no está disponible.",
};

/**
 * @param {string|null|undefined} estado
 * @returns {"PENDIENTE"|"CONFIRMADA"|"RECHAZADA"|"CANCELADA"|"DISUELTA"|null}
 */
export function normalizarEstadoColaboracionAutomatica(estado) {
  return (
    ESTADOS_COLABORACION_AUTOMATICA[
      String(estado || "").toUpperCase()
    ] || null
  );
}

/**
 * Normaliza una publicación del listado. Si fue eliminada, el backend puede
 * enviar los datos en `null`; la UI muestra el aviso sin imagen ni enlace.
 * @param {object|null|undefined} publicacion
 * @returns {object|null}
 */
export function normalizarPublicacionColaboracionAutomatica(publicacion) {
  if (!publicacion) return null;

  const estado = String(publicacion.estado || "").toUpperCase();
  const eliminada =
    publicacion.eliminada === true ||
    estado === ESTADO_PUBLICACION_ELIMINADA;

  return {
    ...publicacion,
    idPublicacion: eliminada ? null : publicacion.idPublicacion ?? null,
    titulo: eliminada ? null : publicacion.titulo ?? null,
    portadaUrl: eliminada ? null : publicacion.portadaUrl ?? null,
    estado: eliminada
      ? ESTADO_PUBLICACION_ELIMINADA
      : publicacion.estado || null,
    eliminada,
  };
}

/**
 * Garantiza estados canónicos, flags booleanos y publicaciones normalizadas.
 * @param {object|null|undefined} colaboracion
 * @returns {object|null}
 */
export function normalizarColaboracionAutomatica(colaboracion) {
  if (!colaboracion) return null;

  return {
    ...colaboracion,
    estado:
      normalizarEstadoColaboracionAutomatica(colaboracion.estado) ||
      colaboracion.estado ||
      null,
    miEstado:
      normalizarEstadoColaboracionAutomatica(colaboracion.miEstado) ||
      normalizarEstadoColaboracionAutomatica(colaboracion.estado) ||
      colaboracion.miEstado ||
      null,
    estadoContraparte:
      normalizarEstadoColaboracionAutomatica(
        colaboracion.estadoContraparte
      ) ||
      normalizarEstadoColaboracionAutomatica(colaboracion.estado) ||
      colaboracion.estadoContraparte ||
      null,
    publicacionPropia: normalizarPublicacionColaboracionAutomatica(
      colaboracion.publicacionPropia
    ),
    publicacionContraparte: normalizarPublicacionColaboracionAutomatica(
      colaboracion.publicacionContraparte
    ),
    perfilContraparte: colaboracion.perfilContraparte || null,
    imagen: colaboracion.imagen || null,
    puedeConfirmar: colaboracion.puedeConfirmar === true,
    puedeRechazar: colaboracion.puedeRechazar === true,
  };
}

export function paginacionColaboracionesAutomaticasInicial() {
  return {
    paginaActual: 0,
    tamanoPagina: TAMANO_PAGINA_COLABORACIONES_AUTOMATICAS,
    totalElementos: 0,
    totalPaginas: 0,
    primera: true,
    ultima: true,
  };
}

/**
 * Tolera tanto una página Spring (`contenido`, `paginaActual`, ...) como un
 * array plano, por si el contrato cambia.
 * @param {object|Array|null|undefined} data
 * @returns {object[]}
 */
export function contenidoColaboracionesAutomaticas(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.contenido) ? data.contenido : [];
}

/**
 * @param {object|Array|null|undefined} data
 * @returns {{paginaActual:number,tamanoPagina:number,totalElementos:number,totalPaginas:number,primera:boolean,ultima:boolean}}
 */
export function normalizarPaginaColaboracionesAutomaticas(data) {
  if (Array.isArray(data)) {
    const total = data.length;
    return {
      paginaActual: 0,
      tamanoPagina: total || TAMANO_PAGINA_COLABORACIONES_AUTOMATICAS,
      totalElementos: total,
      totalPaginas: total > 0 ? 1 : 0,
      primera: true,
      ultima: true,
    };
  }

  const contenido = contenidoColaboracionesAutomaticas(data);
  const total = Number(data?.totalElementos);

  return {
    paginaActual: Number(data?.paginaActual) || 0,
    tamanoPagina:
      Number(data?.tamanoPagina) ||
      TAMANO_PAGINA_COLABORACIONES_AUTOMATICAS,
    totalElementos: Number.isFinite(total) ? total : contenido.length,
    totalPaginas:
      Number(data?.totalPaginas) || (contenido.length > 0 ? 1 : 0),
    primera: data?.primera !== false,
    ultima: data?.ultima !== false,
  };
}

/**
 * Traduce un error de la API a un mensaje legible. La ficha no documenta
 * códigos de negocio para este módulo: se prioriza el mensaje del backend y,
 * si no existe, un texto por HTTP status.
 * @param {object|null|undefined} error
 * @param {string} [fallback]
 * @returns {string}
 */
export function mensajeErrorColaboracionAutomatica(
  error,
  fallback = "No se pudo completar la operación."
) {
  const status = Number(error?.response?.status);
  const mensajeBackend = error?.response?.data?.message;
  return mensajeBackend || MENSAJES_ERROR_POR_ESTADO[status] || fallback;
}

/**
 * Explica el estado de la propuesta según lo que hizo cada parte.
 * @param {object|null|undefined} colaboracion
 * @param {string} [nombreContraparte]
 * @returns {string}
 */
export function descripcionEstadoColaboracionAutomatica(
  colaboracion,
  nombreContraparte
) {
  if (!colaboracion) return "";

  const estado = normalizarEstadoColaboracionAutomatica(
    colaboracion.estado
  );
  const miEstado = normalizarEstadoColaboracionAutomatica(
    colaboracion.miEstado
  );
  const suEstado = normalizarEstadoColaboracionAutomatica(
    colaboracion.estadoContraparte
  );
  const nombre = nombreContraparte || "la contraparte";

  if (estado === ESTADOS_COLABORACION_AUTOMATICA.PENDIENTE) {
    if (miEstado === ESTADOS_COLABORACION_AUTOMATICA.CONFIRMADA) {
      return suEstado === ESTADOS_COLABORACION_AUTOMATICA.CONFIRMADA
        ? "Ambos confirmaron. La colaboración se está activando."
        : `Ya confirmaste. Falta que ${nombre} confirme.`;
    }
    if (suEstado === ESTADOS_COLABORACION_AUTOMATICA.CONFIRMADA) {
      return `${nombre} ya confirmó. Falta tu confirmación.`;
    }
    return "La colaboración se activa cuando ambos perfiles confirman.";
  }

  if (estado === ESTADOS_COLABORACION_AUTOMATICA.CONFIRMADA) {
    return "La colaboración está activa en ambas publicaciones.";
  }

  if (estado === ESTADOS_COLABORACION_AUTOMATICA.RECHAZADA) {
    return "La propuesta fue rechazada y no se agregaron colaboradores.";
  }

  if (estado === ESTADOS_COLABORACION_AUTOMATICA.CANCELADA) {
    return "La propuesta se canceló porque una publicación o imagen ya no está disponible.";
  }

  if (estado === ESTADOS_COLABORACION_AUTOMATICA.DISUELTA) {
    return "La colaboración se disolvió porque un perfil se quitó como colaborador.";
  }

  return "";
}
