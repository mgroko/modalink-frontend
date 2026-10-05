export const ESTADOS_PERFIL = {
  ACTIVO: "Activo",
  PENDIENTE_BAJA: "PendienteBaja",
  DESHABILITADO: "Deshabilitado",
  BAJA: "Baja",
};

export const ETIQUETAS_CARACTERISTICAS = {
  altura: "Altura",
  peso: "Peso",
  medida_pecho: "Medida de pecho",
  pecho: "Medida de pecho",
  busto: "Medida de pecho",
  medida_cintura: "Medida de cintura",
  cintura: "Medida de cintura",
  medida_cadera: "Medida de cadera",
  cadera: "Medida de cadera",
  color_piel: "Color de piel",
  piel: "Color de piel",
  color_cabello: "Color de cabello",
  cabello: "Color de cabello",
  pelo: "Color de cabello",
  color_ojos: "Color de ojos",
  ojos: "Color de ojos",
  talle: "Talle",
  talle_calzado: "Talle de calzado",
};

export const ETIQUETAS_CARAC = {
  color_piel: "Color de piel",
  piel: "Color de piel",
  color_ojos: "Color de ojos",
  ojos: "Color de ojos",
  color_cabello: "Color de cabello",
  cabello: "Color de cabello",
  pelo: "Color de cabello",
  tipo_cabello: "Tipo de cabello",
  tipo_de_cabello: "Tipo de cabello",
  tipo_cabello_2: "Tipo de cabello",
  altura: "Altura",
  medida_pecho: "Pecho",
  pecho: "Pecho",
  busto: "Pecho",
  medida_cintura: "Cintura",
  cintura: "Cintura",
  medida_cadera: "Cadera",
  cadera: "Cadera",
};

export const ETIQUETAS_VALORES = {
  marron: "Marrón",
  marrón: "Marrón",
  negro: "Negro",
  caoba: "Caoba",
  castanio: "Castaño",
  castano: "Castaño",
  castaño: "Castaño",
  rubio: "Rubio",
  rubia: "Rubia",
  pelirrojo: "Pelirrojo",
  pelirroja: "Pelirroja",
  otto: "Otro",
  otro: "Otro",
  celeste: "Celeste",
  verde: "Verde",
  azul: "Azul",
  gris: "Gris",
  blanco: "Blanco",
  avellana: "Avellana",
  miel: "Miel",
  clara: "Clara",
  media: "Media",
  oscura: "Oscura",
  muy_clara: "Muy clara",
  muy_oscura: "Muy oscura",
};

export const ORDEN_PRIORIDAD = {
  altura: 10,
  medida_pecho: 20,
  pecho: 20,
  busto: 20,
  medida_cintura: 21,
  cintura: 21,
  medida_cadera: 22,
  cadera: 22,
  color_piel: 30,
  piel: 30,
  color_cabello: 31,
  cabello: 31,
  pelo: 31,
  color_ojos: 32,
  ojos: 32,
};

export const ORDEN_CARAC = {
  color_piel: 10,
  piel: 10,
  color_ojos: 20,
  ojos: 20,
  color_cabello: 30,
  cabello: 30,
  pelo: 30,
  tipo_cabello: 40,
  tipo_de_cabello: 40,
  tipo_cabello_2: 40,
  altura: 100,
  medida_pecho: 200,
  pecho: 200,
  busto: 200,
  medida_cintura: 210,
  cintura: 210,
  medida_cadera: 220,
  cadera: 220,
};

export const CODIGOS_ALTURA = ["altura"];
export const CODIGOS_MEDIDAS = ["medida_pecho", "pecho", "busto", "medida_cintura", "cintura", "medida_cadera", "cadera"];
export const CODIGOS_PIEL_OJOS = ["color_piel", "piel", "color_ojos", "ojos"];
export const CODIGOS_CABELLO_TIPO = ["color_cabello", "cabello", "pelo", "tipo_cabello", "tipo_de_cabello", "tipo_cabello_2"];
export const TODOS_CODIGOS = [
  ...CODIGOS_ALTURA,
  ...CODIGOS_MEDIDAS,
  ...CODIGOS_PIEL_OJOS,
  ...CODIGOS_CABELLO_TIPO,
];

export const UNIDADES_POR_CODIGO = {
  altura: "cm",
  medida_pecho: "cm",
  pecho: "cm",
  busto: "cm",
  medida_cintura: "cm",
  cintura: "cm",
  medida_cadera: "cm",
  cadera: "cm",
};

export function normCodigo(codigo) {
  return (codigo || "").toLowerCase().trim();
}

export function normTexto(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function inLista(codigo, lista) {
  return lista.some((c) => normCodigo(c) === normCodigo(codigo));
}
