/*
 * Utilidades de búsqueda de contratos (UC-68).
 *
 * El backend recibe `estados` como lista repetida
 * (`estados=PENDIENTE_FIRMA&estados=ACTIVO`); `serializarParams` se encarga
 * de ese formato. Si no se envía `estados`, el backend aplica el conjunto por
 * defecto. `BORRADOR` y `ELIMINADO` sólo se piden desde filtros avanzados.
 */

import { serializarParams } from "./queryParams.js";
import { ESTADOS_CONTRATO_POR_DEFECTO } from "./contratoConstants.js";

export const TAMANO_PAGINA_CONTRATOS = 20;
export const TAMANO_MAXIMO_CONTRATOS = 50;

export const OPCIONES_TAMANO_CONTRATOS = [
  { value: 20, text: "20 resultados" },
  { value: 50, text: "50 resultados" },
];

/**
 * Estados iniciales de la búsqueda. Es una copia para evitar mutar la
 * constante compartida.
 * @returns {string[]}
 */
export function estadosContratoPorDefecto() {
  return [...ESTADOS_CONTRATO_POR_DEFECTO];
}

/**
 * Normaliza un valor que puede llegar como string, array o null desde la URL.
 * @param {unknown} valor
 * @returns {string[]}
 */
export function normalizarListaEstados(valor) {
  if (Array.isArray(valor)) {
    return valor.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof valor === "string" && valor.trim()) {
    return valor
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Valida un rango inclusivo por día. Como las fechas viajan como
 * `YYYY-MM-DD`, la comparación lexicográfica es suficiente y evita
 * corrimientos por zona horaria.
 * @param {string|null|undefined} desde
 * @param {string|null|undefined} hasta
 * @returns {string} mensaje de error o cadena vacía
 */
export function validarRangoFechasContrato(desde, hasta) {
  if (!desde || !hasta) return "";
  return String(desde) > String(hasta)
    ? "La fecha desde no puede ser posterior a la fecha hasta."
    : "";
}

/**
 * Valida los dos rangos de la búsqueda de contratos.
 * @param {object} filtros
 * @returns {string}
 */
export function validarRangosBusquedaContrato(filtros = {}) {
  return (
    validarRangoFechasContrato(
      filtros.fechaEmisionDesde,
      filtros.fechaEmisionHasta
    ) ||
    validarRangoFechasContrato(
      filtros.fechaFirmaDesde,
      filtros.fechaFirmaHasta
    )
  );
}

/**
 * Convierte la página solicitada a un entero seguro.
 * @param {unknown} page
 * @returns {number}
 */
export function normalizarPaginaContrato(page) {
  const numero = Number(page);
  return Number.isFinite(numero) && numero > 0 ? Math.floor(numero) : 0;
}

/**
 * Aplica los límites documentados de `size`.
 * @param {unknown} size
 * @returns {number}
 */
export function normalizarTamanoContrato(size) {
  const numero = Number(size);
  if (!Number.isFinite(numero) || numero <= 0) {
    return TAMANO_PAGINA_CONTRATOS;
  }
  return Math.min(TAMANO_MAXIMO_CONTRATOS, Math.floor(numero));
}

/**
 * Construye el objeto de parámetros que consume `contratoService.buscar`.
 * Los valores vacíos se omiten para que el backend aplique sus defaults.
 * @param {object} filtros
 * @returns {Record<string, unknown>}
 */
export function construirParamsBusquedaContrato(filtros = {}) {
  const params = {};

  if (
    filtros.idProyecto !== null &&
    filtros.idProyecto !== undefined &&
    filtros.idProyecto !== ""
  ) {
    const idProyecto = Number(filtros.idProyecto);
    if (Number.isFinite(idProyecto)) params.idProyecto = idProyecto;
  }

  const estados = Array.isArray(filtros.estados)
    ? filtros.estados.map((estado) => String(estado || "").trim()).filter(Boolean)
    : [];
  if (estados.length) params.estados = estados;

  const parte = String(filtros.parte || "").trim();
  if (parte) params.parte = parte;

  if (filtros.fechaEmisionDesde) {
    params.fechaEmisionDesde = filtros.fechaEmisionDesde;
  }
  if (filtros.fechaEmisionHasta) {
    params.fechaEmisionHasta = filtros.fechaEmisionHasta;
  }
  if (filtros.fechaFirmaDesde) {
    params.fechaFirmaDesde = filtros.fechaFirmaDesde;
  }
  if (filtros.fechaFirmaHasta) {
    params.fechaFirmaHasta = filtros.fechaFirmaHasta;
  }

  if (
    filtros.idTipoAcuerdo !== null &&
    filtros.idTipoAcuerdo !== undefined &&
    filtros.idTipoAcuerdo !== ""
  ) {
    const idTipoAcuerdo = Number(filtros.idTipoAcuerdo);
    if (Number.isFinite(idTipoAcuerdo)) {
      params.idTipoAcuerdo = idTipoAcuerdo;
    }
  }

  const nombreContrato = String(filtros.nombreContrato || "").trim();
  if (nombreContrato) params.nombreContrato = nombreContrato;

  if (filtros.miFirmaPendiente === true) {
    params.miFirmaPendiente = true;
  }

  params.page = normalizarPaginaContrato(filtros.page);
  params.size = normalizarTamanoContrato(filtros.size);

  return params;
}

/**
 * Serializa los parámetros para una URL de búsqueda.
 * @param {object} filtros
 * @returns {string}
 */
export function serializarBusquedaContrato(filtros = {}) {
  return serializarParams(construirParamsBusquedaContrato(filtros));
}

/**
 * Compara dos listas de estados sin importar el orden.
 * @param {string[]} a
 * @param {string[]} b
 * @returns {boolean}
 */
export function mismosEstados(a, b) {
  const normalizar = (lista) =>
    [...new Set((Array.isArray(lista) ? lista : []).map(String))].sort();
  const izquierda = normalizar(a);
  const derecha = normalizar(b);
  return (
    izquierda.length === derecha.length &&
    izquierda.every((valor, indice) => valor === derecha[indice])
  );
}
