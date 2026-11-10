import { validarRangoFechas } from "./parametrosPostulaciones.js";

/*
 * Construcción y validación de filtros de UC-46.
 * Se aísla de la vista para poder probarla sin montar componentes.
 */

export { validarRangoFechas };

export const TAMANO_POR_DEFECTO = 20;
export const TAMANO_MAXIMO = 100;

function limpiarTexto(valor) {
  return String(valor ?? "").trim();
}

/**
 * @typedef {Object} FiltrosSolicitudesConexion
 * @property {string} [direccion] RECIBIDA | ENVIADA | "" (ambas)
 * @property {string} [estado] PENDIENTE | ACEPTADA | RECHAZADA
 * @property {boolean} [todosLosEstados] si es true, ignora `estado`
 * @property {string} [nombre]
 * @property {string} [apellido]
 * @property {string} [nombreArtistico]
 * @property {number|string|null} [idProfesion]
 * @property {string} [fechaDesde] YYYY-MM-DD
 * @property {string} [fechaHasta] YYYY-MM-DD
 * @property {number} [pagina] base 0
 * @property {number} [tamano] cantidad de resultados
 */

/**
 * Traduce los filtros de la UI a los query params de
 * `GET /solicitudes-conexion`.
 * @param {FiltrosSolicitudesConexion} [filtros]
 * @returns {Record<string, unknown>}
 */
export function construirParamsSolicitudesConexion(filtros = {}) {
  const {
    direccion,
    estado,
    todosLosEstados = false,
    nombre,
    apellido,
    nombreArtistico,
    idProfesion,
    fechaDesde,
    fechaHasta,
    pagina = 0,
    tamano = TAMANO_POR_DEFECTO,
  } = filtros;

  const params = {};

  if (direccion) params.direccion = direccion;
  if (todosLosEstados) {
    params.todosLosEstados = true;
  } else if (estado) {
    params.estado = estado;
  }

  const textoNombre = limpiarTexto(nombre);
  const textoApellido = limpiarTexto(apellido);
  const textoNombreArtistico = limpiarTexto(nombreArtistico);

  if (textoNombre) params.nombre = textoNombre;
  if (textoApellido) params.apellido = textoApellido;
  if (textoNombreArtistico) params.nombreArtistico = textoNombreArtistico;

  if (idProfesion !== undefined && idProfesion !== null && idProfesion !== "") {
    params.idProfesion = idProfesion;
  }
  if (fechaDesde) params.fechaDesde = fechaDesde;
  if (fechaHasta) params.fechaHasta = fechaHasta;

  params.page = Math.max(0, Number(pagina) || 0);

  const cantidad = Number(tamano);
  const tamanoValido =
    Number.isFinite(cantidad) && cantidad > 0
      ? Math.min(cantidad, TAMANO_MAXIMO)
      : TAMANO_POR_DEFECTO;

  params.size = tamanoValido;
  return params;
}
