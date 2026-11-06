/**
 * Serializa query params respetando claves repetidas para arrays, tal como
 * exige UC-52/UC-74 (`estado=PENDIENTE&estado=ACEPTADA`), sin el formato
 * `estado[]`.
 *
 * Los valores `undefined`, `null` y `""` se omiten.
 * @param {Record<string, unknown>} params
 * @returns {string}
 */
export function serializarParams(params = {}) {
  const search = new URLSearchParams();

  for (const [clave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === "") continue;

    if (Array.isArray(valor)) {
      for (const item of valor) {
        if (item === undefined || item === null || item === "") continue;
        search.append(clave, String(item));
      }
      continue;
    }

    search.append(clave, String(valor));
  }

  return search.toString();
}
