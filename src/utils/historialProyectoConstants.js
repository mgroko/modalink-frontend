/*
 * Historial de membresías de un proyecto.
 *
 * Contrato backend vigente: `GET /proyectos/{idProyecto}/historial`.
 * Solo devuelve eventos de miembros eliminados o con baja voluntaria.
 */

export const TIPOS_EVENTO_HISTORIAL = {
  MIEMBRO_ELIMINADO: "MIEMBRO_ELIMINADO",
  MIEMBRO_BAJA_VOLUNTARIA: "MIEMBRO_BAJA_VOLUNTARIA",
};

export const ETIQUETAS_TIPO_EVENTO_HISTORIAL = {
  [TIPOS_EVENTO_HISTORIAL.MIEMBRO_ELIMINADO]: "Eliminado del proyecto",
  [TIPOS_EVENTO_HISTORIAL.MIEMBRO_BAJA_VOLUNTARIA]: "Baja voluntaria",
};

export const OPCIONES_TIPO_EVENTO_HISTORIAL = Object.entries(
  ETIQUETAS_TIPO_EVENTO_HISTORIAL
).map(([value, text]) => ({ value, text }));

export const COLORES_TIPO_EVENTO_HISTORIAL = {
  [TIPOS_EVENTO_HISTORIAL.MIEMBRO_ELIMINADO]: {
    fondo: "var(--color-danger-soft)",
    texto: "var(--color-danger-text)",
    borde: "var(--color-danger-border)",
  },
  [TIPOS_EVENTO_HISTORIAL.MIEMBRO_BAJA_VOLUNTARIA]: {
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

/**
 * @param {string|null|undefined} tipo
 * @returns {string}
 */
export function etiquetaTipoEventoHistorial(tipo) {
  const clave = String(tipo || "").toUpperCase();
  if (!clave) return "Movimiento";
  return (
    ETIQUETAS_TIPO_EVENTO_HISTORIAL[clave] ||
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
export function coloresTipoEventoHistorial(tipo) {
  const clave = String(tipo || "").toUpperCase();
  return COLORES_TIPO_EVENTO_HISTORIAL[clave] || COLOR_POR_DEFECTO;
}

/**
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function etiquetaEstadoParticipacionHistorial(estado) {
  const clave = String(estado || "").toUpperCase();
  if (clave === "ELIMINADO") return "Eliminado";
  if (clave === "BAJA_VOLUNTARIA") return "Baja voluntaria";
  if (clave === "ACTIVO") return "Activo";
  return clave ? clave.replace(/_/g, " ").toLowerCase() : "—";
}

function textoNombre(nombreArtistico, nombre, apellido) {
  const artistico = String(nombreArtistico || "").trim();
  if (artistico) return artistico;
  return [nombre, apellido]
    .map((parte) => String(parte || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

/**
 * @param {object|null|undefined} evento
 * @returns {string}
 */
export function nombreAfectadoHistorial(evento) {
  const nombre = textoNombre(
    evento?.nombreArtisticoAfectado,
    evento?.nombreUsuarioAfectado,
    evento?.apellidoUsuarioAfectado
  );
  return nombre || "—";
}

/**
 * @param {object|null|undefined} evento
 * @returns {string}
 */
export function nombreActorHistorial(evento) {
  const nombre = textoNombre(
    evento?.nombreArtisticoActor,
    evento?.nombreUsuarioActor,
    evento?.apellidoUsuarioActor
  );
  return nombre || "—";
}

/**
 * Normaliza un evento para que la UI no dependa de campos opcionales.
 * @param {object|null|undefined} evento
 * @param {number} indice
 * @returns {object}
 */
export function normalizarEventoHistorial(evento, indice = 0) {
  const dato = evento && typeof evento === "object" ? evento : {};
  const id = Number(dato.idEvento);
  return {
    clave:
      (Number.isFinite(id) && id > 0 ? `evento-${id}` : `evento-${indice}`) +
      `-${indice}`,
    idEvento: Number.isFinite(id) && id > 0 ? id : null,
    tipo: String(dato.tipo || "").toUpperCase(),
    fecha: dato.fecha ?? null,
    idPerfilAfectado: dato.idPerfilAfectado ?? null,
    nombreArtisticoAfectado: dato.nombreArtisticoAfectado ?? null,
    nombreUsuarioAfectado: dato.nombreUsuarioAfectado ?? null,
    apellidoUsuarioAfectado: dato.apellidoUsuarioAfectado ?? null,
    nombreProfesionAfectado: dato.nombreProfesionAfectado ?? null,
    rolAfectado: dato.rolAfectado ?? null,
    idUsuarioAfectado: dato.idUsuarioAfectado ?? null,
    idPerfilActor: dato.idPerfilActor ?? null,
    nombreArtisticoActor: dato.nombreArtisticoActor ?? null,
    nombreUsuarioActor: dato.nombreUsuarioActor ?? null,
    apellidoUsuarioActor: dato.apellidoUsuarioActor ?? null,
    idUsuarioActor: dato.idUsuarioActor ?? null,
    motivo: String(dato.motivo || "").trim() || null,
    estadoParticipacion: dato.estadoParticipacion ?? null,
    idActividad: dato.idActividad ?? null,
    nombreActividad: dato.nombreActividad ?? null,
  };
}

/**
 * @param {object|null|undefined} data
 * @returns {{
 *   contenido: object[],
 *   paginaActual: number,
 *   tamanoPagina: number,
 *   totalElementos: number,
 *   totalPaginas: number,
 *   primera: boolean,
 *   ultima: boolean
 * }}
 */
export function normalizarPaginaHistorial(data) {
  const dato = data && typeof data === "object" ? data : {};
  const contenido = Array.isArray(dato.contenido)
    ? dato.contenido.map((evento, indice) =>
        normalizarEventoHistorial(evento, indice)
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
 * `true` si el 404 corresponde a un proyecto inexistente.
 * @param {object} error error Axios
 * @returns {boolean}
 */
export function esHistorialNoDisponible(error) {
  return error?.response?.status === 404;
}

/**
 * @param {object} error error Axios
 * @param {string} [fallback]
 * @returns {string}
 */
export function mensajeErrorHistorial(
  error,
  fallback = "No se pudo cargar el historial del proyecto."
) {
  const status = error?.response?.status;
  const mensaje = String(error?.response?.data?.message || "").trim();

  if (esHistorialNoDisponible(error)) {
    return "El proyecto no existe o ya no está disponible.";
  }
  if (status === 403) {
    return mensaje || "No tenés permiso para ver el historial de este proyecto.";
  }
  if (status === 401) {
    return "Tu sesión expiró. Volvé a iniciar sesión.";
  }
  if (!status || status >= 500) {
    return mensaje || fallback;
  }
  return mensaje || fallback;
}
