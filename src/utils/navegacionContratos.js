/*
 * Navegación con retorno para el flujo de contratos.
 *
 * El detalle y la edición de un contrato se abren desde varios orígenes:
 * listado global (`/contratos`), bandeja de pendientes
 * (`/contratos/pendientes`), pestaña Contratos del proyecto y pestaña Historial
 * del proyecto. Para volver al lugar exacto donde estaba el usuario, las
 * pantallas que navegan al detalle propagan la ruta de origen en el query
 * param `volver` (ruta interna completa, con sus filtros y página).
 *
 * El valor se valida contra una allowlist antes de navegar: nunca se usa como
 * redirección arbitraria.
 */

export const CLAVE_VOLVER = "volver";

/** Rutas internas que pueden actuar como origen. */
const NOMBRES_ORIGEN_PERMITIDOS = new Set([
  "buscar-contratos",
  "contratos-pendientes",
  "dashboard-proyecto",
]);

/** Pestañas del proyecto que admiten contratos. */
const TABS_PROYECTO_PERMITIDAS = new Set(["contratos", "historial"]);

function primerValor(valor) {
  return Array.isArray(valor) ? valor[0] : valor;
}

/**
 * Ruta de retorno a partir de la ubicación actual.
 * Devuelve `null` cuando la pantalla actual no es un origen válido.
 *
 * @param {import('vue-router').RouteLocationNormalizedLoaded|{fullPath?: string, name?: string}} route
 * @returns {string|null}
 */
export function crearRutaVolver(route) {
  if (!route || typeof route.fullPath !== "string") return null;
  if (!NOMBRES_ORIGEN_PERMITIDOS.has(route.name)) return null;

  const fullPath = route.fullPath;
  if (!fullPath.startsWith("/") || fullPath.startsWith("//")) return null;

  return fullPath;
}

/**
 * Valor crudo de `volver` guardado en la ubicación actual.
 *
 * @param {import('vue-router').RouteLocationNormalizedLoaded|undefined} route
 * @returns {string|null}
 */
export function leerVolver(route) {
  const crudo = primerValor(route?.query?.[CLAVE_VOLVER]);
  return typeof crudo === "string" && crudo ? crudo : null;
}

/**
 * Resuelve el destino de retorno guardado en `query.volver`.
 * Devuelve el fallback cuando falta o cuando no es un destino permitido.
 *
 * @param {object} opciones
 * @param {import('vue-router').RouteLocationNormalizedLoaded} opciones.route
 * @param {import('vue-router').Router} opciones.router
 * @param {string|number|null|undefined} opciones.idProyecto
 * @param {object|string} opciones.fallback
 * @returns {object|string}
 */
export function resolverVolver({ route, router, idProyecto, fallback }) {
  const crudo = leerVolver(route);
  if (!crudo) return fallback;
  if (!crudo.startsWith("/") || crudo.startsWith("//")) return fallback;

  let resuelta;
  try {
    resuelta = router.resolve(crudo);
  } catch {
    return fallback;
  }

  const nombre = resuelta?.name;
  if (!nombre || !NOMBRES_ORIGEN_PERMITIDOS.has(nombre)) return fallback;

  if (nombre === "dashboard-proyecto") {
    if (
      idProyecto != null &&
      String(resuelta.params?.id ?? "") !== String(idProyecto)
    ) {
      return fallback;
    }

    const tab = primerValor(resuelta.query?.tab);
    if (!tab || !TABS_PROYECTO_PERMITIDAS.has(String(tab))) {
      return fallback;
    }
  }

  return {
    name: nombre,
    params: resuelta.params,
    query: resuelta.query,
    hash: resuelta.hash,
  };
}

/**
 * Agrega `volver` a una location sin perder su query original.
 *
 * @param {object} location
 * @param {string|null|undefined} volver
 * @returns {object}
 */
export function conVolver(location, volver) {
  if (!volver) return location;

  return {
    ...location,
    query: {
      ...(location?.query || {}),
      [CLAVE_VOLVER]: volver,
    },
  };
}
