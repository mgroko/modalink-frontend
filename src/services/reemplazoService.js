import http from "./http";
import { normalizarTextoReemplazo } from "../utils/reemplazoConstants.js";

/*
 * Contrato del módulo de reemplazo automático.
 *
 * El backend resuelve el perfil activo desde la sesión y valida permisos,
 * estados, disponibilidad y cupo. El frontend sólo envía ids, mensaje y
 * motivo. Todas las rutas y bodies viven acá.
 */

/**
 * @typedef {Object} ReemplazoResumenResponse
 * @property {number} idReemplazo
 * @property {"ACTIVIDAD"|"GENERAL"} tipo
 * @property {number} idProyecto
 * @property {string} nombreProyecto
 * @property {number|null} idActividad
 * @property {string|null} nombreActividad
 * @property {number|null} idRequerimientoActividad
 * @property {number|null} idRequerimientoGeneral
 * @property {string|null} profesion
 * @property {string|null} perfilBaja
 * @property {"BAJA_VOLUNTARIA"|"ELIMINACION"} origen
 * @property {string} estado
 * @property {string} fechaCreacion ISO-8601 local
 * @property {string|null} fechaCierre
 * @property {string|null} motivoCierre
 * @property {number} totalCandidatos
 * @property {number} totalInvitados
 */

/**
 * @typedef {Object} CandidatoReemplazoResponse
 * @property {number} idCandidato
 * @property {number} idPerfil
 * @property {number} idUsuario
 * @property {string} nombreArtistico
 * @property {string|null} nombre
 * @property {string|null} apellido
 * @property {string|null} profesion
 * @property {string|null} fotoUrl
 * @property {object|null} ciudad
 * @property {string[]} habilidades
 * @property {object[]} caracteristicas
 * @property {number|string} puntaje
 * @property {"MISMA_CIUDAD"|"MISMA_PROVINCIA"|"OTRA"} nivelUbicacion
 * @property {boolean} alternativo
 * @property {string[]} faltantes
 * @property {"EXACTA"|"CON_REPROGRAMACION"|"NO_APLICA"|"NO_DISPONIBLE"} tipoDisponibilidad
 * @property {string|null} inicioPropuesto
 * @property {string|null} finPropuesto
 * @property {string} estado
 * @property {string|null} mensaje
 * @property {string|null} fechaInvitacion
 * @property {string|null} fechaRespuesta
 * @property {string|null} fechaDecision
 * @property {string|null} motivoDecision
 */

/**
 * @typedef {Object} ReemplazoDetalleResponse
 * @property {ReemplazoResumenResponse} reemplazo
 * @property {CandidatoReemplazoResponse[]} candidatos
 */

/**
 * @typedef {Object} InvitacionReemplazoResponse
 * @property {number} idCandidato
 * @property {number} idReemplazo
 * @property {"ACTIVIDAD"|"GENERAL"} tipo
 * @property {string} estado
 * @property {number} idProyecto
 * @property {string} nombreProyecto
 * @property {number|null} idActividad
 * @property {string|null} nombreActividad
 * @property {string|null} profesion
 * @property {string|null} fechaInvitacion
 * @property {string|null} fechaHoraInicio
 * @property {number|null} duracionMinutos
 * @property {string|null} mensaje
 */

/**
 * Body JSON para endpoints con motivo opcional.
 *
 * Nunca se envía `null`: algunos endpoints declaran `@RequestBody(required =
 * false)` y un POST sin body JSON puede terminar en 415 antes de llegar al
 * controller.
 *
 * @param {unknown} motivo
 * @returns {{motivo?: string}}
 */
function bodyMotivoOpcional(motivo) {
  const texto = normalizarTextoReemplazo(motivo);
  return texto ? { motivo: texto } : {};
}

