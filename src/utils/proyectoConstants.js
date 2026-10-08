export const PRIVACIDADES = {
  PUBLICO: "PUBLICO",
  PRIVADO: "PRIVADO",
  OCULTO: "OCULTO",
};

export const ETIQUETAS_PRIVACIDAD = {
  PUBLICO: "Público",
  PRIVADO: "Privado",
  OCULTO: "Oculto",
};

export const TIPOS_DATO_CARACTERISTICA = {
  NUMERICO: "NUMERICO",
  ENUMERADO: "ENUMERADO",
  TEXTO: "TEXTO",
};

export const ESTADOS_PROYECTO = {
  BORRADOR: "Borrador",
};

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
