/*
 * Constantes y normalización de polaroids de perfil (UC-10/11/14).
 * El catálogo de tipos siempre viene del backend: no se hardcodea.
 */

export const MODOS_FORM_POLAROID = {
  CREAR: "crear",
  REEMPLAZAR: "reemplazar",
  TIPO: "tipo",
};

export const POLAROID_MAX_FALLBACK = 8;
export const POLAROID_MAX_BYTES = 10 * 1024 * 1024;
export const POLAROID_FORMATOS = ["image/jpeg", "image/png", "image/webp"];
export const POLAROID_EXTENSIONES = ["jpg", "jpeg", "png", "webp"];

/**
 * @param {object|null|undefined} perfil
 * @returns {boolean}
 */
export function esPerfilModelo(perfil) {
  const profesion = String(
    perfil?.profesion ||
      perfil?.profesionPrincipal ||
      perfil?.profesiones?.[0]?.nombre ||
      ""
  )
    .trim()
    .toUpperCase();

  return profesion === "MODELO";
}

/**
 * @param {object|null|undefined} perfil
 * @returns {boolean}
 */
export function esPerfilActivo(perfil) {
  return perfil?.estado === "Activo";
}

/**
 * @param {object|null|undefined} polaroid
 * @returns {object|null}
 */
export function normalizarPolaroid(polaroid) {
  if (!polaroid) return null;

  return {
    ...polaroid,
    idPolaroid: polaroid.idPolaroid ?? null,
    idImagen: polaroid.idImagen ?? null,
    url: polaroid.url || null,
    orden: Number(polaroid.orden) || 0,
    fechaRegistro: polaroid.fechaRegistro || null,
    tipo: polaroid.tipo
      ? {
          ...polaroid.tipo,
          idTipoPolaroid: polaroid.tipo.idTipoPolaroid ?? null,
          codigo: polaroid.tipo.codigo || "",
          nombre: polaroid.tipo.nombre || "",
          nombreCompleto:
            polaroid.tipo.nombreCompleto || polaroid.tipo.nombre || "",
        }
      : null,
  };
}

/**
 * @param {object|null|undefined} data
 * @returns {{idPerfil:number|null,maximo:number,total:number,polaroids:object[]}}
 */
export function normalizarListadoPolaroids(data) {
  const lista = Array.isArray(data?.polaroids)
    ? data.polaroids.map(normalizarPolaroid).filter(Boolean)
    : [];
  const maximo = Number(data?.maximo);
  const total = Number(data?.total);

  return {
    idPerfil: data?.idPerfil ?? null,
    maximo:
      Number.isFinite(maximo) && maximo > 0
        ? maximo
        : POLAROID_MAX_FALLBACK,
    total: Number.isFinite(total) ? total : lista.length,
    polaroids: lista.sort((a, b) => a.orden - b.orden),
  };
}

/**
 * Aplana el catálogo agrupado que devuelve `GET /polaroids/tipos`.
 * @param {Array<{idGrupoPolaroid?:number,codigo?:string,nombre?:string,tipos?:object[]}>|null|undefined} catalogo
 * @returns {{grupos:Array<object>,tipos:Array<object>}}
 */
export function prepararCatalogoPolaroids(catalogo) {
  const grupos = (Array.isArray(catalogo) ? catalogo : []).map((grupo) => ({
    ...grupo,
    tipos: Array.isArray(grupo?.tipos)
      ? grupo.tipos.map((tipo) => ({
          ...tipo,
          nombreCompleto:
            tipo?.nombreCompleto || tipo?.nombre || "Tipo de polaroid",
          grupoNombre: grupo?.nombre || "",
        }))
      : [],
  }));

  return {
    grupos,
    tipos: grupos.flatMap((grupo) => grupo.tipos),
  };
}

/**
 * @param {File|null|undefined} archivo
 * @returns {string} mensaje de error o ""
 */
export function validarArchivoPolaroid(archivo) {
  if (!archivo) return "Seleccioná una imagen.";

  const tipo = String(archivo.type || "").toLowerCase();
  const extension = String(archivo.name || "")
    .split(".")
    .pop()
    .toLowerCase();
  const formatoValido =
    POLAROID_FORMATOS.includes(tipo) ||
    POLAROID_EXTENSIONES.includes(extension);

  if (!formatoValido) {
    return "La imagen debe ser JPG, PNG o WebP.";
  }

  if (Number(archivo.size) > POLAROID_MAX_BYTES) {
    return "La imagen no puede superar los 10 MB.";
  }

  return "";
}

/**
 * @param {number|string|null|undefined} bytes
 * @returns {string}
 */
export function formatearPesoArchivo(bytes) {
  const total = Number(bytes);
  if (!Number.isFinite(total) || total <= 0) return "";
  if (total < 1024) return `${total} B`;
  if (total < 1024 * 1024) return `${Math.round(total / 1024)} KB`;
  return `${(total / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * @param {object|null|undefined} error
 * @param {string} [fallback]
 * @returns {string}
 */
export function mensajeErrorPolaroid(
  error,
  fallback = "No se pudo completar la operación."
) {
  const status = error?.response?.status;
  const mensaje = error?.response?.data?.message;

  if (mensaje) return mensaje;
  if (status === 400) {
    return "La imagen o los datos enviados no son válidos.";
  }
  if (status === 403) {
    return "No tenés permiso para gestionar estas polaroids.";
  }
  if (status === 404) {
    return "La polaroid o el perfil ya no están disponibles.";
  }
  if (status === 409) {
    return "No se pudo completar la operación con el estado actual del perfil.";
  }
  if (status >= 500) {
    return "No se pudo guardar la polaroid. Intentá nuevamente.";
  }
  return fallback;
}