const reemplazoService = {
  /**
   * GET /proyectos/{idProyecto}/reemplazos
   * Sólo Director activo del proyecto. Devuelve todos los procesos, sin
   * paginación, ordenados por fecha de creación descendente.
   * @param {number|string} idProyecto
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ReemplazoResumenResponse[]}>}
   */
  listar(idProyecto, signal) {
    return http.get(`/proyectos/${idProyecto}/reemplazos`, { signal });
  },

  /**
   * GET /proyectos/{idProyecto}/reemplazos/{idReemplazo}
   * @param {number|string} idProyecto
   * @param {number|string} idReemplazo
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ReemplazoDetalleResponse}>}
   */
  obtener(idProyecto, idReemplazo, signal) {
    return http.get(
      `/proyectos/${idProyecto}/reemplazos/${idReemplazo}`,
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/reemplazos/{idReemplazo}/confirmar
   * Marca como INVITADO a los candidatos elegidos (deben estar PROPUESTO) y
   * pasa el proceso a INVITACIONES_ENVIADAS.
   * @param {number|string} idProyecto
   * @param {number|string} idReemplazo
   * @param {{idsCandidatos: number[], mensaje?: string}} request
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ReemplazoDetalleResponse}>}
   */
  confirmar(idProyecto, idReemplazo, { idsCandidatos, mensaje } = {}, signal) {
    const ids = Array.isArray(idsCandidatos)
      ? [...new Set(idsCandidatos.map(Number).filter(Number.isFinite))]
      : [];

    return http.post(
      `/proyectos/${idProyecto}/reemplazos/${idReemplazo}/confirmar`,
      {
        idsCandidatos: ids,
        mensaje: normalizarTextoReemplazo(mensaje),
      },
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/reemplazos/{idReemplazo}/regenerar
   * Sólo para procesos SIN_CANDIDATOS.
   * @param {number|string} idProyecto
   * @param {number|string} idReemplazo
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ReemplazoDetalleResponse}>}
   */
  regenerar(idProyecto, idReemplazo, signal) {
    return http.post(
      `/proyectos/${idProyecto}/reemplazos/${idReemplazo}/regenerar`,
      null,
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/reemplazos/{idReemplazo}/cancelar
   * El motivo es opcional (máx. 200).
   * @param {number|string} idProyecto
   * @param {number|string} idReemplazo
   * @param {string} [motivo]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ReemplazoDetalleResponse}>}
   */
  cancelar(idProyecto, idReemplazo, motivo, signal) {
    return http.post(
      `/proyectos/${idProyecto}/reemplazos/${idReemplazo}/cancelar`,
      bodyMotivoOpcional(motivo),
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/reemplazos/{idReemplazo}/candidatos/{idCandidato}/aprobar
   * @param {number|string} idProyecto
   * @param {number|string} idReemplazo
   * @param {number|string} idCandidato
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: CandidatoReemplazoResponse}>}
   */
  aprobarCandidato(idProyecto, idReemplazo, idCandidato, signal) {
    return http.post(
      `/proyectos/${idProyecto}/reemplazos/${idReemplazo}/candidatos/${idCandidato}/aprobar`,
      null,
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/reemplazos/{idReemplazo}/candidatos/{idCandidato}/rechazar
   * El motivo es opcional (máx. 200).
   * @param {number|string} idProyecto
   * @param {number|string} idReemplazo
   * @param {number|string} idCandidato
   * @param {string} [motivo]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: CandidatoReemplazoResponse}>}
   */
  rechazarCandidato(idProyecto, idReemplazo, idCandidato, motivo, signal) {
    return http.post(
      `/proyectos/${idProyecto}/reemplazos/${idReemplazo}/candidatos/${idCandidato}/rechazar`,
      bodyMotivoOpcional(motivo),
      { signal }
    );
  },

  /**
   * GET /reemplazos/invitaciones
   * Devuelve las invitaciones activas del perfil activo:
   * INVITADO y ACEPTADO_PENDIENTE_APROBACION.
   *
   * Puede contener varias invitaciones del mismo `idProyecto` cuando
   * corresponden a actividades o requerimientos distintos. La clave de cada
   * ítem es `idCandidato`, no `idProyecto`.
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: InvitacionReemplazoResponse[]}>}
   */
  listarInvitaciones(signal) {
    return http.get("/reemplazos/invitaciones", { signal });
  },

  /**
   * POST /reemplazos/invitaciones/{idCandidato}/aceptar
   * @param {number|string} idCandidato
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: CandidatoReemplazoResponse}>}
   */
  aceptarInvitacion(idCandidato, signal) {
    return http.post(
      `/reemplazos/invitaciones/${idCandidato}/aceptar`,
      null,
      { signal }
    );
  },

  /**
   * POST /reemplazos/invitaciones/{idCandidato}/rechazar
   * El motivo es opcional (máx. 200).
   * @param {number|string} idCandidato
   * @param {string} [motivo]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: CandidatoReemplazoResponse}>}
   */
  rechazarInvitacion(idCandidato, motivo, signal) {
    return http.post(
      `/reemplazos/invitaciones/${idCandidato}/rechazar`,
      bodyMotivoOpcional(motivo),
      { signal }
    );
  },
};

export default reemplazoService;
