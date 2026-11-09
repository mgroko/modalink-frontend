/*
 * Construcción de filtros de la red de contactos (UC-44 bis).
 */

export const TAMANO_POR_DEFECTO = 20;
export const TAMANO_MAXIMO = 100;

export const OPCIONES_TAMANO = Object.freeze([
  { value: 20, text: "20 por página" },
  { value: 50, text: "50 por página" },
  { value: 100, text: "100 por página" },
]);

function limpiarTexto(valor) {
  return String(valor ?? "").trim();
}

/**
 * @typedef {Object} FiltrosConexiones
 * @property {string} [texto]
 * @property {string} [nombre]
 * @property {string} [apellido]
 * @property {string} [nombreArtistico]
 * @property {number|string|null} [idProfesion]
 * @property {string} [estadoPresencia] EN_LINEA | DESCONECTADO | ""
 * @property {number} [pagina]
 * @property {number} [tamano]
 */

/**
 * @param {FiltrosConexiones} [filtros]
 * @returns {Record<string, unknown>}
 */
export function construirParamsConexiones(filtros = {}) {
  const {
    texto,
    nombre,
    apellido,
    nombreArtistico,
    idProfesion,
    estadoPresencia,
    pagina = 0,
    tamano = TAMANO_POR_DEFECTO,
  } = filtros;

  const params = {};

  const textoBusqueda = limpiarTexto(texto);
  const nombreTexto = limpiarTexto(nombre);
  const apellidoTexto = limpiarTexto(apellido);
  const nombreArtisticoTexto = limpiarTexto(nombreArtistico);

  if (textoBusqueda) params.texto = textoBusqueda;
  if (nombreTexto) params.nombre = nombreTexto;
  if (apellidoTexto) params.apellido = apellidoTexto;
  if (nombreArtisticoTexto) params.nombreArtistico = nombreArtisticoTexto;

  if (idProfesion !== undefined && idProfesion !== null && idProfesion !== "") {
    params.idProfesion = idProfesion;
  }
  if (estadoPresencia) params.estadoPresencia = estadoPresencia;

  params.page = Math.max(0, Number(pagina) || 0);

  const cantidad = Number(tamano);
  params.size =
    Number.isFinite(cantidad) && cantidad > 0
      ? Math.min(cantidad, TAMANO_MAXIMO)
      : TAMANO_POR_DEFECTO;

  return params;
}
