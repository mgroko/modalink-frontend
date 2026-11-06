/*
 * Construcción y validación de filtros de UC-74 (buscar postulaciones).
 * Se aísla de la vista para poder probarla sin montar componentes.
 */

export const TAMANO_POR_DEFECTO = 20;

/** Tamaños ofrecidos en el selector; 0 = "Ver todas" (`todos=true`). */
export const OPCIONES_TAMANO = [
  { text: "20 por página", value: 20 },
  { text: "50 por página", value: 50 },
  { text: "Ver todas", value: 0 },
];

/**
 * Valida el rango de fechas antes de llamar a la API. Las fechas llegan como
 * `YYYY-MM-DD`, así que la comparación lexicográfica es suficiente.
 * @param {string} [desde]
 * @param {string} [hasta]
 * @returns {string} mensaje de error o "" si es válido
 */
export function validarRangoFechas(desde, hasta) {
  if (!desde || !hasta) return "";
  if (String(desde) > String(hasta)) {
    return "La fecha desde no puede ser posterior a la fecha hasta.";
  }
  return "";
}

/**
 * @typedef {Object} FiltrosPostulaciones
 * @property {string} [estado] PENDIENTE | ACEPTADA | RECHAZADA | "" (todas)
 * @property {string} [tipo] GENERAL | ACTIVIDAD | "" (todos)
 * @property {string} [nombrePerfil]
 * @property {number|string|null} [idProfesion]
 * @property {string} [fechaDesde] YYYY-MM-DD
 * @property {string} [fechaHasta] YYYY-MM-DD
 * @property {number} [pagina] base 0
 * @property {number} [tamano] 0 = todos
 */

/**
 * Traduce los filtros de la UI a los query params de
 * `GET /proyectos/{idProyecto}/postulaciones/buscar`.
 * @param {FiltrosPostulaciones} [filtros]
 * @returns {Record<string, unknown>}
 */
export function construirParamsPostulaciones(filtros = {}) {
  const {
    estado,
    tipo,
    nombrePerfil,
    idProfesion,
    fechaDesde,
    fechaHasta,
    pagina = 0,
    tamano = TAMANO_POR_DEFECTO,
  } = filtros;

  const params = {};

  if (estado) params.estado = estado;
  if (tipo) params.tipo = tipo;

  const nombre = String(nombrePerfil || "").trim();
  if (nombre) params.nombrePerfil = nombre;

  if (idProfesion !== undefined && idProfesion !== null && idProfesion !== "") {
    params.idProfesion = idProfesion;
  }
  if (fechaDesde) params.fechaDesde = fechaDesde;
  if (fechaHasta) params.fechaHasta = fechaHasta;

  const cantidad = Number(tamano);
  if (cantidad === 0) {
    params.todos = true;
    return params;
  }

  params.page = Math.max(0, Number(pagina) || 0);
  params.size = cantidad > 0 ? cantidad : TAMANO_POR_DEFECTO;
  return params;
}

/**
 * Traduce los filtros de "Mis postulaciones" a los query params de
 * `GET /postulaciones/mias` (UC-27).
 * @param {Object} [filtros]
 * @param {number|string} [filtros.idProyecto] acota a un proyecto
 * @param {string} [filtros.estado] PENDIENTE | ACEPTADA | RECHAZADA | "" (todas)
 * @param {string} [filtros.tipo] GENERAL | ACTIVIDAD | "" (todos)
 * @param {number} [filtros.pagina] base 0
 * @param {number} [filtros.tamano] 0 = todos
 * @returns {Record<string, unknown>}
 */
export function construirParamsMisPostulaciones(filtros = {}) {
  const {
    idProyecto,
    estado,
    tipo,
    pagina = 0,
    tamano = TAMANO_POR_DEFECTO,
  } = filtros;

  const params = {};

  if (
    idProyecto !== undefined &&
    idProyecto !== null &&
    idProyecto !== ""
  ) {
    params.idProyecto = idProyecto;
  }
  if (estado) params.estado = estado;
  if (tipo) params.tipo = tipo;

  const cantidad = Number(tamano);
  if (cantidad === 0) {
    params.todos = true;
    return params;
  }

  params.page = Math.max(0, Number(pagina) || 0);
  params.size = cantidad > 0 ? cantidad : TAMANO_POR_DEFECTO;
  return params;
}
