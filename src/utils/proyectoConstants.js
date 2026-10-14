export const PRIVACIDADES = {
  PUBLICO: "PUBLICO",
  PRIVADO: "PRIVADO",
};

export const ETIQUETAS_PRIVACIDAD = {
  PUBLICO: "Público",
  PRIVADO: "Privado",
};

export const TIPOS_DATO_CARACTERISTICA = {
  NUMERICO: "NUMERICO",
  ENUMERADO: "ENUMERADO",
  TEXTO: "TEXTO",
};

export const ESTADOS_PROYECTO = {
  BORRADOR: "Borrador",
  PUBLICADO: "Publicado",
  CONFIRMADO: "Confirmado",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

export const ETIQUETAS_ESTADO_PROYECTO = Object.values(ESTADOS_PROYECTO);

/*
 * Paleta de estados (docs/pantallas/Pantallas - Modulo Proyecto/Estados proyecto.png).
 * `fondo`/`texto`/`borde` van juntos: el chip se pinta con los tres.
 * Claves = valor exacto que devuelve el backend en `proyecto.estado`.
 */
export const COLORES_ESTADO_PROYECTO = {
  [ESTADOS_PROYECTO.BORRADOR]: { fondo: "#F3F4F6", texto: "#485563", borde: "#D1D5DB" },
  [ESTADOS_PROYECTO.PUBLICADO]: { fondo: "#DBEAFE", texto: "#1E40AF", borde: "#93C5FD" },
  [ESTADOS_PROYECTO.CONFIRMADO]: { fondo: "#DCFCE7", texto: "#166534", borde: "#86EFAC" },
  [ESTADOS_PROYECTO.FINALIZADO]: { fondo: "#EDE9FE", texto: "#5B21B6", borde: "#C4B5FD" },
  [ESTADOS_PROYECTO.CANCELADO]: { fondo: "#FEE2E2", texto: "#991B1B", borde: "#FCA5A5" },
};

const COLORES_ESTADO_POR_DEFECTO = COLORES_ESTADO_PROYECTO[ESTADOS_PROYECTO.BORRADOR];

/**
 * Colores del chip para un estado (case-insensitive).
 * Estado desconocido → colores de Borrador, para no romper la UI.
 * @param {string} estado valor de `proyecto.estado`
 * @returns {{fondo: string, texto: string, borde: string}}
 */
export function coloresEstadoProyecto(estado) {
  if (!estado) return COLORES_ESTADO_POR_DEFECTO;
  const clave = Object.keys(COLORES_ESTADO_PROYECTO).find(
    (k) => k.toLowerCase() === String(estado).toLowerCase()
  );
  return clave ? COLORES_ESTADO_PROYECTO[clave] : COLORES_ESTADO_POR_DEFECTO;
}

/** Normaliza el estado del backend a la forma canónica ("publicado" → "Publicado"). */
export function normalizarEstadoProyecto(estado) {
  if (!estado) return ESTADOS_PROYECTO.BORRADOR;
  const clave = Object.keys(COLORES_ESTADO_PROYECTO).find(
    (k) => k.toLowerCase() === String(estado).toLowerCase()
  );
  return clave || String(estado);
}

export const LIMITES_PROYECTO = {
  NOMBRE: 50,
  DESCRIPCION: 200,
  OBJETIVO_NOMBRE: 100,
  OBJETIVO_DESCRIPCION: 300,
  REQUERIMIENTO_DESCRIPCION: 200,
  MOODBOARD_DESCRIPCION: 200,
};

export function esNumerico(tipoDato) {
  return String(tipoDato || "").toUpperCase() === TIPOS_DATO_CARACTERISTICA.NUMERICO;
}

export function esEnumerado(tipoDato) {
  return String(tipoDato || "").toUpperCase() === TIPOS_DATO_CARACTERISTICA.ENUMERADO;
}
