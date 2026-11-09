import http from "./http";
import { serializarParams } from "../utils/queryParams.js";

/*
 * Contrato UC-72/UC-73 — Buscar requerimientos abiertos.
 * Docs: docs/backend/ficha-tecnica-buscar-requerimientos-abiertos.md
 *
 * Estas rutas son globales: el backend resuelve el perfil activo desde la
 * sesión y aplica visibilidad, profesión, cupo y postulaciones previas.
 * El endpoint por proyecto (/proyectos/{id}/requerimientos-actividad/buscar)
 * sigue existiendo para el flujo de invitaciones y no se reemplaza desde acá.
 */

/**
 * @typedef {Object} RequerimientoOportunidadResponse
 * @property {"GENERAL"|"ACTIVIDAD"} tipo
 * @property {number} idRequerimiento
 * @property {number} cantidad
 * @property {string|null} descripcion
 * @property {number} idProfesion
 * @property {string} nombreProfesion
 * @property {number} idProyecto
 * @property {string} nombreProyecto
 * @property {string} estadoProyecto
 * @property {number|null} idActividad solo en ACTIVIDAD
 * @property {string|null} nombreActividad solo en ACTIVIDAD
 * @property {string|null} estadoActividad solo en ACTIVIDAD
 * @property {string|null} fechaInicioProyecto
 * @property {string|null} fechaEntrega
 * @property {string|null} fechaHoraInicioActividad solo en ACTIVIDAD
 * @property {string|null} fechaHoraFinActividad solo en ACTIVIDAD
 * @property {number|null} duracionMinutos solo en ACTIVIDAD
 * @property {number} cubiertos
 * @property {number} faltantes
 * @property {boolean} satisfecho
 * @property {object[]} caracteristicas
 * @property {(number|string|object)[]} habilidades
 * @property {boolean} puedePostularse
 * @property {string|null} motivoNoPostulable PROYECTO_NO_HABILITADO |
 *           PROYECTO_NO_ACEPTA_GENERAL | ACTIVIDAD_NO_PENDIENTE |
 *           MIEMBRO_ACTIVO | DIRECTOR | PROFESION | CUPO
 * @property {boolean} yaPostulado
 * @property {"PENDIENTE"|"ACEPTADA"|"RECHAZADA"|null} estadoPostulacion
 * @property {boolean} requiereVerificacionDisponibilidad
 * @property {object|null} ciudad ubicación del proyecto (CiudadResponse) o null
 */

/**
 * @typedef {Object} PaginaRequerimientosResponse
 * @property {RequerimientoOportunidadResponse[]} contenido
 * @property {number} paginaActual base 0
 * @property {number} tamanoPagina
 * @property {number} totalElementos
 * @property {number} totalPaginas
 * @property {boolean} primera
 * @property {boolean} ultima
 */

/**
 * @typedef {Object} BuscarRequerimientosParams
 * @property {number} [idProfesion]
 * @property {number} [idProyecto]
 * @property {number} [idActividad]
 * @property {string} [texto] proyecto, actividad, descripción o profesión
 * @property {number} [idCaracteristica]
 * @property {number} [idValorCaracteristica]
 * @property {number[]} [idsHabilidades] coincidencia por cualquiera
 * @property {boolean} [soloMiProfesion]
 * @property {boolean} [soloPostulables]
 * @property {boolean} [excluirYaPostulados]
 * @property {string} [provinciaId] id Georef de la provincia del proyecto
 * @property {string} [localidadId] id Georef de la localidad/ciudad del proyecto
 * @property {number} [page] base 0, default 0
 * @property {number} [size] default 20
 * @property {boolean} [todos] true = ignora la paginación
 */

function urlBusqueda(ruta, params) {
  const query = serializarParams(params);
  return query ? `${ruta}?${query}` : ruta;
}

const requerimientoService = {
  /**
   * GET /requerimientos-generales/buscar — UC-72.
   * Lista requerimientos generales abiertos para postularse. Las
   * características y habilidades son filtros informativos: no bloquean la
   * postulación por sí mismos.
   *
   * Errores esperables:
   * - 400 enum o parámetro inválido
   * - 401 sesión ausente/vencida
   * - 404 sin perfil activo o perfil inexistente
   * - 409 perfil inactivo
   * @param {BuscarRequerimientosParams} [params]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: PaginaRequerimientosResponse}>} 200 OK
   */
  buscarGenerales(params = {}, signal) {
    return http.get(urlBusqueda("/requerimientos-generales/buscar", params), {
      signal,
    });
  },

  /**
   * GET /requerimientos-actividad/buscar — UC-73.
   * Lista requerimientos de actividad con la actividad PENDIENTE y cupo
   * disponible. La disponibilidad se valida al postularse.
   *
   * Mismos errores esperables que `buscarGenerales`.
   * @param {BuscarRequerimientosParams} [params]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: PaginaRequerimientosResponse}>} 200 OK
   */
  buscarActividades(params = {}, signal) {
    return http.get(urlBusqueda("/requerimientos-actividad/buscar", params), {
      signal,
    });
  },

  /**
   * Atajo por pestaña del buscador.
   * @param {"GENERAL"|"ACTIVIDAD"|"GENERALES"|"ACTIVIDADES"} tipo
   * @param {BuscarRequerimientosParams} [params]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: PaginaRequerimientosResponse}>}
   */
  buscar(tipo, params = {}, signal) {
    const normalizado = String(tipo || "").toUpperCase();
    return normalizado.startsWith("ACTIVIDAD")
      ? requerimientoService.buscarActividades(params, signal)
      : requerimientoService.buscarGenerales(params, signal);
  },
};

export default requerimientoService;
