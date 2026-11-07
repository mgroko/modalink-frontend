const VALORACIONES = [5, 4, 3, 2, 1];

/**
 * @typedef {Object} DistribucionResena
 * @property {number} valoracion
 * @property {number} cantidad
 */

/**
 * @typedef {Object} ResumenResenas
 * @property {number} promedio
 * @property {number} total
 * @property {DistribucionResena[]} distribucion
 */

/**
 * Normaliza el resumen de reseñas y garantiza las cinco barras (5 a 1).
 * @param {unknown} resumen
 * @returns {ResumenResenas}
 */
export function normalizarResumen(resumen) {
  const data = resumen && typeof resumen === "object" ? resumen : {};
  const filas = Array.isArray(data.distribucion) ? data.distribucion : [];
  const cantidades = new Map();

  for (const fila of filas) {
    const valoracion = Number(fila?.valoracion);
    const cantidad = Number(fila?.cantidad);
    if (VALORACIONES.includes(valoracion)) {
      cantidades.set(valoracion, Number.isFinite(cantidad) ? cantidad : 0);
    }
  }

  return {
    promedio: numeroSeguro(data.promedio),
    total: numeroSeguro(data.total),
    distribucion: VALORACIONES.map((valoracion) => ({
      valoracion,
      cantidad: cantidades.get(valoracion) || 0,
    })),
  };
}

/**
 * Normaliza una reseña con defaults seguros para la UI.
 * @param {unknown} resena
 */
export function normalizarResena(resena) {
  const data = resena && typeof resena === "object" ? resena : {};
  const emisor = data.emisor && typeof data.emisor === "object" ? data.emisor : {};
  const proyecto = data.proyecto && typeof data.proyecto === "object" ? data.proyecto : {};

  return {
    idCalificacion: data.idCalificacion ?? null,
    valoracion: numeroSeguro(data.valoracion),
    resenia: typeof data.resenia === "string" ? data.resenia : "",
    fechaRegistro: data.fechaRegistro || null,
    emisor: {
      idPerfil: emisor.idPerfil ?? null,
      nombreArtistico:
        typeof emisor.nombreArtistico === "string"
          ? emisor.nombreArtistico.trim()
          : "",
      profesion:
        typeof emisor.profesion === "string" ? emisor.profesion.trim() : "",
      fotoUrl: emisor.fotoUrl || null,
    },
    proyecto: {
      idProyecto: proyecto.idProyecto ?? null,
      nombre: typeof proyecto.nombre === "string" ? proyecto.nombre.trim() : "",
    },
  };
}

/**
 * Nombre visible del autor: solo nombre artístico, con fallback neutro.
 * @param {{nombreArtistico?: string}|null|undefined} emisor
 * @returns {string}
 */
export function nombreAutor(emisor) {
  const nombre = String(emisor?.nombreArtistico || "").trim();
  return nombre || "Perfil";
}

/**
 * Iniciales para el avatar cuando no hay foto.
 * @param {string|null|undefined} nombre
 * @returns {string}
 */
export function iniciales(nombre) {
  const partes = String(nombre || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) return "?";

  const primera = partes[0].charAt(0);
  const segunda = partes.length > 1 ? partes[1].charAt(0) : "";
  return `${primera}${segunda}`.toUpperCase();
}

/**
 * Porcentaje entero de una barra de distribución.
 * @param {number} cantidad
 * @param {number} total
 * @returns {number}
 */
export function porcentaje(cantidad, total) {
  const totalSeguro = numeroSeguro(total);
  if (totalSeguro <= 0) return 0;
  return Math.round((numeroSeguro(cantidad) / totalSeguro) * 100);
}

/**
 * Promedio con un decimal, como en el mockup.
 * @param {number} valor
 * @returns {string}
 */
export function formatearPromedio(valor) {
  return numeroSeguro(valor).toFixed(1);
}

/**
 * Estrellas llenas a partir del promedio.
 * @param {number} promedio
 * @returns {number}
 */
export function estrellasLlenas(promedio) {
  return Math.max(0, Math.min(5, Math.round(numeroSeguro(promedio))));
}

/**
 * Texto del contador de reseñas.
 * @param {number} total
 * @returns {string}
 */
export function textoTotalResenas(total) {
  const cantidad = numeroSeguro(total);
  return `${cantidad} reseña${cantidad === 1 ? "" : "s"}`;
}

function numeroSeguro(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : 0;
}
