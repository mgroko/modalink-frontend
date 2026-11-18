import {
  ETIQUETAS_CARAC,
  ETIQUETAS_CARACTERISTICAS,
  ETIQUETAS_VALORES,
  UNIDADES_POR_CODIGO,
  normCodigo,
  simboloUnidad,
} from "./perfilConstants.js";

/*
 * Helpers de presentación de los requerimientos (formulario general y de
 * actividad): etiquetas, unidades, resumen del encabezado y selección de las
 * características que se ofrecen como atajo. Funciones puras y testeables.
 */

/** Códigos que se priorizan como atajos, en el orden en que se muestran. */
const GRUPOS_CARACTERISTICAS_RAPIDAS = [
  ["altura"],
  ["peso"],
  ["medida_pecho", "pecho", "busto"],
  ["medida_cintura", "cintura"],
  ["medida_cadera", "cadera"],
  ["talle_calzado", "talle"],
];

/** Cantidad máxima de atajos visibles antes de "Ver todas". */
export const MAXIMO_CARACTERISTICAS_RAPIDAS = 6;

/**
 * "MUY_OSCURA" → "Muy oscura", "medida pecho" → "Medida pecho".
 * Primera letra en mayúscula y el resto en minúscula.
 * @param {string} texto
 * @returns {string}
 */
export function capitalizar(texto) {
  const limpio = String(texto || "")
    .toLowerCase()
    .split(/[_\-.]+/)
    .filter(Boolean)
    .join(" ");
  if (!limpio) return "";
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

/**
 * Etiqueta visible de una característica del catálogo.
 * Usa el nombre corto (Pecho, Cintura…) y cae a la etiqueta larga o al código.
 * @param {{codigo?: string, nombre?: string}|null} caracteristica
 * @returns {string}
 */
export function etiquetaCaracteristica(caracteristica) {
  if (!caracteristica) return "";
  const codigo = normCodigo(caracteristica.codigo);
  return (
    ETIQUETAS_CARAC[codigo] ||
    ETIQUETAS_CARACTERISTICAS[codigo] ||
    capitalizar(caracteristica.nombre) ||
    capitalizar(codigo)
  );
}

/**
 * Etiqueta visible de un valor enumerado ("castano" → "Castaño").
 * @param {{codigo?: string, nombre?: string}|null} valor
 * @returns {string}
 */
export function etiquetaValor(valor) {
  if (!valor) return "";
  const codigo = normCodigo(valor.codigo);
  return ETIQUETAS_VALORES[codigo] || capitalizar(valor.nombre) || capitalizar(codigo);
}

/**
 * Símbolo de la unidad de la característica ("cm", "kg"…).
 * Prioriza la unidad que envía el sistema y cae al mapa por código.
 * @param {{codigo?: string, unidad?: object|string}|null} caracteristica
 * @returns {string}
 */
export function unidadCaracteristica(caracteristica) {
  if (!caracteristica) return "";
  return (
    simboloUnidad(caracteristica.unidad) ||
    simboloUnidad(UNIDADES_POR_CODIGO[normCodigo(caracteristica.codigo)]) ||
    ""
  );
}

/**
 * Pluraliza una profesión de una sola palabra. Las profesiones compuestas
 * ("Diseñador de moda") no se pluralizan de forma segura: el resumen usa el
 * fallback "N personas · Profesión".
 * @param {string} nombre
 * @returns {string}
 */
export function pluralizarProfesion(nombre) {
  const palabra = String(nombre || "").trim().toLowerCase();
  if (!palabra) return "";
  if (/[aeiouáéíóúü]$/.test(palabra)) return `${palabra}s`;
  if (/z$/.test(palabra)) return `${palabra.slice(0, -1)}ces`;
  if (/[lrnj]$/.test(palabra)) return `${palabra}es`;
  return `${palabra}s`;
}

/**
 * "2 modelos", "1 modelo", "2 personas · Diseñador de moda"…
 * @param {number|string} cantidad
 * @param {string} profesion
 * @returns {string}
 */
export function describirCantidadProfesion(cantidad, profesion) {
  const numero = Number(cantidad);
  const nombre = String(profesion || "").trim();
  if (!Number.isFinite(numero) || numero <= 0) return nombre;
  if (!nombre) return `${numero} ${numero === 1 ? "persona" : "personas"}`;

  const simple = /^[a-záéíóúüñ]+$/i.test(nombre);
  if (!simple) return `${numero} personas · ${nombre}`;
  if (numero === 1) return `1 ${nombre.toLowerCase()}`;
  return `${numero} ${pluralizarProfesion(nombre)}`;
}

/**
 * Subtítulo del encabezado: "2 modelos · 2 características · 1 habilidad".
 * Omite los conteos en cero y muestra sólo los datos disponibles.
 * @param {{cantidad?: number|string, profesion?: string,
 *          caracteristicas?: number, habilidades?: number}} datos
 * @returns {string}
 */
export function resumenRequerimiento({
  cantidad,
  profesion = "",
  caracteristicas = 0,
  habilidades = 0,
} = {}) {
  const partes = [];
  const personas = describirCantidadProfesion(cantidad, profesion);
  if (personas) partes.push(personas);

  const totalCaracteristicas = Number(caracteristicas) || 0;
  if (totalCaracteristicas > 0) {
    partes.push(
      `${totalCaracteristicas} ${
        totalCaracteristicas === 1 ? "característica" : "características"
      }`
    );
  }

  const totalHabilidades = Number(habilidades) || 0;
  if (totalHabilidades > 0) {
    partes.push(
      `${totalHabilidades} ${totalHabilidades === 1 ? "habilidad" : "habilidades"}`
    );
  }

  return partes.length ? partes.join(" · ") : "Sin datos cargados";
}

/**
 * Separa las características sugeridas como atajo del resto del catálogo.
 * Ignora las que ya están agregadas y respeta los códigos reales del sistema.
 * @param {object[]} catalogo características de la profesión
 * @param {number[]} agregadas ids ya presentes en el requerimiento
 * @param {number} [maximo] cantidad máxima de atajos
 * @returns {{rapidas: object[], resto: object[]}}
 */
export function seleccionarCaracteristicasRapidas(
  catalogo = [],
  agregadas = [],
  maximo = MAXIMO_CARACTERISTICAS_RAPIDAS
) {
  const yaAgregadas = new Set(agregadas);
  const disponibles = (Array.isArray(catalogo) ? catalogo : []).filter(
    (caracteristica) => !yaAgregadas.has(caracteristica.idCaracteristica)
  );

  const rapidas = [];
  for (const grupo of GRUPOS_CARACTERISTICAS_RAPIDAS) {
    if (rapidas.length >= maximo) break;
    const encontrada = disponibles.find((caracteristica) =>
      grupo.includes(normCodigo(caracteristica.codigo))
    );
    if (encontrada) rapidas.push(encontrada);
  }

  const idsRapidas = new Set(rapidas.map((c) => c.idCaracteristica));
  const resto = disponibles.filter((c) => !idsRapidas.has(c.idCaracteristica));

  return { rapidas, resto };
}
