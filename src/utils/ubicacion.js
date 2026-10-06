function normalizar(texto) {
  return String(texto ?? "")
    .trim()
    .toLowerCase();
}

/**
 * Formatea una CiudadResponse como "Ciudad, Provincia, País".
 * Solo lee el modelo nuevo anidado (sin fallback al modelo plano viejo).
 * @param {{nombre?: string, provincia?: {nombre?: string, pais?: {nombre?: string}}}|null} ciudad
 * @returns {string|null} null si no hay ciudad o no tiene nombre
 */
export function formatCiudad(ciudad) {
  if (!ciudad?.nombre) return null;
  const partes = [
    ciudad.nombre,
    ciudad.provincia?.nombre,
    ciudad.provincia?.pais?.nombre,
  ];
  return partes.filter(Boolean).join(", ") || null;
}

/**
 * Formatea la ubicación de cualquier respuesta que traiga `ciudad` anidada:
 * UbicacionResponse, DatosPersonalesResponse.ubicacion, PerfilResponse, etc.
 * @param {{ciudad?: object}|null|undefined} origen
 * @returns {string|null} "Ciudad, Provincia, País" o null si no hay ubicación
 */
export function formatUbicacion(origen) {
  return formatCiudad(origen?.ciudad);
}

/**
 * Decide si un texto libre de búsqueda corresponde al catálogo Georef.
 * Prioridad: provincia > localidad (más amplio primero).
 * La comparación replica el `contains` case-insensitive del backend.
 *
 * @param {string} texto Texto escrito por el usuario en el buscador
 * @param {Array<{nombre?: string}>} provincias Catálogo de provincias
 * @param {Array<{nombre?: string}>} localidades Resultados de
 *        GET /ubicaciones/localidades?nombre={texto} (vacío si aún no se consultó)
 * @returns {{tipo: "provincia"|"localidad", valor: string}|null} null si no coincide
 *         con el catálogo (el texto debe buscarse por nombre artístico)
 */
export function resolverUbicacionTexto(texto, provincias = [], localidades = []) {
  const t = normalizar(texto);
  if (!t) return null;

  const esProvincia = provincias.some((p) => normalizar(p?.nombre).includes(t));
  if (esProvincia) return { tipo: "provincia", valor: texto.trim() };

  const esLocalidad = localidades.some((l) => normalizar(l?.nombre).includes(t));
  if (esLocalidad) return { tipo: "localidad", valor: texto.trim() };

  return null;
}
